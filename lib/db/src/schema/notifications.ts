import { pgTable, uuid, boolean, timestamp, jsonb, varchar, index, check } from "drizzle-orm/pg-core";
import { userProfilesTable } from "./user_profiles";

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => userProfilesTable.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    type: varchar("type", { length: 50 }).notNull(),
    category: varchar("category", { length: 50 }).notNull().default("general"),
    icon: varchar("icon", { length: 20 }),
    isRead: boolean("is_read").default(false),
    actionUrl: varchar("action_url", { length: 255 }),
    data: jsonb("data"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_notifications_user_id").on(table.userId),
    index("idx_notifications_is_read").on(table.isRead),
    index("idx_notifications_created_at").on(table.createdAt),
    index("idx_notifications_user_created").on(table.userId, table.createdAt),
    check(
      "type_check",
      `type IN ('server_added', 'upgrade', 'maintenance', 'alert', 'promotion', 'order', 'payment', 'account', 'security')`
    ),
  ]
);

export const broadcastNotifications = pgTable(
  "broadcast_notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    type: varchar("type", { length: 50 }).notNull(),
    targetAudience: varchar("target_audience", { length: 50 }).notNull(),
    deliveryMethod: varchar("delivery_method", { length: 50 }).notNull(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    sentCount: timestamp("sent_count").default(0),
    deliveredCount: timestamp("delivered_count").default(0),
    readCount: timestamp("read_count").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_broadcast_scheduled").on(table.scheduledAt),
    index("idx_broadcast_created").on(table.createdAt),
  ]
);

export type Notification = typeof notifications.$inferSelect;
export type NotificationInsert = typeof notifications.$inferInsert;
export type BroadcastNotification = typeof broadcastNotifications.$inferSelect;
export type BroadcastNotificationInsert = typeof broadcastNotifications.$inferInsert;
