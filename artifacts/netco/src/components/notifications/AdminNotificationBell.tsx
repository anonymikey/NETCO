import { useState, useEffect } from 'react';
import { Bell, AlertCircle, Server, Zap, Wrench, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: 'server_added' | 'user_signup' | 'payment_received' | 'system_alert' | 'maintenance' | 'peak_users';
  severity: 'info' | 'warning' | 'critical';
  isRead: boolean;
  createdAt: string;
  data?: Record<string, any>;
}

export function AdminNotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchAdminNotifications();
    const interval = setInterval(fetchAdminNotifications, 20000); // Refresh every 20 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAdminNotifications = async () => {
    try {
      const response = await fetch('/api/admin/notifications', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: AdminNotification) => !n.isRead).length);
      }
    } catch (error) {
      console.error('[v0] Failed to fetch admin notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/admin/notifications/${notificationId}/read`, {
        method: 'PATCH',
        credentials: 'include',
      });
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('[v0] Failed to mark admin notification as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'server_added':
        return <Server className="w-4 h-4 text-primary" />;
      case 'user_signup':
        return <Users className="w-4 h-4 text-green-400" />;
      case 'payment_received':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'system_alert':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'maintenance':
        return <Wrench className="w-4 h-4 text-orange-400" />;
      case 'peak_users':
        return <Zap className="w-4 h-4 text-yellow-400" />;
      default:
        return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/20';
      case 'info':
      default:
        return 'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative hover:bg-amber-400/10"
        aria-label="Admin Notifications"
      >
        <Bell className="w-5 h-5 text-amber-400" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-card border border-amber-400/20 rounded-lg shadow-2xl z-50 max-h-96 overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-card border-b border-amber-400/20 px-4 py-3 flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              Admin Alerts
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={async () => {
                  try {
                    await fetch('/api/admin/notifications/read-all', {
                      method: 'PATCH',
                      credentials: 'include',
                    });
                    setNotifications((prev) =>
                      prev.map((n) => ({ ...n, isRead: true }))
                    );
                    setUnreadCount(0);
                  } catch (error) {
                    console.error('[v0] Failed to mark all as read:', error);
                  }
                }}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="divide-y divide-amber-400/10">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                No alerts
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => {
                    if (!notification.isRead) {
                      markAsRead(notification.id);
                    }
                  }}
                  className={`px-4 py-3 border-l-4 ${getSeverityColor(notification.severity)} transition-colors cursor-pointer ${
                    notification.severity === 'critical' ? 'border-l-red-500' :
                    notification.severity === 'warning' ? 'border-l-yellow-500' : 'border-l-blue-500'
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 mt-2 animate-pulse" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-amber-400/20 px-4 py-2 text-center">
              <button className="text-xs text-amber-400 hover:text-amber-300 font-medium">
                View All Alerts
              </button>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
