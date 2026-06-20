import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { userProfilesTable } from "./user_profiles";

export const userPlansTable = pgTable("user_plans", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => userProfilesTable.id),
  orderId: text("order_id").notNull(),
  network: text("network").notNull(),
  planName: text("plan_name").notNull(),
  planType: text("plan_type").notNull(),
  duration: text("duration").notNull(),
  appType: text("app_type").notNull(),
  deviceId: text("device_id").notNull(),
  phone: text("phone").notNull(),
  speed: text("speed"),
  expiryDate: timestamp("expiry_date", { withTimezone: true }).notNull(),
  status: text("status").notNull().default("active"),
  configUrl: text("config_url"),
  fileExtension: text("file_extension"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserPlanSchema = createInsertSchema(userPlansTable).omit({ createdAt: true });
export type InsertUserPlan = z.infer<typeof insertUserPlanSchema>;
export type UserPlan = typeof userPlansTable.$inferSelect;
