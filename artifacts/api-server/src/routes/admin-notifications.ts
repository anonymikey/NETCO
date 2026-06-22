import { Router } from "express";
import { requireAdmin } from "../middleware/auth";
import { db, notificationsTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import {
  broadcastNotification,
  createNotification,
  createNotificationForUsers,
  type NotificationType,
} from "../lib/notifications";
import { z } from "zod";

const router = Router();

const sendNotificationSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  type: z.enum(["info", "success", "warning", "error", "order", "payment", "plan"]).default("info"),
});

const sendToUsersSchema = z.object({
  userIds: z.array(z.string()).min(1),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  type: z.enum(["info", "success", "warning", "error", "order", "payment", "plan"]).default("info"),
});

// Broadcast notification to all users
router.post("/notifications/broadcast", requireAdmin, async (req, res) => {
  try {
    const body = sendNotificationSchema.parse(req.body);

    const result = await broadcastNotification(body.title, body.message, body.type as NotificationType);

    res.json({
      success: true,
      message: `Notification sent to ${result.created} users`,
      created: result.created,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid input", details: error.errors });
      return;
    }
    res.status(500).json({ error: "Failed to broadcast notification" });
  }
});

// Send notification to specific user
router.post("/notifications/send-to-user", requireAdmin, async (req, res) => {
  try {
    const schema = z.object({
      userId: z.string().min(1),
      title: z.string().min(1).max(200),
      message: z.string().min(1).max(1000),
      type: z.enum(["info", "success", "warning", "error", "order", "payment", "plan"]).default("info"),
    });

    const body = schema.parse(req.body);

    const result = await createNotification(body.userId, body.title, body.message, body.type as NotificationType);

    res.json({
      success: true,
      message: "Notification sent to user",
      notification: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid input", details: error.errors });
      return;
    }
    res.status(500).json({ error: "Failed to send notification" });
  }
});

// Send notification to multiple users
router.post("/notifications/send-to-users", requireAdmin, async (req, res) => {
  try {
    const body = sendToUsersSchema.parse(req.body);

    const result = await createNotificationForUsers(
      body.userIds,
      body.title,
      body.message,
      body.type as NotificationType
    );

    res.json({
      success: true,
      message: `Notification sent to ${result.created} users`,
      created: result.created,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid input", details: error.errors });
      return;
    }
    res.status(500).json({ error: "Failed to send notifications" });
  }
});

// Get recent notifications sent by admin (for logging)
router.get("/notifications", requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;

    const notifications = await db
      .select()
      .from(notificationsTable)
      .orderBy(desc(notificationsTable.createdAt))
      .limit(limit)
      .offset(offset);

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

export default router;
