import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { userPlansTable } from "./user_plans";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * Tracks which plan expiry notifications have been created to prevent duplicates
 * Each record represents a notification that has been sent for a specific plan/trigger combo
 */
export const planNotificationTrackingTable = pgTable(
  "plan_notification_tracking",
  {
    id: text("id").primaryKey(),
    planId: text("plan_id").notNull().references(() => userPlansTable.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    trigger: text("trigger").notNull(), // "7_days", "24_hours", "1_hour", "expired"
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiryDateSnapshot: timestamp("expiry_date_snapshot", { withTimezone: true }).notNull(),
  },
  (table) => ({
    planIdTriggerIdx: index("plan_notification_tracking_plan_id_trigger_idx").on(
      table.planId,
      table.trigger
    ),
    userIdIdx: index("plan_notification_tracking_user_id_idx").on(table.userId),
    createdAtIdx: index("plan_notification_tracking_created_at_idx").on(table.createdAt),
  })
);

export type PlanNotificationTracking = typeof planNotificationTrackingTable.$inferSelect;
export type InsertPlanNotificationTracking = typeof planNotificationTrackingTable.$inferInsert;

export const insertPlanNotificationTrackingSchema = createInsertSchema(
  planNotificationTrackingTable,
  {
    trigger: z.enum(["7_days", "24_hours", "1_hour", "expired"]),
  }
);

export type InsertPlanNotificationTrackingSchema = z.infer<
  typeof insertPlanNotificationTrackingSchema
>;
