import { useNotifications } from "@/hooks/use-notifications";
import { NotificationCard } from "./notification-card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCheck, Loader2, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface NotificationsDropdownProps {
  onClose: () => void;
}

export function NotificationsDropdown({ onClose }: NotificationsDropdownProps) {
  const { notifications, isLoading, markAllRead, unreadCount } = useNotifications();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      data-notification-dropdown
      className="w-96 max-w-[calc(100vw-16px)] bg-card border border-border rounded-lg shadow-2xl flex flex-col max-h-[500px] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-card to-card/50">
        <h2 className="font-semibold text-foreground">Notifications</h2>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-transparent"
            onClick={() => markAllRead()}
          >
            <CheckCheck className="w-4 h-4 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <Bell className="w-12 h-12 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground text-center">No notifications yet</p>
          <p className="text-xs text-muted-foreground/70 text-center mt-1">You&apos;re all caught up!</p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-2 p-3">
            <AnimatePresence mode="popLayout">
              {notifications.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} />
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      )}
    </motion.div>
  );
}
