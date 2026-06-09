import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const configServersTable = pgTable("config_servers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  serverName: text("server_name").notNull(),
  network: text("network").notNull(),
  appType: text("app_type").notNull(),
  planType: text("plan_type").notNull(),
  duration: text("duration").notNull(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  fileSize: integer("file_size"),
  fileUrl: text("file_url"),
  status: text("status").notNull().default("active"),
  isFree: boolean("is_free").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertConfigServerSchema = createInsertSchema(configServersTable).omit({ createdAt: true, updatedAt: true });
export type InsertConfigServer = z.infer<typeof insertConfigServerSchema>;
export type ConfigServer = typeof configServersTable.$inferSelect;
