import { pgTable, text, uuid, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { userProfilesTable } from "./user_profiles";

export const userPlansTable = pgTable("user_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => userProfilesTable.id, { onDelete: "cascade" }),
  planType: text("plan_type").notNull(),
  planName: text("plan_name").notNull(),
  durationDays: integer("duration_days").notNull(),
  status: text("status").notNull().default("active"),
  activatedAt: timestamp("activated_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserPlanSchema = createInsertSchema(userPlansTable).omit({ createdAt: true });
export type InsertUserPlan = z.infer<typeof insertUserPlanSchema>;
export type UserPlan = typeof userPlansTable.$inferSelect;
