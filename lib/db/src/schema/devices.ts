import { pgTable, text, uuid, timestamp, varchar, index, boolean } from "drizzle-orm/pg-core";
import { userProfilesTable } from "./user_profiles";

export const devicesTable = pgTable(
  "devices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => userProfilesTable.supabaseUid, { onDelete: "cascade" }),
    deviceName: varchar("device_name", { length: 255 }).notNull(),
    deviceType: varchar("device_type", { length: 50 }).notNull(),
    browser: varchar("browser", { length: 100 }),
    operatingSystem: varchar("operating_system", { length: 100 }),
    ipAddress: varchar("ip_address", { length: 45 }),
    location: varchar("location", { length: 255 }),
    lastActivity: timestamp("last_activity", { withTimezone: true }).defaultNow(),
    isCurrentDevice: boolean("is_current_device").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_devices_user_id").on(table.userId),
    index("idx_devices_last_activity").on(table.lastActivity),
  ]
);

export type Device = typeof devicesTable.$inferSelect;
export type DeviceInsert = typeof devicesTable.$inferInsert;
