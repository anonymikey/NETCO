import { Router } from "express";
import { db, userPlansTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import { ListPlansQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const parsed = ListPlansQueryParams.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid query params" });
      return;
    }

    const { phone, deviceId } = parsed.data;

    if (!phone && !deviceId) {
      res.json([]);
      return;
    }

    let plans;
    if (phone && deviceId) {
      plans = await db
        .select()
        .from(userPlansTable)
        .where(or(eq(userPlansTable.phone, phone), eq(userPlansTable.deviceId, deviceId)));
    } else if (phone) {
      plans = await db.select().from(userPlansTable).where(eq(userPlansTable.phone, phone));
    } else {
      plans = await db.select().from(userPlansTable).where(eq(userPlansTable.deviceId, deviceId!));
    }

    const now = new Date();

    const formatted = plans.map((p) => ({
      id: p.id,
      network: p.network,
      planName: p.planName,
      planType: p.planType,
      duration: p.duration,
      appType: p.appType,
      deviceId: p.deviceId,
      expiryDate: p.expiryDate instanceof Date ? p.expiryDate.toISOString() : String(p.expiryDate),
      status: p.expiryDate instanceof Date && p.expiryDate < now ? "expired" : p.status,
      configUrl: p.configUrl ?? null,
      fileExtension: p.fileExtension ?? null,
      speed: p.speed ?? null,
      instructions: p.instructions ?? null,
    }));

    res.json(formatted);
  } catch (err) {
    req.log.error({ err, query: req.query }, "Error retrieving plans");
    const message = err instanceof Error ? err.message : "Failed to retrieve plans";
    res.status(500).json({ error: message });
  }
});

export default router;
