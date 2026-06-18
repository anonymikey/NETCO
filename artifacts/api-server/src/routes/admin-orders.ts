import { Router } from "express";
import { randomUUID } from "crypto";
import { db, ordersTable, configServersTable, userPlansTable } from "@workspace/db";
import { eq, desc, like, or, and } from "drizzle-orm";
import { downloadConfigFile } from "../lib/storage";

const router = Router();

function expiryFromDuration(duration: string): Date {
  const now = new Date();
  if (duration === "daily") now.setDate(now.getDate() + 1);
  else if (duration === "weekly") now.setDate(now.getDate() + 7);
  else now.setMonth(now.getMonth() + 1);
  return now;
}

router.get("/orders", async (req, res) => {
  try {
    const { status, search, limit = "50", offset = "0" } = req.query as Record<string, string>;

    let query = db.select().from(ordersTable).$dynamic();

    const conditions = [];
    if (status && status !== "all") {
      conditions.push(eq(ordersTable.status, status));
    }
    if (search) {
      conditions.push(
        or(
          like(ordersTable.phone, `%${search}%`),
          like(ordersTable.paymentReference, `%${search}%`),
          like(ordersTable.id, `%${search}%`)
        )!
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const orders = await query
      .orderBy(desc(ordersTable.createdAt))
      .limit(Number(limit))
      .offset(Number(offset));

    res.json(orders.map(formatOrder));
  } catch (err) {
    req.log.error({ err, query: req.query }, "Error fetching admin orders");
    const message = err instanceof Error ? err.message : "Failed to fetch orders";
    res.status(500).json({ error: message });
  }
});

router.post("/orders/:id/fulfill", async (req, res) => {
  try {
    const { id } = req.params;
    const { configServerId } = req.body as { configServerId?: string };

    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    let server;
    if (configServerId) {
      const [s] = await db.select().from(configServersTable).where(eq(configServersTable.id, configServerId)).limit(1);
      server = s;
    } else {
      const [s] = await db
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
      server = s;
    }

    if (!server) {
      res.status(422).json({ error: "No matching active config server found for this order" });
      return;
    }

    // Verify config file exists in Supabase Storage
    try {
      await downloadConfigFile(server.filename);
    } catch (err) {
      req.log.error({ err, filename: server.filename }, "Config file not found in storage");
      res.status(422).json({ error: "Config file not found in storage" });
      return;
    }

    const configUrl = `/api/orders/${order.id}/download`;
    const ext = path.extname(server.originalName).toLowerCase();

    await db.update(ordersTable)
      .set({ status: "completed", configUrl })
      .where(eq(ordersTable.id, order.id));

    const existingPlan = await db.select().from(userPlansTable).where(eq(userPlansTable.orderId, order.id)).limit(1);
    if (existingPlan.length === 0) {
      await db.insert(userPlansTable).values({
        id: randomUUID(),
        orderId: order.id,
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

    req.log.info({ orderId: order.id, configServerId: server.id }, "Order fulfilled by admin");
    res.json({ success: true, configUrl });
  } catch (err) {
    req.log.error({ err, orderId: req.params.id }, "Error fulfilling order");
    const message = err instanceof Error ? err.message : "Failed to fulfill order";
    res.status(500).json({ error: message });
  }
});

router.patch("/orders/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body as { status?: string };

    const allowed = ["pending", "completed", "failed", "cancelled"];
    if (!status || !allowed.includes(status)) {
      res.status(400).json({ error: `status must be one of: ${allowed.join(", ")}` });
      return;
    }

    const [updated] = await db.update(ordersTable)
      .set({ status })
      .where(eq(ordersTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    res.json(formatOrder(updated));
  } catch (err) {
    req.log.error({ err, orderId: req.params.id, body: req.body }, "Error updating order status");
    const message = err instanceof Error ? err.message : "Failed to update order status";
    res.status(500).json({ error: message });
  }
});

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
