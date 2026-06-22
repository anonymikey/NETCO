import { db, notificationsTable, userProfilesTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";

export type NotificationType = "info" | "success" | "warning" | "error" | "order" | "payment" | "plan";

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType = "info"
) {
  const id = randomUUID();
  await db.insert(notificationsTable).values({
    id,
    userId,
    title,
    message,
    type,
  });
  return { id, userId, title, message, type };
}

export async function broadcastNotification(
  title: string,
  message: string,
  type: NotificationType = "info"
) {
  // Get all user IDs
  const users = await db.select({ id: userProfilesTable.id }).from(userProfilesTable);

  if (users.length === 0) {
    return { created: 0, userCount: 0 };
  }

  // Create notification for each user
  const notifications = users.map(() => ({
    id: randomUUID(),
    userId: users[Math.floor(Math.random() * users.length)].id,
    title,
    message,
    type,
  }));

  // Batch insert in groups of 1000 to avoid query size limits
  for (let i = 0; i < users.length; i += 1000) {
    const batch = users.slice(i, i + 1000).map((user) => ({
      id: randomUUID(),
      userId: user.id,
      title,
      message,
      type,
    }));
    await db.insert(notificationsTable).values(batch);
  }

  return { created: users.length, userCount: users.length };
}

export async function createNotificationForUsers(
  userIds: string[],
  title: string,
  message: string,
  type: NotificationType = "info"
) {
  if (userIds.length === 0) {
    return { created: 0, userCount: 0 };
  }

  // Batch insert in groups of 1000
  for (let i = 0; i < userIds.length; i += 1000) {
    const batch = userIds.slice(i, i + 1000).map((userId) => ({
      id: randomUUID(),
      userId,
      title,
      message,
      type,
    }));
    await db.insert(notificationsTable).values(batch);
  }

  return { created: userIds.length, userCount: userIds.length };
}

export async function markNotificationRead(notificationId: string) {
  await db
    .update(notificationsTable)
    .set({ isRead: true, updatedAt: new Date() })
    .where(eq(notificationsTable.id, notificationId));
}

export async function markAllNotificationsRead(userId: string) {
  await db
    .update(notificationsTable)
    .set({ isRead: true, updatedAt: new Date() })
    .where(eq(notificationsTable.userId, userId));
}

export async function getNotifications(
  userId: string,
  limit: number = 20,
  offset: number = 0
) {
  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, userId))
    .orderBy((t) => t.createdAt)
    .limit(limit)
    .offset(offset);

  return notifications;
}

export async function getUnreadCount(userId: string) {
  const result = await db
    .select({ count: db.select({ id: notificationsTable.id }).from(notificationsTable).where(eq(notificationsTable.userId, userId)).where(eq(notificationsTable.isRead, false)) })
    .from(notificationsTable);

  return result.length || 0;
}
