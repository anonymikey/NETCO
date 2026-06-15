import { pgTable, text, timestamp, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { userProfilesTable } from "./user_profiles";

export const ordersTable = pgTable("orders", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => userProfilesTable.id),
  packageId: text("package_id").notNull(),
  network: text("network").notNull(),
  duration: text("duration").notNull(),
  appType: text("app_type").notNull(),
  deviceId: text("device_id").notNull(),
  phone: text("phone").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  paymentReference: text("payment_reference"),
  configUrl: text("config_url"),
  orderConfirmationSent: boolean("order_confirmation_sent").notNull().default(false),
  orderConfirmationSentAt: timestamp("order_confirmation_sent_at"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ createdAt: true, updatedAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
