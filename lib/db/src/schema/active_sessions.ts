import { pgTable, uuid, text, timestamp, boolean, varchar, index } from "drizzle-orm/pg-core";
import { userProfilesTable } from "./user_profiles";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const activeSessionsTable = pgTable("active_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => userProfilesTable.id, { onDelete: "cascade" }),
  
  // Device info
  deviceName: varchar("device_name", { length: 255 }).notNull(), // e.g., "Safari on iPhone", "Chrome on Windows"
  deviceType: varchar("device_type", { length: 50 }).notNull(), // mobile, tablet, desktop
  browserName: varchar("browser_name", { length: 100 }),
  osName: varchar("os_name", { length: 100 }),
  
  // IP and location
  ipAddress: varchar("ip_address", { length: 45 }).notNull(),
  country: varchar("country", { length: 100 }),
  city: varchar("city", { length: 100 }),
  
  // Session data
  userAgent: text("user_agent").notNull(),
  sessionToken: text("session_token").notNull().unique(),
  isCurrentSession: boolean("is_current_session").notNull().default(false),
  
  // Timestamps
  lastActivityAt: timestamp("last_activity_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
}, (table) => ({
  userIdIdx: index("active_sessions_user_id_idx").on(table.userId),
  createdAtIdx: index("active_sessions_created_at_idx").on(table.createdAt),
  userIdCreatedAtIdx: index("active_sessions_user_id_created_at_idx").on(table.userId, table.createdAt),
}));

export type ActiveSession = typeof activeSessionsTable.$inferSelect;
export type InsertActiveSession = typeof activeSessionsTable.$inferInsert;

export const insertActiveSessionSchema = createInsertSchema(activeSessionsTable, {
  deviceName: z.string().min(1).max(255),
  deviceType: z.enum(["mobile", "tablet", "desktop"]),
  browserName: z.string().optional(),
  osName: z.string().optional(),
  ipAddress: z.string().ip(),
  country: z.string().optional(),
  city: z.string().optional(),
  userAgent: z.string(),
  sessionToken: z.string(),
  isCurrentSession: z.boolean(),
  lastActivityAt: z.date(),
  expiresAt: z.date(),
});

export type InsertActiveSessionSchema = z.infer<typeof insertActiveSessionSchema>;
