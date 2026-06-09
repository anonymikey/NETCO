import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "crypto";
import { eq, and } from "drizzle-orm";
import { db, userProfilesTable } from "@workspace/db";
import { sendWelcomeEmail } from "../lib/email.js";
import { logger } from "../lib/logger.js";

const router = Router();

const CreateProfileBody = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string().optional(),
  phone: z.string().optional(),
});

const UpdateProfileBody = z.object({
  fullName: z.string().optional(),
  username: z.string().optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
  timezone: z.string().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  newsletterSubscribed: z.boolean().optional(),
  preferredTheme: z.string().optional(),
  preferredLanguage: z.string().optional(),
  notificationPreferences: z.object({
    email: z.boolean().optional(),
    orders: z.boolean().optional(),
    payments: z.boolean().optional(),
    promotional: z.boolean().optional(),
    securityAlerts: z.boolean().optional(),
  }).optional(),
});

// Create new user profile (called after signup)
router.post("/create", async (req, res) => {
  try {
    const parsed = CreateProfileBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
      return;
    }

    const { id, email, fullName, phone } = parsed.data;

    // Check if profile already exists
    const existing = await db
      .select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, id))
      .limit(1);

    if (existing.length > 0) {
      logger.warn({ userId: id }, "Profile already exists");
      res.status(409).json({ error: "Profile already exists" });
      return;
    }

    // Create profile
    const [profile] = await db
      .insert(userProfilesTable)
      .values({
        id,
        email,
        fullName: fullName ?? null,
        phone: phone ?? null,
        isEmailVerified: false,
        newsletterSubscribed: true,
      })
      .returning();

    // Send welcome email
    try {
      await sendWelcomeEmail(email);
      logger.info({ userId: id, email }, "Welcome email sent to new user");
    } catch (emailErr) {
      logger.error({ emailErr, email }, "Failed to send welcome email");
      // Don't fail the signup if email fails
    }

    res.status(201).json(formatProfile(profile));
  } catch (err) {
    logger.error({ err, body: req.body }, "Error creating profile");
    const message = err instanceof Error ? err.message : "Failed to create profile";
    res.status(500).json({ error: message });
  }
});

// Get user profile (by userId)
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const [profile] = await db
      .select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, userId))
      .limit(1);

    if (!profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    res.json(formatProfile(profile));
  } catch (err) {
    logger.error({ err, userId: req.params.userId }, "Error fetching profile");
    const message = err instanceof Error ? err.message : "Failed to fetch profile";
    res.status(500).json({ error: message });
  }
});

// Update user profile
router.patch("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const parsed = UpdateProfileBody.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
      return;
    }

    const [profile] = await db
      .select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, userId))
      .limit(1);

    if (!profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    const [updated] = await db
      .update(userProfilesTable)
      .set({
        fullName: parsed.data.fullName ?? profile.fullName,
        username: parsed.data.username ?? profile.username,
        phone: parsed.data.phone ?? profile.phone,
        country: parsed.data.country ?? profile.country,
        timezone: parsed.data.timezone ?? profile.timezone,
        bio: parsed.data.bio ?? profile.bio,
        avatarUrl: parsed.data.avatarUrl ?? profile.avatarUrl,
        preferredTheme: parsed.data.preferredTheme ?? profile.preferredTheme,
        preferredLanguage: parsed.data.preferredLanguage ?? profile.preferredLanguage,
        notificationPreferences: parsed.data.notificationPreferences
          ? { ...profile.notificationPreferences, ...parsed.data.notificationPreferences }
          : profile.notificationPreferences,
        newsletterSubscribed:
          parsed.data.newsletterSubscribed !== undefined
            ? parsed.data.newsletterSubscribed
            : profile.newsletterSubscribed,
        updatedAt: new Date(),
      })
      .where(eq(userProfilesTable.id, userId))
      .returning();

    res.json(formatProfile(updated));
  } catch (err) {
    logger.error({ err, userId: req.params.userId }, "Error updating profile");
    const message = err instanceof Error ? err.message : "Failed to update profile";
    res.status(500).json({ error: message });
  }
});

// Helper function to format profile response
function formatProfile(profile: typeof userProfilesTable.$inferSelect) {
  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.fullName,
    username: profile.username,
    phone: profile.phone,
    country: profile.country,
    timezone: profile.timezone,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
    isEmailVerified: profile.isEmailVerified,
    isPhoneVerified: profile.isPhoneVerified,
    twoFactorEnabled: profile.twoFactorEnabled,
    newsletterSubscribed: profile.newsletterSubscribed,
    preferredTheme: profile.preferredTheme,
    preferredLanguage: profile.preferredLanguage,
    notificationPreferences: profile.notificationPreferences,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

export default router;
