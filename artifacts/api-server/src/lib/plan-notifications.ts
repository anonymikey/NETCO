import { db, userPlansTable, planNotificationTrackingTable } from "@workspace/db";
import { lt, gt, and, eq } from "drizzle-orm";
import { createNotification } from "./notifications";
import { randomUUID } from "crypto";

type NotificationTrigger = "7_days" | "24_hours" | "1_hour" | "expired";

interface PlanExpiryCheck {
  planId: string;
  userId: string;
  planName: string;
  network: string;
  expiryDate: Date;
  trigger: NotificationTrigger;
}

/**
 * Get plans that need notifications based on expiry time
 */
export async function getPlanExpiryNotifications(): Promise<PlanExpiryCheck[]> {
  const now = new Date();
  const plansToNotify: PlanExpiryCheck[] = [];

  // Calculate time thresholds
  const oneHourFromNow = new Date(now.getTime() + 1 * 60 * 60 * 1000);
  const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // 1. Check for plans expiring within 1 hour
  const expiringWithinHour = await db
    .select()
    .from(userPlansTable)
    .where(
      and(
        gt(userPlansTable.expiryDate, now),
        lt(userPlansTable.expiryDate, oneHourFromNow)
      )
    );

  expiringWithinHour.forEach((plan) => {
    plansToNotify.push({
      planId: plan.id,
      userId: plan.userId,
      planName: plan.planName,
      network: plan.network,
      expiryDate: plan.expiryDate instanceof Date ? plan.expiryDate : new Date(plan.expiryDate as string),
      trigger: "1_hour",
    });
  });

  // 2. Check for plans expiring within 24 hours (but not within 1 hour)
  const expiringWithinDay = await db
    .select()
    .from(userPlansTable)
    .where(
      and(
        gt(userPlansTable.expiryDate, oneHourFromNow),
        lt(userPlansTable.expiryDate, twentyFourHoursFromNow)
      )
    );

  expiringWithinDay.forEach((plan) => {
    plansToNotify.push({
      planId: plan.id,
      userId: plan.userId,
      planName: plan.planName,
      network: plan.network,
      expiryDate: plan.expiryDate instanceof Date ? plan.expiryDate : new Date(plan.expiryDate as string),
      trigger: "24_hours",
    });
  });

  // 3. Check for plans expiring within 7 days (but not within 24 hours)
  const expiringWithinWeek = await db
    .select()
    .from(userPlansTable)
    .where(
      and(
        gt(userPlansTable.expiryDate, twentyFourHoursFromNow),
        lt(userPlansTable.expiryDate, sevenDaysFromNow)
      )
    );

  expiringWithinWeek.forEach((plan) => {
    plansToNotify.push({
      planId: plan.id,
      userId: plan.userId,
      planName: plan.planName,
      network: plan.network,
      expiryDate: plan.expiryDate instanceof Date ? plan.expiryDate : new Date(plan.expiryDate as string),
      trigger: "7_days",
    });
  });

  // 4. Check for expired plans
  const expiredPlans = await db
    .select()
    .from(userPlansTable)
    .where(lt(userPlansTable.expiryDate, now));

  expiredPlans.forEach((plan) => {
    plansToNotify.push({
      planId: plan.id,
      userId: plan.userId,
      planName: plan.planName,
      network: plan.network,
      expiryDate: plan.expiryDate instanceof Date ? plan.expiryDate : new Date(plan.expiryDate as string),
      trigger: "expired",
    });
  });

  return plansToNotify;
}

/**
 * Generate notification message based on trigger
 */
export function getNotificationMessage(
  trigger: NotificationTrigger,
  network: string,
  planName: string
): { title: string; message: string } {
  switch (trigger) {
    case "7_days":
      return {
        title: "Plan Expiring Soon",
        message: `Your ${network} VPN expires in 7 days. Renew now to avoid service interruption.`,
      };
    case "24_hours":
      return {
        title: "Plan Expires Tomorrow",
        message: `Your VPN expires tomorrow. Renew your ${network} plan now.`,
      };
    case "1_hour":
      return {
        title: "Urgent: Plan Expires in 1 Hour",
        message: `Your VPN expires in 1 hour. Renew immediately to maintain connectivity.`,
      };
    case "expired":
      return {
        title: "VPN Configuration Expired",
        message: `Your ${network} VPN configuration has expired. Purchase a new plan to reconnect.`,
      };
  }
}

/**
 * Check and create plan expiry notifications (idempotent)
 * This function is safe to call multiple times - it will only create each notification once
 * Should be called periodically (e.g., every 5 minutes via frontend polling or cron)
 */
export async function checkAndCreatePlanNotifications() {
  try {
    const plansToNotify = await getPlanExpiryNotifications();

    let createdCount = 0;
    const skippedCount = plansToNotify.length - createdCount;

    for (const plan of plansToNotify) {
      try {
        // Check if notification already exists for this plan/trigger combo
        const alreadyCreated = await hasNotificationBeenCreated(plan.planId, plan.trigger);
        
        if (alreadyCreated) {
          // Skip creating duplicate notification
          continue;
        }

        const { title, message } = getNotificationMessage(
          plan.trigger,
          plan.network,
          plan.planName
        );

        // Determine notification type based on trigger
        let notificationType: "warning" | "error" | "plan" = "plan";
        if (plan.trigger === "1_hour") notificationType = "error";
        if (plan.trigger === "24_hours") notificationType = "warning";
        if (plan.trigger === "expired") notificationType = "error";

        // Create the notification
        await createNotification(plan.userId, title, message, notificationType);
        
        // Record that we've created this notification
        await recordNotificationCreated(plan.planId, plan.userId, plan.trigger, plan.expiryDate);
        
        createdCount++;
      } catch (planError) {
        console.error(`[v0] Error creating notification for plan ${plan.planId}:`, planError);
        // Continue with next plan instead of failing completely
      }
    }

    return {
      success: true,
      createdCount,
      checkedCount: plansToNotify.length,
      skippedCount: plansToNotify.length - createdCount,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("[v0] Error checking plan notifications:", error);
    throw error;
  }
}

/**
 * Check if a notification for this plan and trigger type has already been created
 * This prevents duplicate notifications for the same plan/trigger combination
 */
export async function hasNotificationBeenCreated(
  planId: string,
  trigger: NotificationTrigger
): Promise<boolean> {
  try {
    const [existing] = await db
      .select()
      .from(planNotificationTrackingTable)
      .where(
        and(
          eq(planNotificationTrackingTable.planId, planId),
          eq(planNotificationTrackingTable.trigger, trigger)
        )
      )
      .limit(1);

    return !!existing;
  } catch (err: any) {
    // If table doesn't exist, treat as notification not created (first time)
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      console.log(`[v0] Notification tracking table not yet available for plan ${planId}`);
      return false;
    }
    throw err;
  }
}

/**
 * Record that a notification has been created for a plan
 */
export async function recordNotificationCreated(
  planId: string,
  userId: string,
  trigger: NotificationTrigger,
  expiryDate: Date
): Promise<void> {
  try {
    await db.insert(planNotificationTrackingTable).values({
      id: randomUUID(),
      planId,
      userId,
      trigger,
      expiryDateSnapshot: expiryDate,
    });
  } catch (err: any) {
    // If table doesn't exist, just skip recording (will retry on next check)
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      console.log(`[v0] Notification tracking table not yet available, skipping record for plan ${planId}`);
      return;
    }
    throw err;
  }
}
