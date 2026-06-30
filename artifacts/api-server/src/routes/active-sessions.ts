import { Router, type Request, type Response } from "express";
import { db } from "@netco/database";
import { activeSessionsTable } from "@netco/database/schema";
import { eq } from "drizzle-orm";
import { authenticateUser } from "../middleware/auth";

const router = Router();

// GET user active sessions
router.get("/:userId", authenticateUser, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Verify user is requesting their own sessions
    if (req.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const sessions = await db
      .select()
      .from(activeSessionsTable)
      .where(eq(activeSessionsTable.userId, userId))
      .orderBy((t) => t.createdAt);

    res.json(sessions);
  } catch (error) {
    console.error("[API] Error fetching active sessions:", error);
    res.status(500).json({ error: "Failed to fetch active sessions" });
  }
});

// DELETE specific session (logout from device)
router.delete("/:userId/:sessionId", authenticateUser, async (req: Request, res: Response) => {
  try {
    const { userId, sessionId } = req.params;

    // Verify user is requesting their own session
    if (req.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Verify session belongs to user
    const session = await db
      .select()
      .from(activeSessionsTable)
      .where(eq(activeSessionsTable.id, sessionId))
      .then((rows) => rows[0]);

    if (!session || session.userId !== userId) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Delete the session
    await db
      .delete(activeSessionsTable)
      .where(eq(activeSessionsTable.id, sessionId));

    res.json({ success: true, message: "Session deleted successfully" });
  } catch (error) {
    console.error("[API] Error deleting session:", error);
    res.status(500).json({ error: "Failed to delete session" });
  }
});

// DELETE all other sessions (logout from all devices)
router.post("/:userId/logout-all-other", authenticateUser, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const currentSessionToken = req.headers.authorization?.split("Bearer ")[1];

    // Verify user is requesting their own sessions
    if (req.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Get current session
    const currentSession = await db
      .select()
      .from(activeSessionsTable)
      .where(eq(activeSessionsTable.sessionToken, currentSessionToken || ""))
      .then((rows) => rows[0]);

    // Delete all sessions except current
    const result = await db
      .delete(activeSessionsTable)
      .where(eq(activeSessionsTable.userId, userId));

    // Re-add current session if it existed
    if (currentSession) {
      await db.insert(activeSessionsTable).values(currentSession);
    }

    res.json({ success: true, message: "All other sessions logged out" });
  } catch (error) {
    console.error("[API] Error logging out from all devices:", error);
    res.status(500).json({ error: "Failed to logout from all devices" });
  }
});

export default router;
