import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { db } from "@netco/database";
import { notificationPreferencesTable } from "@netco/database/schema";
import { eq } from "drizzle-orm";
import { authenticateUser } from "../middleware/auth";

const router = Router();

// GET user notification preferences
router.get("/:userId", authenticateUser, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Verify user is requesting their own preferences
    if (req.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const preferences = await db
      .select()
      .from(notificationPreferencesTable)
      .where(eq(notificationPreferencesTable.userId, userId))
      .then((rows) => rows[0]);

    if (!preferences) {
      // Return defaults if preferences don't exist yet
      return res.json({
        userId,
        emailOffersAndDeals: true,
        emailNewFeatures: true,
        emailProductUpdates: true,
        emailSystemNotifications: true,
        emailWeeklyDigest: false,
        pushOffersAndDeals: true,
        pushOrderUpdates: true,
        pushAccountNotifications: true,
        smsEnabled: false,
        smsOffersAndDeals: false,
        smsOrderUpdates: false,
        unsubscribedFromAll: false,
      });
    }

    res.json(preferences);
  } catch (error) {
    console.error("[API] Error fetching notification preferences:", error);
    res.status(500).json({ error: "Failed to fetch notification preferences" });
  }
});

// PATCH user notification preferences
router.patch("/:userId", authenticateUser, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Verify user is requesting their own preferences
    if (req.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Check if preferences exist
    const existing = await db
      .select()
      .from(notificationPreferencesTable)
      .where(eq(notificationPreferencesTable.userId, userId))
      .then((rows) => rows[0]);

    let result;

    if (!existing) {
      // Create new preferences
      const [created] = await db
        .insert(notificationPreferencesTable)
        .values({
          id: `pref_${userId}_${Date.now()}`,
          userId,
          ...req.body,
          updatedAt: new Date(),
        })
        .returning();
      result = created;
    } else {
      // Update existing preferences
      const [updated] = await db
        .update(notificationPreferencesTable)
        .set({
          ...req.body,
          updatedAt: new Date(),
        })
        .where(eq(notificationPreferencesTable.userId, userId))
        .returning();
      result = updated;
    }

    res.json(result);
  } catch (error) {
    console.error("[API] Error updating notification preferences:", error);
    res.status(500).json({ error: "Failed to update notification preferences" });
  }
});

export default router;
