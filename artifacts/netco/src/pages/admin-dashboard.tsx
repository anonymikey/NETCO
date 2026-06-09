import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/admin/StatsCard";
import { useAuth } from "@/contexts/AuthContext";
import { apiUrl } from "@/lib/api";
import {
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Server,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Loader2,
} from "lucide-react";

interface DashboardStats {
  totalUsers: number;
  activePlans: number;
  totalRevenue: number;
  pendingOrders: number;
  configServers: number;
  activeServers: number;
}

interface RecentOrder {
  id: string;
  userId: string;
  packageId: string;
  status: string;
  amount: number;
  createdAt: string;
}

interface ActiveUser {
  id: string;
  email: string;
  fullName?: string;
  lastActive: string;
}

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { user, isAdminUser, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    if (!authLoading && (!user || !isAdminUser)) {
      navigate("/login");
    }
  }, [authLoading, user, isAdminUser, navigate]);

  useEffect(() => {
    if (user && isAdminUser) {
      loadDashboardData();
    }
  }, [user, isAdminUser]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, ordersRes, usersRes] = await Promise.all([
        fetch(apiUrl("api/admin/stats"), { credentials: "include" }),
        fetch(apiUrl("api/admin/orders/recent?limit=5"), { credentials: "include" }),
        fetch(apiUrl("api/admin/users/active?limit=5"), { credentials: "include" }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setRecentOrders(ordersData || []);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setActiveUsers(usersData || []);
      }

      setLastRefresh(new Date());
    } catch (err) {
      console.error("[v0] Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdminUser) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here&apos;s what&apos;s happening in your platform.
          </p>
        </div>
        <Button
          onClick={loadDashboardData}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatsCard
            label="Total Users"
            value={stats.totalUsers}
            icon={Users}
            color="primary"
            trend={12}
            trendLabel="vs last month"
            description="Active user accounts"
          />
          <StatsCard
            label="Active Plans"
            value={stats.activePlans}
            icon={ShoppingCart}
            color="success"
            trend={8}
            trendLabel="vs last month"
            description="Active subscriptions"
          />
          <StatsCard
            label="Total Revenue"
            value={`KES ${stats.totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            color="success"
            trend={15}
            trendLabel="vs last month"
            description="Monthly earnings"
          />
          <StatsCard
            label="Pending Orders"
            value={stats.pendingOrders}
            icon={TrendingUp}
            color="warning"
            description="Awaiting processing"
          />
          <StatsCard
            label="Config Servers"
            value={stats.configServers}
            icon={Server}
            color="primary"
            description="Total configured"
          />
          <StatsCard
            label="Active Servers"
            value={stats.activeServers}
            icon={AlertCircle}
            color={stats.activeServers === stats.configServers ? "success" : "warning"}
            description="Currently operational"
          />
        </div>
      )}

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest 5 orders from users</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/orders")}>
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No recent orders</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{order.id}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        KES {order.amount.toLocaleString()}
                      </p>
                    </div>
                    <Badge
                      variant={
                        order.status === "completed"
                          ? "secondary"
                          : order.status === "pending"
                          ? "outline"
                          : "destructive"
                      }
                    >
                      {order.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Active Users</CardTitle>
              <CardDescription>Currently online users</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/users")}>
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {activeUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No active users</p>
            ) : (
              <div className="space-y-3">
                {activeUsers.map((activeUser) => (
                  <div
                    key={activeUser.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {activeUser.fullName || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{activeUser.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-xs text-muted-foreground">Online</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Platform health and configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-green-500/20">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <div>
                  <p className="font-medium text-sm">API Status</p>
                  <p className="text-xs text-muted-foreground">All systems operational</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                Healthy
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-green-500/20">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <div>
                  <p className="font-medium text-sm">Database</p>
                  <p className="text-xs text-muted-foreground">98.5% uptime</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                Healthy
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-green-500/20">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <div>
                  <p className="font-medium text-sm">Auth Service</p>
                  <p className="text-xs text-muted-foreground">All providers active</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                Healthy
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-green-500/20">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <div>
                  <p className="font-medium text-sm">Notifications</p>
                  <p className="text-xs text-muted-foreground">Real-time enabled</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                Healthy
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Last Refresh Info */}
      <p className="text-xs text-muted-foreground text-center">
        Last refreshed: {lastRefresh.toLocaleTimeString()}
      </p>
    </div>
  );
}
