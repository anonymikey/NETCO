import { Router, type Request, type Response } from "express";
import { db, emailLogsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

// GET user email logs
router.get("/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Verify user is requesting their own logs
    if (req.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const logs = await db
      .select()
      .from(emailLogsTable)
      .where(eq(emailLogsTable.userId, userId))
      .orderBy(desc(emailLogsTable.createdAt))
      .limit(Number(limit))
      .offset(Number(offset));

    const totalCount = await db
      .select()
      .from(emailLogsTable)
      .where(eq(emailLogsTable.userId, userId))
      .then((rows) => rows.length);

    res.json({
      logs,
      total: totalCount,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    console.error("[API] Error fetching email logs:", error);
    res.status(500).json({ error: "Failed to fetch email logs" });
  }
});

// GET email log by ID
router.get("/:userId/:emailId", async (req: Request, res: Response) => {
  try {
    const { userId, emailId } = req.params;

    // Verify user is requesting their own log
    if (req.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const log = await db
      .select()
      .from(emailLogsTable)
      .where(eq(emailLogsTable.id, emailId))
      .then((rows) => rows[0]);

    if (!log) {
      return res.status(404).json({ error: "Email log not found" });
    }

    if (log.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.json(log);
  } catch (error) {
    console.error("[API] Error fetching email log:", error);
    res.status(500).json({ error: "Failed to fetch email log" });
  }
});

// Admin: Get all email logs (for dashboard)
router.get("/admin/all-logs", async (req: Request, res: Response) => {
  try {
    // In real app, check for admin role
    // if (req.userRole !== "admin") return res.status(403).json({ error: "Unauthorized" });

    const { limit = 100, offset = 0, emailType, resendStatus } = req.query;

    let query = db.select().from(emailLogsTable);

    if (emailType) {
      query = query.where(eq(emailLogsTable.emailType, String(emailType)));
    }

    if (resendStatus) {
      query = query.where(eq(emailLogsTable.resendStatus, String(resendStatus)));
    }

    const logs = await query
      .orderBy(desc(emailLogsTable.createdAt))
      .limit(Number(limit))
      .offset(Number(offset));

    res.json({
      logs,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    console.error("[API] Error fetching admin email logs:", error);
    res.status(500).json({ error: "Failed to fetch email logs" });
  }
});

export default router;
