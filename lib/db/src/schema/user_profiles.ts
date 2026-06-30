import { pgTable, text, timestamp, boolean, varchar } from "drizzle-orm/pg-core";

export const userProfilesTable = pgTable("user_profiles", {
  id: text("id").primaryKey(),
  supabaseUid: text("supabase_uid").notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 255 }),
  fullName: varchar("full_name", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  country: varchar("country", { length: 100 }),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  timezone: varchar("timezone", { length: 100 }),
  preferredLanguage: varchar("preferred_language", { length: 10 }),
  preferredTheme: varchar("preferred_theme", { length: 20 }),
  isEmailVerified: boolean("is_email_verified").notNull().default(false),
  isPhoneVerified: boolean("is_phone_verified").notNull().default(false),
  newsletterSubscribed: boolean("newsletter_subscribed").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type UserProfile = typeof userProfilesTable.$inferSelect;
export type InsertUserProfile = typeof userProfilesTable.$inferInsert;
