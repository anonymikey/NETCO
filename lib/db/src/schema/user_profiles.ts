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
  
  // Security: 2FA
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
  twoFactorMethod: varchar("two_factor_method", { length: 20 }), // authenticator, sms, email
  twoFactorSecret: text("two_factor_secret"), // Encrypted TOTP secret
  twoFactorBackupCodes: text("two_factor_backup_codes"), // Encrypted JSON array of backup codes
  
  // Security: Last password change
  lastPasswordChangeAt: timestamp("last_password_change_at", { withTimezone: true }),
  
  // Account status
  accountLockedUntil: timestamp("account_locked_until", { withTimezone: true }), // Lock account after failed login attempts
  failedLoginAttempts: varchar("failed_login_attempts", { length: 3 }).default("0"),
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type UserProfile = typeof userProfilesTable.$inferSelect;
export type InsertUserProfile = typeof userProfilesTable.$inferInsert;
