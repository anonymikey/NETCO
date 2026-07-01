import { pgTable, uuid, text, timestamp, varchar, boolean, index } from "drizzle-orm/pg-core";
import { userProfilesTable } from "./user_profiles";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const emailLogsTable = pgTable("email_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => userProfilesTable.id, { onDelete: "cascade" }),
  
  // Email details
  recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  emailType: varchar("email_type", { length: 50 }).notNull(), // offer, feature_update, product_update, system, weekly_digest
  
  // Resend integration
  resendMessageId: text("resend_message_id"), // Resend email ID for tracking
  resendStatus: varchar("resend_status", { length: 50 }).notNull().default("queued"), // queued, sent, delivered, failed, bounced
  
  // Delivery status
  isDelivered: boolean("is_delivered").notNull().default(false),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  
  // Engagement tracking
  isOpened: boolean("is_opened").notNull().default(false),
  openedAt: timestamp("opened_at", { withTimezone: true }),
  isClicked: boolean("is_clicked").notNull().default(false),
  clickedAt: timestamp("clicked_at", { withTimezone: true }),
  
  // Error tracking
  errorMessage: text("error_message"),
  failureReason: text("failure_reason"),
  
  // Campaign/Admin tracking
  campaignId: text("campaign_id"), // Optional: link to admin campaign
  sentByAdmin: text("sent_by_admin"), // Admin user ID
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("email_logs_user_id_idx").on(table.userId),
  createdAtIdx: index("email_logs_created_at_idx").on(table.createdAt),
  resendMessageIdIdx: index("email_logs_resend_message_id_idx").on(table.resendMessageId),
  emailTypeIdx: index("email_logs_email_type_idx").on(table.emailType),
}));

export type EmailLog = typeof emailLogsTable.$inferSelect;
export type InsertEmailLog = typeof emailLogsTable.$inferInsert;

export const insertEmailLogSchema = createInsertSchema(emailLogsTable, {
  recipientEmail: z.string().email(),
  subject: z.string().min(1).max(500),
  emailType: z.enum(["offer", "feature_update", "product_update", "system", "weekly_digest"]),
  resendMessageId: z.string().optional(),
  resendStatus: z.enum(["queued", "sent", "delivered", "failed", "bounced"]),
  isDelivered: z.boolean(),
  isOpened: z.boolean(),
  isClicked: z.boolean(),
  errorMessage: z.string().optional(),
  failureReason: z.string().optional(),
  campaignId: z.string().optional(),
  sentByAdmin: z.string().optional(),
});

export type InsertEmailLogSchema = z.infer<typeof insertEmailLogSchema>;
