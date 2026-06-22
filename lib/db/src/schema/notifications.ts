import { pgTable, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { userProfilesTable } from "./user_profiles";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const notificationsTable = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => userProfilesTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"), // info, success, warning, error, order, payment, plan
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("notifications_user_id_idx").on(table.userId),
  createdAtIdx: index("notifications_created_at_idx").on(table.createdAt),
  userIdCreatedAtIdx: index("notifications_user_id_created_at_idx").on(table.userId, table.createdAt),
}));

export type Notification = typeof notificationsTable.$inferSelect;
export type InsertNotification = typeof notificationsTable.$inferInsert;

export const insertNotificationSchema = createInsertSchema(notificationsTable, {
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  type: z.enum(["info", "success", "warning", "error", "order", "payment", "plan"]),
});

export type InsertNotificationSchema = z.infer<typeof insertNotificationSchema>;
