import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { userProfilesTable } from "./user_profiles";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const notificationPreferencesTable = pgTable("notification_preferences", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique().references(() => userProfilesTable.id, { onDelete: "cascade" }),
  
  // Email preferences
  emailOffersAndDeals: boolean("email_offers_and_deals").notNull().default(true),
  emailNewFeatures: boolean("email_new_features").notNull().default(true),
  emailProductUpdates: boolean("email_product_updates").notNull().default(true),
  emailSystemNotifications: boolean("email_system_notifications").notNull().default(true),
  emailWeeklyDigest: boolean("email_weekly_digest").notNull().default(false),
  
  // Push preferences
  pushOffersAndDeals: boolean("push_offers_and_deals").notNull().default(true),
  pushOrderUpdates: boolean("push_order_updates").notNull().default(true),
  pushAccountNotifications: boolean("push_account_notifications").notNull().default(true),
  
  // SMS preferences
  smsEnabled: boolean("sms_enabled").notNull().default(false),
  smsOffersAndDeals: boolean("sms_offers_and_deals").notNull().default(false),
  smsOrderUpdates: boolean("sms_order_updates").notNull().default(false),
  
  // Marketing preferences
  unsubscribedFromAll: boolean("unsubscribed_from_all").notNull().default(false),
  unsubscribeToken: text("unsubscribe_token").unique(), // For email unsubscribe links
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type NotificationPreferences = typeof notificationPreferencesTable.$inferSelect;
export type InsertNotificationPreferences = typeof notificationPreferencesTable.$inferInsert;

export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferencesTable, {
  emailOffersAndDeals: z.boolean(),
  emailNewFeatures: z.boolean(),
  emailProductUpdates: z.boolean(),
  emailSystemNotifications: z.boolean(),
  emailWeeklyDigest: z.boolean(),
  pushOffersAndDeals: z.boolean(),
  pushOrderUpdates: z.boolean(),
  pushAccountNotifications: z.boolean(),
  smsEnabled: z.boolean(),
  smsOffersAndDeals: z.boolean(),
  smsOrderUpdates: z.boolean(),
  unsubscribedFromAll: z.boolean(),
});

export type InsertNotificationPreferencesSchema = z.infer<typeof insertNotificationPreferencesSchema>;
