import { Router, type Request } from "express";
import { randomUUID } from "crypto";
import { db, ordersTable, configServersTable, userPlansTable, userProfilesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreateOrderBody } from "@workspace/api-zod";
import path from "path";
import { downloadConfigFile, getSupabaseAdmin } from "../lib/storage";

const router = Router();
const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3001";

async function resolveUserIdFromRequest(req: Request): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice("Bearer ".length);
  const { data: { user }, error } = await getSupabaseAdmin().auth.getUser(token);
  if (error || !user) return null;

  const [profile] = await db
    .select({ id: userProfilesTable.id })
    .from(userProfilesTable)
    .where(eq(userProfilesTable.supabaseUid, user.id))
    .limit(1);

  return profile?.id ?? null;
}

function expiryFromDuration(duration: string): Date {
  const now = new Date();
  if (duration === "daily") now.setDate(now.getDate() + 1);
  else if (duration === "weekly") now.setDate(now.getDate() + 7);
  else now.setMonth(now.getMonth() + 1);
  return now;
}

router.post("/", async (req, res) => {
  try {
    const parsed = CreateOrderBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
      return;
    }

    const userId = await resolveUserIdFromRequest(req);
    if (!userId) {
      res.status(401).json({ error: "Authentication required. Sign in and try again." });
      return;
    }

    const body = parsed.data;
    const id = randomUUID();
    const amount = body.amount ?? calculateAmount(body.network, body.duration);

    const [order] = await db
      .insert(ordersTable)
      .values({
        id,
        userId,
        packageId: body.packageId,
        network: body.network,
        duration: body.duration,
        appType: body.appType,
        deviceId: body.deviceId,
        phone: body.phone,
        amount: String(amount),
        status: "pending",
      })
      .returning();

    res.status(201).json(formatOrder(order));
  } catch (err) {
    req.log.error({ err, body: req.body }, "Error creating order");
    const message = err instanceof Error ? err.message : "Failed to create order";
    res.status(500).json({ error: message });
  }
});

router.post("/free", async (req, res) => {
  try {
    const userId = await resolveUserIdFromRequest(req);
    if (!userId) {
      res.status(401).json({ error: "Authentication required. Sign in and try again." });
      return;
    }

    const { packageId, network, duration, appType, deviceId, phone } = req.body as {
      packageId?: string;
      network?: string;
      duration?: string;
      appType?: string;
      deviceId?: string;
      phone?: string;
    };

    if (!network || !duration || !appType || !deviceId || !phone) {
      res.status(400).json({ error: "Missing required fields: network, duration, appType, deviceId, phone" });
      return;
    }

    const [freeServer] = await db
      .select()
      .from(configServersTable)
      .where(
        and(
          eq(configServersTable.network, network),
          eq(configServersTable.appType, appType),
          eq(configServersTable.duration, duration),
          eq(configServersTable.status, "active"),
          eq(configServersTable.isFree, true)
        )
      )
      .limit(1);

    if (!freeServer) {
      res.status(404).json({ error: "No free config available for this combination" });
      return;
    }

    const orderId = randomUUID();
    const configUrl = `${API_BASE_URL}/api/orders/${orderId}/download`;
    const ext = path.extname(freeServer.originalName).toLowerCase();

    const [order] = await db.insert(ordersTable).values({
      id: orderId,
      userId,
      packageId: packageId ?? freeServer.id,
      network,
      duration,
      appType,
      deviceId,
      phone,
      amount: "0",
      status: "completed",
      configUrl,
    }).returning();

    // TODO: Implement user plan creation for free configs
    // Temporarily skipping user_plans insert until schema is finalized

    res.status(201).json({ ...formatOrder(order), configUrl });
  } catch (err) {
    req.log.error({ err, body: req.body }, "Error creating free order");
    const message = err instanceof Error ? err.message : "Failed to create free order";
    res.status(500).json({ error: message });
  }
});

router.get("/:id", async (req, res) => {
  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, req.params.id))
    .limit(1);

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json(formatOrder(order));
});

router.get("/:id/download", async (req, res) => {
  const { id } = req.params;

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  if (order.status !== "completed") {
    res.status(403).json({ error: "Order not completed yet" });
    return;
  }

  // Try to get server by configServerId (new flow for fulfilled orders)
  let [server] = order.configServerId 
    ? await db
        .select()
        .from(configServersTable)
        .where(eq(configServersTable.id, order.configServerId))
        .limit(1)
    : [null];

  // Fallback to matching by order attributes (legacy free configs)
  if (!server) {
    const [legacyServer] = await db
      .select()
      .from(configServersTable)
      .where(
        and(
          eq(configServersTable.network, order.network),
          eq(configServersTable.appType, order.appType),
          eq(configServersTable.duration, order.duration),
          eq(configServersTable.status, "active"),
          eq(configServersTable.isFree, true)
        )
      )
      .limit(1);
    server = legacyServer;
  }

  if (!server) {
    res.status(404).json({ error: "Config server not found for this order" });
    return;
  }

  const buffer = await downloadConfigFile(server.filename);

  res.setHeader("Content-Disposition", `attachment; filename="${server.originalName}"`);
  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Content-Length", buffer.byteLength);
  res.send(buffer);
});

function calculateAmount(network: string, duration: string): number {
  const prices: Record<string, Record<string, number>> = {
    safaricom: { daily: 80, weekly: 350, monthly: 1000 },
    airtel: { daily: 70, weekly: 300, monthly: 900 },
    telkom: { daily: 60, weekly: 250, monthly: 750 },
  };
  return prices[network.toLowerCase()]?.[duration] ?? 80;
}

function formatOrder(order: typeof ordersTable.$inferSelect) {
  return {
    id: order.id,
    packageId: order.packageId,
    network: order.network,
    duration: order.duration,
    appType: order.appType,
    deviceId: order.deviceId,
    phone: order.phone,
    amount: Number(order.amount),
    status: order.status,
    paymentReference: order.paymentReference ?? null,
    configUrl: order.configUrl ?? null,
    createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : String(order.createdAt),
    updatedAt: order.updatedAt instanceof Date ? order.updatedAt.toISOString() : null,
  };
}

export default router;
