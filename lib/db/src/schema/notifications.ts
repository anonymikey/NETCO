import { pgTable, text, uuid, boolean, timestamp, jsonb, varchar, index, check } from "drizzle-orm/pg-core";
import { userProfilesTable } from "./user_profiles";

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => userProfilesTable.supabaseUid, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    type: varchar("type", { length: 50 }).notNull(),
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
      `type IN ('server_added', 'upgrade', 'maintenance', 'alert', 'promotion')`
    ),
  ]
);

export type Notification = typeof notifications.$inferSelect;
export type NotificationInsert = typeof notifications.$inferInsert;
