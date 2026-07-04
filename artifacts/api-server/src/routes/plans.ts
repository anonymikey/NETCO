import { Router } from "express";
import { z } from "zod";
import { db, userPlansTable } from "@workspace/db";
import { eq, or, and, lt } from "drizzle-orm";
import { ListPlansQueryParams } from "@workspace/api-zod";

const router = Router();

const DeletePlanSchema = z.object({
  planId: z.string().uuid(),
});

// Middleware to extract userId from Authorization header
function extractUserId(req: any): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  // In production, decode JWT token here
  // For now, userId should be passed in header or token claim
  return req.headers["x-user-id"] || null;
}

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

// GET user's plans (authenticated endpoint)
router.get("/user-plans", async (req, res) => {
  try {
    const userId = extractUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized: User ID not provided" });
      return;
    }

    const plans = await db
      .select()
      .from(userPlansTable)
      .where(eq(userPlansTable.userId, userId));

    const now = new Date();

    const formatted = plans.map((p) => {
      const expiryDate = p.expiryDate instanceof Date ? p.expiryDate : new Date(p.expiryDate as string);
      const isExpired = expiryDate < now;
      
      return {
        id: p.id,
        userId: p.userId,
        orderId: p.orderId,
        network: p.network,
        planName: p.planName,
        planType: p.planType,
        duration: p.duration,
        appType: p.appType,
        deviceId: p.deviceId,
        phone: p.phone,
        expiryDate: expiryDate.toISOString(),
        createdAt: (p.createdAt instanceof Date ? p.createdAt : new Date(p.createdAt as string)).toISOString(),
        status: isExpired ? "expired" : p.status,
        configUrl: p.configUrl ?? null,
        fileExtension: p.fileExtension ?? null,
        speed: p.speed ?? null,
        instructions: p.instructions ?? null,
      };
    });

    res.json(formatted);
  } catch (err) {
    req.log.error({ err }, "Error retrieving user plans");
    const message = err instanceof Error ? err.message : "Failed to retrieve user plans";
    res.status(500).json({ error: message });
  }
});

// DELETE a plan by ID (only allow if expired, cancelled, or refunded)
router.delete("/:planId", async (req, res) => {
  try {
    const userId = extractUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized: User ID not provided" });
      return;
    }

    const parsed = DeletePlanSchema.safeParse({ planId: req.params.planId });
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid plan ID" });
      return;
    }

    const { planId } = parsed.data;

    // Get the plan first to check eligibility for deletion
    const [plan] = await db
      .select()
      .from(userPlansTable)
      .where(and(eq(userPlansTable.id, planId), eq(userPlansTable.userId, userId)));

    if (!plan) {
      res.status(404).json({ error: "Plan not found" });
      return;
    }

    // Only allow deletion for expired, cancelled, or refunded plans
    const now = new Date();
    const planExpiryDate = plan.expiryDate instanceof Date ? plan.expiryDate : new Date(plan.expiryDate as string);
    const isExpired = planExpiryDate < now;
    const isDeletable = isExpired || plan.status === "cancelled" || plan.status === "refunded";

    if (!isDeletable) {
      res.status(403).json({ 
        error: "Cannot delete this plan. Only expired, cancelled, or refunded plans can be deleted." 
      });
      return;
    }

    // Delete the plan
    await db
      .delete(userPlansTable)
      .where(eq(userPlansTable.id, planId));

    res.json({ success: true, message: "Plan deleted successfully", planId });
  } catch (err) {
    req.log.error({ err, planId: req.params.planId }, "Error deleting plan");
    const message = err instanceof Error ? err.message : "Failed to delete plan";
    res.status(500).json({ error: message });
  }
});

export default router;
