import { Router } from "express";
import { db } from "@workspace/db";
import { notifications } from "@workspace/db/schema";
import { eq, desc, and } from "drizzle-orm";

const router = Router();

// Get all notifications for current user
router.get("/notifications", async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const userNotifications = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(50);

      res.json(userNotifications);
    } catch (error) {
      req.log.error(error, "Failed to fetch notifications");
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

// Get unread notification count
router.get("/notifications/count/unread", async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const result = await db
        .select()
        .from(notifications)
        .where(
          eq(notifications.userId, userId) &&
            eq(notifications.isRead, false)
        );

      res.json({ unreadCount: result.length });
    } catch (error) {
      req.log.error(error, "Failed to get unread count");
      res.status(500).json({ error: "Failed to get unread count" });
    }
  });

  // Mark notification as read
router.patch("/notifications/:id/read", async (req, res) => {
    try {
      const userId = req.user?.id;
      const notificationId = req.params["id"] as string;

      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const [updated] = await db
        .update(notifications)
        .set({ isRead: true, updatedAt: new Date() })
        .where(eq(notifications.id, notificationId))
        .returning();

      if (!updated || updated.userId !== userId) {
        res.status(404).json({ error: "Notification not found" });
        return;
      }

      res.json(updated);
    } catch (error) {
      req.log.error(error, "Failed to mark notification as read");
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // Mark all notifications as read
router.patch("/notifications/read-all", async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      await db
        .update(notifications)
        .set({ isRead: true, updatedAt: new Date() })
        .where(eq(notifications.userId, userId));

      res.json({ success: true });
    } catch (error) {
      req.log.error(error, "Failed to mark all notifications as read");
      res
        .status(500)
        .json({ error: "Failed to mark all notifications as read" });
    }
  });

  // Delete a notification
router.delete("/notifications/:id", async (req, res) => {
    try {
      const userId = req.user?.id;
      const notificationId = req.params["id"] as string;

      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const [notif] = await db
        .select()
        .from(notifications)
        .where(eq(notifications.id, notificationId));

      if (!notif || notif.userId !== userId) {
        res.status(404).json({ error: "Notification not found" });
        return;
      }

      await db.delete(notifications).where(eq(notifications.id, notificationId));

      res.json({ success: true });
    } catch (error) {
      req.log.error(error, "Failed to delete notification");
      res.status(500).json({ error: "Failed to delete notification" });
    }
  });

  // Admin: Create notification for users
router.post("/admin/notifications", async (req, res) => {
    try {
      // Verify admin role - adjust this based on your auth implementation
      if (req.user?.role !== "admin") {
        res.status(403).json({ error: "Forbidden" });
        return;
      }

      const { userId, title, message, type, icon, actionUrl, data } = req.body as {
        userId?: string;
        title: string;
        message: string;
        type: "server_added" | "upgrade" | "maintenance" | "alert" | "promotion";
        icon?: string;
        actionUrl?: string;
        data?: any;
      };

      // If userId is not specified, create for all users (broadcast)
      let createdNotifications = [];

      if (userId) {
        const [created] = await db
          .insert(notifications)
          .values({
            userId,
            title,
            message,
            type,
            icon,
            actionUrl,
            data,
          })
          .returning();
        createdNotifications.push(created);
      } else {
        // Get all user IDs and create notifications for each
        req.log.info("Creating broadcast notification for all users");
        createdNotifications.push({
          title,
          message,
          type,
          isGlobal: true,
        });
      }

      res.status(201).json(createdNotifications);
      req.log.info(
        { title, type, userId, isBroadcast: !userId },
        "Notification created"
      );
    } catch (error) {
      req.log.error(error, "Failed to create notification");
      res.status(500).json({ error: "Failed to create notification" });
    }
  });

  // Admin: Get all notifications (for management)
router.get("/admin/notifications", async (req, res) => {
    try {
      if (req.user?.role !== "admin") {
        res.status(403).json({ error: "Forbidden" });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 100;
      const allNotifications = await db
        .select()
        .from(notifications)
        .orderBy(desc(notifications.createdAt))
        .limit(limit);

      res.json(allNotifications);
    } catch (error) {
      req.log.error(error, "Failed to fetch admin notifications");
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

export default router;
