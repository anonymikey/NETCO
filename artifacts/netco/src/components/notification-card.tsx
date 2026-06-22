import { Notification } from "@workspace/db";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Info, AlertTriangle, Package, CreditCard, Gift, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/use-notifications";

interface NotificationCardProps {
  notification: Notification;
}

const typeConfig = {
  info: { icon: Info, color: "text-blue-500", bg: "bg-blue-50" },
  success: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-50" },
  warning: { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-50" },
  error: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-50" },
  order: { icon: Package, color: "text-purple-500", bg: "bg-purple-50" },
  payment: { icon: CreditCard, color: "text-indigo-500", bg: "bg-indigo-50" },
  plan: { icon: Gift, color: "text-pink-500", bg: "bg-pink-50" },
};

export function NotificationCard({ notification }: NotificationCardProps) {
  const { markRead } = useNotifications();
  const config = typeConfig[notification.type as keyof typeof typeConfig] || typeConfig.info;
  const Icon = config.icon;

  const handleMarkRead = () => {
    if (!notification.isRead) {
      markRead(notification.id);
    }
  };

  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div
      className={cn(
        "flex gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md",
        notification.isRead ? "bg-white border-gray-200" : "bg-blue-50 border-blue-200"
      )}
      onClick={handleMarkRead}
    >
      <div className={cn("flex-shrink-0 mt-1", config.color)}>
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn("font-semibold text-sm", notification.isRead ? "text-gray-700" : "text-gray-900")}>
          {notification.title}
        </p>
        <p className="text-xs text-gray-600 line-clamp-2">{notification.message}</p>
        <p className="text-xs text-gray-500 mt-1">{timeAgo(notification.createdAt)}</p>
      </div>

      {!notification.isRead && (
        <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2" />
      )}
    </div>
  );
}
