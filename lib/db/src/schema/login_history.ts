import { pgTable, text, uuid, timestamp, varchar, boolean, index } from "drizzle-orm/pg-core";
import { userProfilesTable } from "./user_profiles";

export const loginHistoryTable = pgTable(
  "login_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => userProfilesTable.supabaseUid, { onDelete: "cascade" }),
    deviceId: text("device_id"),
    browser: varchar("browser", { length: 100 }),
    operatingSystem: varchar("operating_system", { length: 100 }),
    ipAddress: varchar("ip_address", { length: 45 }),
    location: varchar("location", { length: 255 }),
    isSuccessful: boolean("is_successful").notNull().default(true),
    failureReason: text("failure_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_login_history_user_id").on(table.userId),
    index("idx_login_history_created").on(table.createdAt),
    index("idx_login_history_user_created").on(table.userId, table.createdAt),
  ]
);

export type LoginHistory = typeof loginHistoryTable.$inferSelect;
export type LoginHistoryInsert = typeof loginHistoryTable.$inferInsert;
