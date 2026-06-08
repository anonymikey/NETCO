import { Router } from "express";
import { db } from "@workspace/db";
import { notifications } from "@workspace/db/schema";
import { eq, desc, and } from "drizzle-orm";

const router = Router();

// Get admin notifications
router.get("/admin/notifications", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const adminNotifications = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.type, "system")
        )
      )
      .orderBy(desc(notifications.createdAt))
      .limit(20);

    const formatted = adminNotifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      severity: (n.data as any)?.severity || "info",
      isRead: n.read,
      createdAt: n.createdAt,
      data: n.data,
    }));

    res.json(formatted);
  } catch (error) {
    req.log.error(error, "Failed to fetch admin notifications");
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Mark admin notification as read
router.patch("/admin/notifications/:id/read", async (req, res) => {
  try {
    const userId = req.user?.id;
    const notificationId = req.params.id;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const [updated] = await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }

    res.json(updated);
  } catch (error) {
    req.log.error(error, "Failed to mark notification as read");
    res.status(500).json({ error: "Failed to update notification" });
  }
});

// Mark all admin notifications as read
router.patch("/admin/notifications/read-all", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));

    res.json({ success: true });
  } catch (error) {
    req.log.error(error, "Failed to mark all as read");
    res.status(500).json({ error: "Failed to update notifications" });
  }
});

// Get active users count
router.get("/admin/active-users", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Get count of users with recent activity (last 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    
    const result = await db
      .select({ count: db.sql<number>`count(*)` })
      .from(db.raw(`(
        SELECT DISTINCT user_id FROM orders 
        WHERE created_at > $1
        UNION
        SELECT DISTINCT user_id FROM user_plans 
        WHERE updated_at > $2
      ) as active_users`, [fifteenMinutesAgo, fifteenMinutesAgo]));

    const count = Number((result[0] as any)?.count || 0);

    res.json({ count });
  } catch (error) {
    req.log.error(error, "Failed to fetch active users");
    // Return 0 if there's an error rather than failing
    res.json({ count: 0 });
  }
});

// Create admin notification (for sending to admins)
router.post("/admin/notifications/create", async (req, res) => {
  try {
    const { userId, title, message, type, severity, data } = req.body;

    if (!userId || !title || !message) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const [notification] = await db
      .insert(notifications)
      .values({
        userId,
        title,
        message,
        type: type || "system",
        read: false,
        data: { severity: severity || "info", ...data },
      })
      .returning();

    res.json(notification);
  } catch (error) {
    req.log.error(error, "Failed to create notification");
    res.status(500).json({ error: "Failed to create notification" });
  }
});

export default router;
