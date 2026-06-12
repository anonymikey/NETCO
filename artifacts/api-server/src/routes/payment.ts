import { Router } from "express";
import { randomUUID } from "crypto";
import { db, ordersTable, configServersTable, userPlansTable, userProfilesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { InitiatePaymentBody } from "@workspace/api-zod";
import path from "path";
import { downloadConfigFile } from "../lib/storage";
import { sendOrderConfirmationEmail } from "../lib/email.js";

const router = Router();

interface MinimalLogger {
  info?: (msg: string) => void;
  warn?: (msg: string) => void;
  error?: (msg: string) => void;
}

const PAYFLOW_BASE = "https://payflow.top/api/v2";
const PAYFLOW_API_KEY = process.env.PAYFLOW_API_KEY ?? "";
const PAYFLOW_API_SECRET = process.env.PAYFLOW_API_SECRET ?? "";
const PAYFLOW_ACCOUNT_ID = Number(process.env.PAYFLOW_ACCOUNT_ID ?? "0");

function payflowHeaders() {
  return {
    "X-API-Key": PAYFLOW_API_KEY,
    "X-API-Secret": PAYFLOW_API_SECRET,
    "Content-Type": "application/json",
  };
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 10) return `254${digits.slice(1)}`;
  if (digits.startsWith("254") && digits.length === 12) return digits;
  if (digits.startsWith("7") && digits.length === 9) return `254${digits}`;
  return digits;
}

function expiryFromDuration(duration: string): Date {
  const now = new Date();
  if (duration === "daily") now.setDate(now.getDate() + 1);
  else if (duration === "weekly") now.setDate(now.getDate() + 7);
  else now.setMonth(now.getMonth() + 1);
  return now;
}

async function autoFulfillOrder(orderId: string, logger: MinimalLogger) {
  try {
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
    if (!order || order.configUrl) return;

    const [server] = await db
      .select()
      .from(configServersTable)
      .where(
        and(
          eq(configServersTable.network, order.network),
          eq(configServersTable.appType, order.appType),
          eq(configServersTable.duration, order.duration),
          eq(configServersTable.status, "active")
        )
      )
      .limit(1);

    if (!server) {
      logger.warn?.(`No matching config server for order ${orderId}`);
      return;
    }

    // Verify file exists in Supabase Storage
    try {
      await downloadConfigFile(server.filename);
    } catch {
      logger.warn?.(`Config file missing in storage for server ${server.id}`);
      return;
    }

    const configUrl = `/api/orders/${orderId}/download`;
    const ext = path.extname(server.originalName).toLowerCase();

    await db.update(ordersTable)
      .set({ status: "completed", configUrl })
      .where(eq(ordersTable.id, orderId));

    const existing = await db.select().from(userPlansTable).where(eq(userPlansTable.orderId, orderId)).limit(1);
    if (existing.length === 0) {
      await db.insert(userPlansTable).values({
        id: randomUUID(),
        orderId,
        network: order.network,
        planName: server.serverName,
        planType: server.planType,
        duration: order.duration,
        appType: order.appType,
        deviceId: order.deviceId,
        phone: order.phone,
        expiryDate: expiryFromDuration(order.duration),
        status: "active",
        configUrl,
        fileExtension: ext,
      });
    }

    logger.info?.(`Auto-fulfilled order ${orderId} with config ${server.serverName}`);
  } catch (err) {
    logger.error?.(`Auto-fulfill failed for order ${orderId}: ${err}`);
  }
}

async function sendOrderConfirmationAfterFulfillment(orderId: string, logger: MinimalLogger): Promise<void> {
  try {
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
    if (!order || order.status !== "completed") {
      return;
    }

    // Prevent duplicate emails
    if (order.orderConfirmationSent) {
      logger.info?.(`Order confirmation already sent for ${orderId}, skipping`);
      return;
    }

    // Get customer profile for name and email
    const profile = await db
      .select({
        email: userProfilesTable.email,
        fullName: userProfilesTable.fullName,
      })
      .from(userProfilesTable)
      .where(eq(userProfilesTable.phone, order.phone))
      .limit(1);

    const customerEmail = profile[0]?.email;

    // Validate email - reject phone numbers or missing emails
    if (!customerEmail || !customerEmail.includes("@")) {
      logger.warn?.({ orderId, phone: order.phone }, "No valid email found for order, skipping confirmation email");
      // Mark as sent anyway to avoid retry loop
      await db.update(ordersTable)
        .set({ orderConfirmationSent: true, orderConfirmationSentAt: new Date() })
        .where(eq(ordersTable.id, orderId));
      return;
    }

    const customerName = profile[0]?.fullName ?? undefined;

    // Get server info for plan name
    const [server] = await db
      .select()
      .from(configServersTable)
      .where(
        and(
          eq(configServersTable.network, order.network),
          eq(configServersTable.appType, order.appType),
          eq(configServersTable.duration, order.duration),
          eq(configServersTable.status, "active")
        )
      )
      .limit(1);

    const planName = server?.serverName ?? `${order.network} - ${order.duration.charAt(0).toUpperCase() + order.duration.slice(1)}`;

    await sendOrderConfirmationEmail({
      email: customerEmail,
      fullName: customerName,
      orderId,
      planName,
      network: order.network.charAt(0).toUpperCase() + order.network.slice(1),
      amount: Number(order.amount),
      createdAt: order.createdAt,
    });

    // Mark email as sent atomically
    await db.update(ordersTable)
      .set({ orderConfirmationSent: true, orderConfirmationSentAt: new Date() })
      .where(eq(ordersTable.id, orderId));

    logger.info?.(`Order confirmation email sent for order ${orderId} to ${customerEmail}`);
  } catch (err) {
    logger.error?.(`Failed to send order confirmation email for order ${orderId}: ${err}`);
    // Don't throw - email failures should not affect payment flow
  }
}

router.post("/initiate", async (req, res) => {
  try {
    const parsed = InitiatePaymentBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
      return;
    }

    const { phone, amount, orderId } = parsed.data;
    const phoneFormatted = normalizePhone(phone);

    // Validate amount (PayFlow minimum is 1 KES)
    if (Number(amount) < 1) {
      res.status(400).json({ error: "Invalid amount", message: "Amount must be at least KES 1" });
      return;
    }

    // Check if payment already initiated for this order
    const [existingOrder] = await db.select().from(ordersTable)
      .where(eq(ordersTable.id, orderId))
      .limit(1);

    if (existingOrder?.paymentReference) {
      res.status(400).json({
        error: "Payment already initiated",
        message: "This order already has a pending payment",
        paymentReference: existingOrder.paymentReference,
      });
      return;
    }

    const reference = `NETCO-${randomUUID().slice(0, 8).toUpperCase()}`;

    req.log.info({ phone: phoneFormatted, amount, orderId, reference }, "Initiating PayFlow STK push");

    const body = {
      payment_account_id: PAYFLOW_ACCOUNT_ID,
      phone: phoneFormatted,
      amount: Number(amount),
      reference,
      description: `NETCO VPN Config — Order ${orderId}`,
    };

    const pfRes = await fetch(`${PAYFLOW_BASE}/stkpush.php`, {
      method: "POST",
      headers: payflowHeaders(),
      body: JSON.stringify(body),
    });

    const pfData = (await pfRes.json()) as {
      success: boolean;
      message?: string;
      error_code?: string;
      checkout_request_id?: string;
      data?: { checkout_request_id?: string };
    };

    req.log.info({ pfData, status: pfRes.status }, "PayFlow STK response");

    if (!pfRes.ok || !pfData.success) {
      const errorCode = pfData.error_code || "UNKNOWN";
      const errorMap: Record<string, { status: number; message: string }> = {
        "AUTH_FAILED": { status: 503, message: "Payment service authentication failed. Contact support." },
        "INVALID_PHONE": { status: 400, message: "Phone number format is invalid. Use Kenyan format." },
        "INVALID_AMOUNT": { status: 400, message: "Amount must be at least KES 1" },
        "ACCOUNT_NOT_FOUND": { status: 503, message: "Payment account not configured. Contact support." },
        "RATE_LIMITED": { status: 429, message: "Too many payment requests. Please try again in a moment." },
        "MPESA_ERROR": { status: 502, message: "M-Pesa service error. Please try again shortly." },
      };

      const error = errorMap[errorCode] || { status: 502, message: pfData.message ?? "Payment initiation failed" };
      res.status(error.status).json({
        error: errorCode,
        message: error.message,
      });
      return;
    }

    const checkoutRequestId =
      pfData.checkout_request_id ?? pfData.data?.checkout_request_id ?? `WS_CO_${Date.now()}`;

    await db
      .update(ordersTable)
      .set({ paymentReference: reference, status: "pending" })
      .where(eq(ordersTable.id, orderId));

    res.json({
      success: true,
      reference,
      checkoutRequestId,
      message: `M-Pesa STK Push sent to ${phone}. Enter your PIN on your phone.`,
    });
  } catch (err) {
    req.log.error({ err, body: req.body }, "PayFlow request failed");
    res.status(503).json({ error: "Payment service unreachable. Please try again shortly." });
  }
});

router.get("/status/:reference", async (req, res) => {
  const { reference } = req.params;

  try {
    const pfRes = await fetch(`${PAYFLOW_BASE}/status.php`, {
      method: "POST",
      headers: payflowHeaders(),
      body: JSON.stringify({ checkout_request_id: reference }),
    });

    const pfData = (await pfRes.json()) as {
      success: boolean;
      message?: string;
      error_code?: string;
      status?: string;
      data?: {
        status?: string;
        transaction_code?: string;
        amount?: number;
        completed_at?: string;
      };
    };

    req.log.info({ pfData, reference }, "PayFlow status check");

    if (!pfRes.ok || !pfData.success) {
      const errorCode = pfData.error_code || "UNKNOWN";
      res.status(pfRes.status || 502).json({
        reference,
        status: "error",
        message: pfData.message ?? "Failed to check payment status",
        error: errorCode,
      });
      return;
    }

    const rawStatus = (pfData.data?.status ?? pfData.status ?? "pending").toLowerCase();

    let mappedStatus: "pending" | "completed" | "failed" | "cancelled";
    if (rawStatus === "completed" || rawStatus === "success") {
      mappedStatus = "completed";
    } else if (rawStatus === "failed" || rawStatus === "error") {
      mappedStatus = "failed";
    } else if (rawStatus === "cancelled") {
      mappedStatus = "cancelled";
    } else {
      mappedStatus = "pending";
    }

    let configUrl: string | null = null;

    if (mappedStatus === "completed") {
      const [order] = await db
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.paymentReference, reference))
        .limit(1);

      if (order) {
        if (order.status !== "completed") {
          await autoFulfillOrder(order.id, req.log as MinimalLogger);
        }
        // Send confirmation email if not already sent
        if (!order.orderConfirmationSent) {
          await sendOrderConfirmationAfterFulfillment(order.id, req.log as MinimalLogger);
        }
        const [freshOrder] = await db.select().from(ordersTable).where(eq(ordersTable.id, order.id)).limit(1);
        configUrl = freshOrder?.configUrl ?? null;
      }
    }

    res.json({
      reference,
      status: mappedStatus,
      message: pfData.message ?? null,
      completedAt: pfData.data?.completed_at ?? null,
      transactionCode: pfData.data?.transaction_code ?? null,
      configUrl,
    });
  } catch (err) {
    req.log.error({ err, reference }, "PayFlow status check failed");
    res.status(503).json({
      reference,
      status: "error",
      message: "Failed to check payment status. Please try again.",
      error: "SERVICE_UNAVAILABLE",
    });
  }
});

export default router;
