import { Router, type Request, type Response } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { markNotificationRead, markAllNotificationsRead, getNotifications, getUnreadCount } from "../lib/notifications";

const router = Router();

// Helper to extract userId from auth header
function getUserIdFromAuth(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  
  // Format: "Bearer userId"
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer") return null;
  
  return token || null;
}

// Get all notifications for authenticated user
router.get("/", async (req, res) => {
  try {
    const userId = getUserIdFromAuth(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const notifications = await getNotifications(userId, limit, offset);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Get unread count for authenticated user
router.get("/unread-count", async (req, res) => {
  try {
    const userId = getUserIdFromAuth(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const count = await getUnreadCount(userId);
    res.json({ count });
  } catch (error) {
    console.error("[v0] Unread count error:", error);
    res.status(500).json({ error: "Failed to fetch unread count" });
  }
});

// Mark single notification as read
router.post("/:id/read", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserIdFromAuth(req);

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Verify notification belongs to user
    const [notification] = await db
      .select()
      .from(notificationsTable)
      .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, userId)));

    if (!notification) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }

    await markNotificationRead(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

// Mark all notifications as read
router.post("/read-all", async (req, res) => {
  try {
    const userId = getUserIdFromAuth(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    await markAllNotificationsRead(userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to mark notifications as read" });
  }
});

export default router;
