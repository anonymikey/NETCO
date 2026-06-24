import { useNotifications } from "@/hooks/use-notifications";
import { NotificationCard } from "./notification-card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCheck, Loader2, Bell, X } from "lucide-react";
import { useEffect } from "react";

interface NotificationsDrawerProps {
  onClose: () => void;
}

export function NotificationsDrawer({ onClose }: NotificationsDrawerProps) {
  const { notifications, isLoading, markAllRead, unreadCount } = useNotifications();

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="absolute inset-y-0 right-0 w-[90vw] max-w-sm bg-card border-l border-border shadow-2xl flex flex-col pointer-events-auto animate-in slide-in-from-right-full duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-card to-card/50">
          <h2 className="font-semibold text-foreground">Notifications</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
            aria-label="Close notifications"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Actions */}
        {unreadCount > 0 && (
          <div className="px-4 py-2 border-b border-border bg-card/50">
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-auto p-0 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-transparent justify-center"
              onClick={() => markAllRead()}
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              Mark all read
            </Button>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center flex-1">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 px-4">
            <Bell className="w-12 h-12 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground text-center">No notifications yet</p>
            <p className="text-xs text-muted-foreground/70 text-center mt-1">You&apos;re all caught up!</p>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-2 p-3">
              {notifications.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
