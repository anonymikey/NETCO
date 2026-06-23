import { useEffect, useContext } from "react";
import { NotificationsContext } from "@/context/notifications-context";
import { apiUrl } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface NotificationsAPI {
  getNotifications: (limit?: number, offset?: number) => Promise<any[]>;
  getUnreadCount: () => Promise<{ count: number }>;
  markRead: (notificationId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) return {};
  return {
    Authorization: `Bearer ${session.user.id}`,
  };
}

const notificationsAPI: NotificationsAPI = {
  getNotifications: async (limit = 20, offset = 0) => {
    const headers = await getAuthHeader();
    const response = await fetch(apiUrl(`/notifications?limit=${limit}&offset=${offset}`), { headers });
    if (!response.ok) throw new Error("Failed to fetch notifications");
    return response.json();
  },
  getUnreadCount: async () => {
    const headers = await getAuthHeader();
    const response = await fetch(apiUrl("/notifications/unread-count"), { headers });
    if (!response.ok) throw new Error("Failed to fetch unread count");
    return response.json();
  },
  markRead: async (notificationId: string) => {
    const headers = await getAuthHeader();
    const response = await fetch(apiUrl(`/notifications/${notificationId}/read`), {
      method: "POST",
      headers,
    });
    if (!response.ok) throw new Error("Failed to mark as read");
  },
  markAllRead: async () => {
    const headers = await getAuthHeader();
    const response = await fetch(apiUrl("/notifications/read-all"), {
      method: "POST",
      headers,
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
