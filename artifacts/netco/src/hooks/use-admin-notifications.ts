import { useMutation } from "@tanstack/react-query";
import { apiUrl } from "@/lib/api";

type NotificationType = "info" | "success" | "warning" | "error" | "order" | "payment" | "plan";

interface AdminNotificationsAPI {
  broadcast: (title: string, message: string, type: NotificationType) => Promise<any>;
  sendToUser: (userId: string, title: string, message: string, type: NotificationType) => Promise<any>;
  sendToUsers: (userIds: string[], title: string, message: string, type: NotificationType) => Promise<any>;
}

const adminNotificationsAPI: AdminNotificationsAPI = {
  broadcast: async (title, message, type) => {
    const response = await fetch(apiUrl("/admin/notifications/broadcast"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, message, type }),
    });
    if (!response.ok) throw new Error("Failed to broadcast");
    return response.json();
  },
  sendToUser: async (userId, title, message, type) => {
    const response = await fetch(apiUrl("/admin/notifications/send-to-user"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, title, message, type }),
    });
    if (!response.ok) throw new Error("Failed to send");
    return response.json();
  },
  sendToUsers: async (userIds, title, message, type) => {
    const response = await fetch(apiUrl("/admin/notifications/send-to-users"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds, title, message, type }),
    });
    if (!response.ok) throw new Error("Failed to send");
    return response.json();
  },
};

export function useAdminNotifications() {
  const broadcastMutation = useMutation({
    mutationFn: (params: { title: string; message: string; type: NotificationType }) =>
      adminNotificationsAPI.broadcast(params.title, params.message, params.type),
  });

  const sendToUserMutation = useMutation({
    mutationFn: (params: { userId: string; title: string; message: string; type: NotificationType }) =>
      adminNotificationsAPI.sendToUser(params.userId, params.title, params.message, params.type),
  });

  const sendToUsersMutation = useMutation({
    mutationFn: (params: { userIds: string[]; title: string; message: string; type: NotificationType }) =>
      adminNotificationsAPI.sendToUsers(params.userIds, params.title, params.message, params.type),
  });

  return {
    broadcastNotification: (title: string, message: string, type: NotificationType = "info") =>
      broadcastMutation.mutateAsync({ title, message, type }),
    sendToUser: (userId: string, title: string, message: string, type: NotificationType = "info") =>
      sendToUserMutation.mutateAsync({ userId, title, message, type }),
    sendToUsers: (userIds: string[], title: string, message: string, type: NotificationType = "info") =>
      sendToUsersMutation.mutateAsync({ userIds, title, message, type }),
    isBroadcasting: broadcastMutation.isPending,
    isSendingToUser: sendToUserMutation.isPending,
    isSendingToUsers: sendToUsersMutation.isPending,
  };
}
