import { Notification } from "@workspace/db";
import { AlertCircle, CheckCircle, Info, AlertTriangle, Package, CreditCard, Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/use-notifications";

interface NotificationCardProps {
  notification: Notification;
}

const typeConfig = {
  info: { icon: Info, accent: "from-cyan-500/20 to-cyan-500/10", dot: "bg-cyan-500" },
  success: { icon: CheckCircle, accent: "from-green-500/20 to-green-500/10", dot: "bg-green-500" },
  warning: { icon: AlertTriangle, accent: "from-yellow-500/20 to-yellow-500/10", dot: "bg-yellow-500" },
  error: { icon: AlertCircle, accent: "from-red-500/20 to-red-500/10", dot: "bg-red-500" },
  order: { icon: Package, accent: "from-purple-500/20 to-purple-500/10", dot: "bg-purple-500" },
  payment: { icon: CreditCard, accent: "from-indigo-500/20 to-indigo-500/10", dot: "bg-indigo-500" },
  plan: { icon: Gift, accent: "from-pink-500/20 to-pink-500/10", dot: "bg-pink-500" },
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
        "flex gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-lg",
        notification.isRead
          ? "bg-card/50 border-border hover:bg-card"
          : `bg-gradient-to-r ${config.accent} border-border hover:bg-card/60`
      )}
      onClick={handleMarkRead}
    >
      <div className="flex-shrink-0 mt-1 opacity-70">
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground line-clamp-1">
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{notification.message}</p>
        <p className="text-xs text-muted-foreground/60 mt-1">{timeAgo(notification.createdAt)}</p>
      </div>

      {!notification.isRead && (
        <div className={cn("flex-shrink-0 w-2 h-2 rounded-full mt-2", config.dot)} />
      )}
    </div>
  );
}
