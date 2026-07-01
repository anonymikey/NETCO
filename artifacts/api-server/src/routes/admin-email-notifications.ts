import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { Resend } from "resend";
import { db, userProfilesTable, notificationPreferencesTable, emailLogsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();
const resend = new Resend(process.env.RESEND_API_KEY);

const SendEmailSchema = z.object({
  subject: z.string().min(1).max(500),
  emailType: z.enum(["offer", "feature_update", "product_update", "system", "weekly_digest"]),
  htmlContent: z.string().min(1),
  recipientFilter: z.enum(["all", "offers_subscribers", "feature_subscribers", "product_subscribers"]).optional(),
  userIds: z.array(z.string()).optional(), // For targeted emails
});

type SendEmailRequest = z.infer<typeof SendEmailSchema>;

// Admin: Send email notification to users
router.post("/send", async (req: Request, res: Response) => {
  try {
    // TODO: Check if user is admin
    // if (req.userRole !== "admin") return res.status(403).json({ error: "Unauthorized" });

    const parsed = SendEmailSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body", details: parsed.error.flatten() });
    }

    const { subject, emailType, htmlContent, recipientFilter, userIds } = parsed.data;

    console.log(`[API] Sending ${emailType} emails, filter: ${recipientFilter}`);

    let recipients: Array<{ id: string; email: string }> = [];

    // Get recipients based on filter
    if (userIds && userIds.length > 0) {
      // Targeted send to specific users
      const users = await db
        .select({ id: userProfilesTable.id, email: userProfilesTable.email })
        .from(userProfilesTable)
        .where((t) => userIds.includes(t.id));
      recipients = users;
    } else if (recipientFilter === "all") {
      // Send to all users
      const allUsers = await db
        .select({ id: userProfilesTable.id, email: userProfilesTable.email })
        .from(userProfilesTable);
      recipients = allUsers;
    } else {
      // Filter by notification preferences
      let preferenceColumn: any;

      switch (emailType) {
        case "offer":
          preferenceColumn = notificationPreferencesTable.emailOffersAndDeals;
          break;
        case "feature_update":
          preferenceColumn = notificationPreferencesTable.emailNewFeatures;
          break;
        case "product_update":
          preferenceColumn = notificationPreferencesTable.emailProductUpdates;
          break;
        case "system":
          preferenceColumn = notificationPreferencesTable.emailSystemNotifications;
          break;
        case "weekly_digest":
          preferenceColumn = notificationPreferencesTable.emailWeeklyDigest;
          break;
      }

      // Get users with matching preferences
      const users = await db
        .select({ id: userProfilesTable.id, email: userProfilesTable.email })
        .from(userProfilesTable)
        .innerJoin(
          notificationPreferencesTable,
          eq(notificationPreferencesTable.userId, userProfilesTable.id)
        )
        .where((t) => preferenceColumn === true && t.unsubscribedFromAll === false);

      recipients = users.map((u) => ({ id: u.user_profiles.id, email: u.user_profiles.email }));
    }

    console.log(`[API] Found ${recipients.length} recipients for ${emailType}`);

    const emailLogs: any[] = [];
    let successCount = 0;
    let failureCount = 0;

    // Send emails via Resend
    for (const recipient of recipients) {
      try {
        const unsubscribeToken = `unsub_${recipient.id}_${Date.now()}`;

        const response = await resend.emails.send({
          from: "noreply@netco.anonymiketech.online",
          to: recipient.email,
          subject,
          html: `${htmlContent}\n\n<footer style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #ccc; font-size: 12px; color: #666;"><a href="https://netco.anonymiketech.online/unsubscribe?token=${unsubscribeToken}">Unsubscribe</a></footer>`,
          headers: {
            "X-Email-Type": emailType,
            "X-User-Id": recipient.id,
          },
        });

        successCount++;

        // Log successful send
        const logId = `log_${Date.now()}_${recipient.id}`;
        emailLogs.push({
          id: logId,
          userId: recipient.id,
          recipientEmail: recipient.email,
          subject,
          emailType,
          resendMessageId: response.id,
          resendStatus: "sent",
          isDelivered: false,
          sentByAdmin: req.userId,
          campaignId: req.body.campaignId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } catch (error) {
        failureCount++;

        console.error(`[API] Failed to send email to ${recipient.email}:`, error);

        // Log failed send
        const logId = `log_${Date.now()}_${recipient.id}_fail`;
        emailLogs.push({
          id: logId,
          userId: recipient.id,
          recipientEmail: recipient.email,
          subject,
          emailType,
          resendStatus: "failed",
          isDelivered: false,
          errorMessage: error instanceof Error ? error.message : "Unknown error",
          sentByAdmin: req.userId,
          campaignId: req.body.campaignId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    // Batch insert email logs
    if (emailLogs.length > 0) {
      await db.insert(emailLogsTable).values(emailLogs);
    }

    res.json({
      success: true,
      message: `Email campaign sent to ${successCount} users`,
      stats: {
        total: recipients.length,
        success: successCount,
        failed: failureCount,
      },
      emailType,
    });
  } catch (error) {
    console.error("[API] Error sending email campaign:", error);
    res.status(500).json({ error: "Failed to send email campaign" });
  }
});

// Admin: Get email campaign statistics
router.get("/stats", async (req: Request, res: Response) => {
  try {
    // TODO: Check if user is admin

    const stats = await db
      .select()
      .from(emailLogsTable)
      .then((logs) => {
        const emailTypeStats: Record<string, any> = {};

        logs.forEach((log) => {
          if (!emailTypeStats[log.emailType]) {
            emailTypeStats[log.emailType] = {
              total: 0,
              sent: 0,
              delivered: 0,
              opened: 0,
              clicked: 0,
              failed: 0,
            };
          }

          emailTypeStats[log.emailType].total++;

          if (log.resendStatus === "sent") emailTypeStats[log.emailType].sent++;
          if (log.isDelivered) emailTypeStats[log.emailType].delivered++;
          if (log.isOpened) emailTypeStats[log.emailType].opened++;
          if (log.isClicked) emailTypeStats[log.emailType].clicked++;
          if (log.resendStatus === "failed") emailTypeStats[log.emailType].failed++;
        });

        return emailTypeStats;
      });

    res.json(stats);
  } catch (error) {
    console.error("[API] Error fetching email campaign stats:", error);
    res.status(500).json({ error: "Failed to fetch email campaign stats" });
  }
});

export default router;
