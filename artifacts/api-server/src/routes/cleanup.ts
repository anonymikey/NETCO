import { Router } from "express";
import { db, userPlansTable } from "@workspace/db";
import { lt, eq } from "drizzle-orm";

const router = Router();

/**
 * Cleanup endpoint to remove plans that have been expired for more than 2 days
 * This should be called via a scheduled cron job (e.g., Vercel Cron)
 * 
 * Usage: POST /api/cleanup with optional x-cron-secret header for verification
 */
router.post("/", async (req, res) => {
  try {
    // Optional: Verify the request is coming from a trusted cron service
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const headerSecret = req.headers["x-cron-secret"];
      if (headerSecret !== cronSecret) {
        res.status(401).json({ error: "Unauthorized: Invalid cron secret" });
        return;
      }
    }

    // Calculate the cutoff date: 2 days ago
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // Find all plans that have been expired for more than 2 days
    // Condition: expiryDate < (now - 2 days) AND status is 'expired' or 'cancelled' or 'refunded'
    const plansToDelete = await db
      .select({ id: userPlansTable.id })
      .from(userPlansTable)
      .where(lt(userPlansTable.expiryDate, twoDaysAgo));

    if (plansToDelete.length === 0) {
      res.json({
        success: true,
        message: "No plans to cleanup",
        deletedCount: 0,
      });
      return;
    }

    // Delete all identified plans
    const deleteIds = plansToDelete.map((p) => p.id);
    
    let deletedCount = 0;
    for (const planId of deleteIds) {
      await db
        .delete(userPlansTable)
        .where(eq(userPlansTable.id, planId));
      deletedCount++;
    }

    res.json({
      success: true,
      message: `Successfully deleted ${deletedCount} expired plan(s)`,
      deletedCount,
    });
  } catch (err) {
    req.log.error({ err }, "Error during cleanup");
    const message = err instanceof Error ? err.message : "Failed to cleanup expired plans";
    res.status(500).json({ error: message });
  }
});

export default router;
