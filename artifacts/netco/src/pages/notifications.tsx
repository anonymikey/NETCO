import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiUrl } from "@/lib/api";
import {
  Loader2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ShoppingCart,
  CreditCard,
  Lock,
  Server,
  Bell,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  category: string;
  icon?: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
  data?: Record<string, any>;
}

export default function NotificationsPage() {
  const [, navigate] = useLocation();
  const { user, session, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user || !session) {
      navigate("/login");
    }
  }, [user, session]);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  useEffect(() => {
    filterNotifications();
  }, [notifications, selectedCategory, searchTerm]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch(apiUrl(`api/notifications`), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load notifications");

      const data = await res.json();
      setNotifications(data || []);
      setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
    } catch (err) {
      console.error("[v0] Failed to load notifications:", err);
      toast({
        title: "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterNotifications = () => {
    let filtered = notifications;

    if (selectedCategory !== "all") {
      filtered = filtered.filter((n) => n.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          n.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredNotifications(filtered);
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(apiUrl(`api/notifications/${id}/read`), {
        method: "PATCH",
        credentials: "include",
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (err) {
      console.error("[v0] Failed to mark notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(apiUrl(`api/notifications/mark-all-read`), {
        method: "PATCH",
        credentials: "include",
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("[v0] Failed to mark all as read:", err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await fetch(apiUrl(`api/notifications/${id}`), {
        method: "DELETE",
        credentials: "include",
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast({
        title: "Notification deleted",
        description: "The notification has been removed.",
      });
    } catch (err) {
      console.error("[v0] Failed to delete notification:", err);
      toast({
        title: "Failed to delete notification",
        variant: "destructive",
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "order":
        return <ShoppingCart className="w-5 h-5 text-blue-500" />;
      case "payment":
        return <CreditCard className="w-5 h-5 text-green-500" />;
      case "security":
        return <Lock className="w-5 h-5 text-red-500" />;
      case "server":
        return <Server className="w-5 h-5 text-purple-500" />;
      case "account":
        return <Bell className="w-5 h-5 text-orange-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const categories = [
    { id: "all", label: "All", count: notifications.length },
    {
      id: "order",
      label: "Orders",
      count: notifications.filter((n) => n.category === "order").length,
    },
    {
      id: "payment",
      label: "Payments",
      count: notifications.filter((n) => n.category === "payment").length,
    },
    {
      id: "security",
      label: "Security",
      count: notifications.filter((n) => n.category === "security").length,
    },
    {
      id: "account",
      label: "Account",
      count: notifications.filter((n) => n.category === "account").length,
    },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen pt-20 pb-12 px-4 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 bg-background">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold text-balance">Notifications</h1>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-base px-3 py-1">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          <p className="text-lg text-muted-foreground">
            Stay informed about your account activity and important updates
          </p>
        </div>

        {/* Search and Actions */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" className="whitespace-nowrap">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 mb-6">
            {categories.map((cat) => (
              <TabsTrigger
                key={cat.id}
                value={cat.id}
                className="text-xs sm:text-sm flex flex-col items-center gap-1"
              >
                <span>{cat.label}</span>
                <span className="text-xs font-bold">{cat.count}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((cat) => (
            <TabsContent key={cat.id} value={cat.id}>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                    <p className="text-muted-foreground">No notifications in this category</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredNotifications.map((notification) => (
                    <Card
                      key={notification.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        !notification.isRead
                          ? "bg-primary/5 border-primary/20"
                          : "bg-card"
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {/* Icon */}
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-foreground">
                                  {notification.title}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                                <div className="flex items-center gap-3 mt-3">
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(notification.createdAt)}
                                  </span>
                                  {notification.category && (
                                    <Badge variant="secondary" className="text-xs capitalize">
                                      {notification.category}
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-start gap-2 flex-shrink-0">
                                {!notification.isRead && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => markAsRead(notification.id)}
                                    title="Mark as read"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteNotification(notification.id)}
                                  title="Delete notification"
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
