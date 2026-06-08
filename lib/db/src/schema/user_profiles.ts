import { pgTable, text, timestamp, boolean, varchar, jsonb } from "drizzle-orm/pg-core";

export const userProfilesTable = pgTable("user_profiles", {
  id: text("id").primaryKey(),
  supabaseUid: text("supabase_uid").notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  fullName: varchar("full_name", { length: 255 }),
  username: varchar("username", { length: 50 }).unique(),
  phone: varchar("phone", { length: 20 }),
  country: varchar("country", { length: 100 }),
  timezone: varchar("timezone", { length: 100 }),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  isEmailVerified: boolean("is_email_verified").notNull().default(false),
  isPhoneVerified: boolean("is_phone_verified").notNull().default(false),
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
  newsletterSubscribed: boolean("newsletter_subscribed").notNull().default(true),
  preferredTheme: varchar("preferred_theme", { length: 20 }).default("system"),
  preferredLanguage: varchar("preferred_language", { length: 10 }).default("en"),
  notificationPreferences: jsonb("notification_preferences").default({
    email: true,
    orders: true,
    payments: true,
    promotional: false,
    securityAlerts: true,
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type UserProfile = typeof userProfilesTable.$inferSelect;
export type InsertUserProfile = typeof userProfilesTable.$inferInsert;
