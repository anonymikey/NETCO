import { useEffect, useContext } from "react";
import { NotificationsContext } from "@/context/notifications-context";
import { apiUrl } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface NotificationsAPI {
  getNotifications: (limit?: number, offset?: number) => Promise<any[]>;
  getUnreadCount: () => Promise<{ count: number }>;
  markRead: (notificationId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const notificationsAPI: NotificationsAPI = {
  getNotifications: async (limit = 20, offset = 0) => {
    const response = await fetch(apiUrl(`/notifications?limit=${limit}&offset=${offset}`));
    if (!response.ok) throw new Error("Failed to fetch notifications");
    return response.json();
  },
  getUnreadCount: async () => {
    const response = await fetch(apiUrl("/notifications/unread-count"));
    if (!response.ok) throw new Error("Failed to fetch unread count");
    return response.json();
  },
  markRead: async (notificationId: string) => {
    const response = await fetch(apiUrl(`/notifications/${notificationId}/read`), {
      method: "POST",
    });
    if (!response.ok) throw new Error("Failed to mark as read");
  },
  markAllRead: async () => {
    const response = await fetch(apiUrl("/notifications/read-all"), {
      method: "POST",
    });
    if (!response.ok) throw new Error("Failed to mark all as read");
  },
};

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }

  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsAPI.getNotifications(),
    refetchInterval: 15000, // Poll every 15 seconds
  });

  // Fetch unread count
  const { data: unreadData } = useQuery({
    queryKey: ["unreadCount"],
    queryFn: () => notificationsAPI.getUnreadCount(),
    refetchInterval: 15000,
  });

  const unreadCount = unreadData?.count || 0;

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) => notificationsAPI.markRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
    },
  });

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsAPI.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
    },
  });

  return {
    notifications,
    isLoading,
    unreadCount,
    markRead: (notificationId: string) => markReadMutation.mutate(notificationId),
    markAllRead: () => markAllReadMutation.mutate(),
  };
}
