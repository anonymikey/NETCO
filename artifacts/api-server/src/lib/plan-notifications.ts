import { db, userPlansTable } from "@workspace/db";
import { lt, gt, and } from "drizzle-orm";
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
 * Check and create plan expiry notifications
 * Should be called periodically (e.g., every minute via cron or interval)
 */
export async function checkAndCreatePlanNotifications() {
  try {
    const plansToNotify = await getPlanExpiryNotifications();

    let createdCount = 0;
    for (const plan of plansToNotify) {
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

      await createNotification(plan.userId, title, message, notificationType);
      createdCount++;
    }

    return {
      success: true,
      createdCount,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("[v0] Error checking plan notifications:", error);
    throw error;
  }
}

/**
 * Check if a plan notification has already been created recently
 * to avoid duplicate notifications
 */
export async function hasRecentNotification(
  userId: string,
  planId: string,
  trigger: NotificationTrigger,
  withinMinutes: number = 60
): Promise<boolean> {
  // This is a simple check - in production, you might want to track
  // which notifications have been sent in a separate table
  // For now, we'll return false to allow notifications to be created
  return false;
}
