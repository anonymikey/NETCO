import { useState, useRef, useEffect, useCallback } from "react";
import {
  useGetAdminStats,
  useListConfigServers,
  useDeleteConfigServer,
  useUpdateConfigServerStatus,
  getListConfigServersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import {
  TrendingUp, Users, ShoppingCart, DollarSign, Server, Plus, Trash2,
  Download, ToggleLeft, ToggleRight, Upload, X, CheckCircle, AlertCircle,
  Loader2, Smartphone, ExternalLink, Gift, Bell, Eye, Zap, Search,
  Filter, RefreshCw, ChevronDown, Check, Clock, XCircle, Package,
  Activity, ArrowUpRight, ArrowDownRight, Zap as ZapIcon, Shield, Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { apiUrl } from "@/lib/api";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminNotificationsPanel } from "@/components/admin-notifications-panel";
import { UserDetailDrawer } from "@/components/user-detail-drawer";

const NETWORK_COLORS = ["#00F5FF", "#7B61FF", "#0057A8"];
const TABS = ["Dashboard", "Orders", "Config Servers", "Notifications", "Users", "Settings"] as const;
type Tab = typeof TABS[number];

const NETWORKS = ["safaricom", "airtel", "telkom"] as const;
const APP_TYPES = [
  { value: "http_custom", label: "HTTP Custom", ext: ".hc", store: "https://play.google.com/store/apps/details?id=xyz.easypro.httpcustom" },
  { value: "http_injector", label: "HTTP Injector", ext: ".ehi", store: "https://play.google.com/store/apps/details?id=com.evozi.injector" },
] as const;
const PLAN_TYPES = ["unlimited", "capped", "wifi"] as const;
const DURATIONS = ["daily", "weekly", "monthly"] as const;

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function networkColor(network: string) {
  if (network === "safaricom") return "text-green-400";
  if (network === "airtel") return "text-red-400";
  return "text-blue-400";
}

function networkBg(network: string) {
  if (network === "safaricom") return "bg-green-400/10 border-green-400/20";
  if (network === "airtel") return "bg-red-400/10 border-red-400/20";
  return "bg-blue-400/10 border-blue-400/20";
}

function statusColor(status: string) {
  switch (status) {
    case "completed": return "bg-green-500/10 text-green-400 border-green-500/20";
    case "pending": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    case "failed": return "bg-red-500/10 text-red-400 border-red-500/20";
    case "cancelled": return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    default: return "bg-muted/10 text-muted-foreground border-muted/20";
  }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface Order {
  id: string;
  phone: string;
  network: string;
  duration: string;
  appType: string;
  deviceId: string;
  amount: number;
  status: string;
  paymentReference: string | null;
  configUrl: string | null;
  createdAt: string;
}

interface AddServerForm {
  serverName: string;
  network: string;
  appType: string;
  planType: string;
  duration: string;
  file: File | null;
}

const EMPTY_FORM: AddServerForm = {
  serverName: "",
  network: "safaricom",
  appType: "http_custom",
  planType: "unlimited",
  duration: "monthly",
  file: null,
};

export default function Admin() {
  const [activeTab, setActiveTab] = useState<Tab>("Dashboard");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Dashboard
  const { data: stats, isLoading: statsLoading } = useGetAdminStats();

  // Config Servers
  const { data: servers = [], isLoading: serversLoading } = useListConfigServers();
  const deleteServer = useDeleteConfigServer();
  const updateStatus = useUpdateConfigServerStatus();
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<AddServerForm>(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [replaceId, setReplaceId] = useState<string | null>(null);
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceFileRef = useRef<HTMLInputElement>(null);

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderFilter, setOrderFilter] = useState("all");
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [fulfillOrderId, setFulfillOrderId] = useState<string | null>(null);
  const [fulfillServerId, setFulfillServerId] = useState("");
  const [fulfillInstructions, setFulfillInstructions] = useState("");
  const [fulfilling, setFulfilling] = useState(false);

  // Users Management
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserDrawer, setShowUserDrawer] = useState(false);

  // Mock users data - replace with API call
  const mockUsers = [
    {
      id: "user-1",
      username: "john_doe",
      email: "john@example.com",
      phone: "+254712345678",
      country: "Kenya",
      ordersCount: 5,
      activePlansCount: 1,
      totalSpent: 3500,
      notificationsCount: 12,
      status: "active",
      joinDate: "2024-01-15",
      fullName: "John Doe",
    },
    {
      id: "user-2",
      username: "jane_smith",
      email: "jane@example.com",
      phone: "+254798765432",
      country: "Kenya",
      ordersCount: 8,
      activePlansCount: 2,
      totalSpent: 7200,
      notificationsCount: 24,
      status: "active",
      joinDate: "2023-11-20",
      fullName: "Jane Smith",
    },
  ];

  const filteredUsers = mockUsers.filter((u) =>
    userSearch.toLowerCase() === "" ||
    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.phone.includes(userSearch) ||
    u.country.toLowerCase().includes(userSearch.toLowerCase())
  );

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const params = new URLSearchParams();
      if (orderFilter !== "all") params.set("status", orderFilter);
      if (orderSearch.trim()) params.set("search", orderSearch.trim());
      const res = await fetch(apiUrl(`/api/admin/orders?${params}`));
      const data = await res.json() as Order[];
      setOrders(data);
    } catch {
      toast({ title: "Failed to load orders", variant: "destructive" });
    } finally {
      setOrdersLoading(false);
    }
  }, [orderFilter, orderSearch, toast]);

  useEffect(() => {
    if (activeTab === "Orders") {
      fetchOrders();
    }
  }, [activeTab, fetchOrders]);

  // Supabase realtime subscription for orders
  useEffect(() => {
    const channel = supabase
      .channel("admin-orders-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
        const newOrder = payload.new as Order;
        setOrders((prev) => [newOrder, ...prev]);
        setNewOrderCount((c) => c + 1);
        toast({
          title: "🔔 New Order!",
          description: `${capitalize(newOrder.network)} — ${capitalize(newOrder.duration)} — Ksh ${newOrder.amount} from ${newOrder.phone}`,
        });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, (payload) => {
        const updated = payload.new as Order;
        setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  // Auto-refresh dashboard data every 30 seconds
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (activeTab === "Dashboard") {
        // Invalidate stats cache to refresh data
        queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      } else if (activeTab === "Orders") {
        fetchOrders();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(refreshInterval);
  }, [activeTab, queryClient, fetchOrders]);

  const handleFulfillOrder = async () => {
    if (!fulfillOrderId) return;
    setFulfilling(true);
    try {
      const payload: any = {};
      if (fulfillServerId) payload.configServerId = fulfillServerId;
      if (fulfillInstructions.trim()) payload.instructions = fulfillInstructions.trim();
      
      const res = await fetch(apiUrl(`/api/admin/orders/${fulfillOrderId}/fulfill`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Fulfill failed");
      toast({ title: "Order fulfilled!", description: "Config file sent to client." });
      setFulfillOrderId(null);
      setFulfillServerId("");
      setFulfillInstructions("");
      fetchOrders();
    } catch (err) {
      toast({ title: "Fulfill failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setFulfilling(false);
    }
  };

  const handleMarkStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(apiUrl(`/api/admin/orders/${orderId}/status`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Update failed");
      toast({ title: `Order marked as ${status}` });
      fetchOrders();
    } catch {
      toast({ title: "Failed to update order", variant: "destructive" });
    }
  };

  const handleToggleFree = async (id: string, current: boolean) => {
    try {
      const res = await fetch(apiUrl(`/api/admin/servers/${id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFree: !current }),
      });
      if (!res.ok) throw new Error("Failed to update");
      await queryClient.invalidateQueries({ queryKey: getListConfigServersQueryKey() });
      toast({ title: !current ? "Marked as Free offer" : "Removed from free offers" });
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  const statCards = stats && typeof stats === 'object' && stats.totalOrders !== undefined
    ? [
        { icon: ShoppingCart, label: "Total Orders", value: (stats.totalOrders ?? 0).toLocaleString(), color: "text-primary", bg: "bg-primary/10 border-primary/20", trend: "+12.5%" },
        { icon: DollarSign, label: "Total Revenue", value: `Ksh ${(stats.totalRevenue ?? 0).toLocaleString()}`, color: "text-green-400", bg: "bg-green-400/10 border-green-400/20", trend: "+8.2%" },
        { icon: Users, label: "Active Users", value: (stats.activeUsers ?? 0).toLocaleString(), color: "text-secondary", bg: "bg-secondary/10 border-secondary/20", trend: "+15.3%" },
        { icon: Server, label: "Active Plans", value: (stats.activePlans ?? 0).toLocaleString(), color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20", trend: "+4.1%" },
      ]
    : [];

  const selectedAppType = APP_TYPES.find((a) => a.value === form.appType);
  const acceptedExt = selectedAppType?.ext ?? ".hc,.ehi";

  async function handleAddServer() {
    if (!form.file) {
      toast({ title: "No file selected", description: `Please upload a ${acceptedExt} config file.`, variant: "destructive" });
      return;
    }
    if (!form.serverName.trim()) {
      toast({ title: "Server name required", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const fileArrayBuffer = await form.file.arrayBuffer();
      const fileBytes = new Uint8Array(fileArrayBuffer);
      const fileBase64 = btoa(String.fromCharCode(...fileBytes));

      const url = apiUrl("/api/admin/servers/metadata");
      
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serverName: form.serverName.trim(),
          network: form.network,
          appType: form.appType,
          planType: form.planType,
          duration: form.duration,
          originalName: form.file.name,
          fileSize: form.file.size,
          fileBuffer: fileBase64,
        }),
      });

      if (!res.ok) {
        let errorMessage = `Server error (${res.status})`;
        try {
          const contentType = res.headers.get("content-type");
          if (contentType?.includes("application/json")) {
            const err = await res.json() as { error?: string };
            errorMessage = err.error ?? errorMessage;
          }
        } catch {
          // If response is not JSON, use default error
        }
        throw new Error(errorMessage);
      }

      await queryClient.invalidateQueries({ queryKey: getListConfigServersQueryKey() });
      setShowAddForm(false);
      setForm(EMPTY_FORM);
      toast({ title: "Config server added", description: `"${form.serverName}" is now live.` });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      toast({ title: "Upload failed", description: message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  async function handleToggleStatus(id: string, current: string) {
    const next = current === "active" ? "inactive" : "active";
    try {
      await updateStatus.mutateAsync({ id, data: { status: next } });
      await queryClient.invalidateQueries({ queryKey: getListConfigServersQueryKey() });
      toast({ title: `Server marked ${next}` });
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete "${name}"? This will also remove the config file.`)) return;
    try {
      await deleteServer.mutateAsync({ id });
      await queryClient.invalidateQueries({ queryKey: getListConfigServersQueryKey() });
      toast({ title: "Server deleted" });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  }

  async function handleReplaceFile(id: string) {
    if (!replaceFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("configFile", replaceFile);
      const url = apiUrl(`/api/admin/servers/${id}/file`);
      const res = await fetch(url, { method: "PUT", body: fd });
      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? `Replace failed with status ${res.status}`);
      }
      await queryClient.invalidateQueries({ queryKey: getListConfigServersQueryKey() });
      setReplaceId(null);
      setReplaceFile(null);
      toast({ title: "Config file replaced" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Replace failed - network error or server unreachable";
      toast({ title: "Replace failed", description: message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  function downloadServer(id: string) {
    window.open(apiUrl(`/api/admin/servers/${id}/download`), "_blank");
  }

  const pendingOrders = orders.filter((o) => o.status === "pending").length;

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl md:text-4xl font-heading font-bold">
                {activeTab}
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">Manage orders, servers, and monitor platform performance</p>
            </div>
            {newOrderCount > 0 && (
              <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-lg px-4 py-2.5 w-fit animate-in slide-in-from-top-2">
                <Bell className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-primary text-sm font-medium">{newOrderCount} new order{newOrderCount > 1 ? "s" : ""}</span>
                <button onClick={() => setNewOrderCount(0)} className="text-muted-foreground hover:text-foreground ml-1 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === "Dashboard" && (
          <div className="space-y-8 animate-in fade-in-50 duration-300">
            {/* Stats Grid */}
            {statsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-32 bg-card/50 border border-card-border rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map(({ icon: Icon, label, value, color, bg, trend }) => (
                  <div key={label} className={`group glass-card rounded-lg p-5 space-y-3 border transition-all hover:border-primary/40 hover:bg-card/80 ${bg}`}>
                    <div className="flex items-start justify-between">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bg} group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-5 h-5 ${color}`} />
                      </div>
                      <div className="flex items-center gap-1 text-xs text-green-400">
                        <ArrowUpRight className="w-3 h-3" />
                        {trend}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">{label}</p>
                      <p className={`text-2xl font-heading font-bold ${color}`}>{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Revenue Chart */}
              <div className="lg:col-span-2 glass-card rounded-lg p-6 space-y-4 border border-card-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h3 className="font-heading font-bold text-lg">Revenue Trend</h3>
                  </div>
                  <button className="p-2 hover:bg-muted/30 rounded-lg transition-colors">
                    <RefreshCw className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                {statsLoading ? (
                  <div className="h-64 bg-muted/10 rounded-lg animate-pulse" />
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={stats?.revenueByMonth ?? []} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={{ background: "#11183A", border: "1px solid #1A2247", borderRadius: 8, color: "#fff" }} formatter={(v: number) => [`Ksh ${v.toLocaleString()}`, "Revenue"]} />
                      <Bar dataKey="revenue" fill="#00F5FF" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Network Distribution */}
              <div className="glass-card rounded-lg p-6 space-y-4 border border-card-border">
                <h3 className="font-heading font-bold text-lg">Network Split</h3>
                {statsLoading ? (
                  <div className="h-64 bg-muted/10 rounded-lg animate-pulse" />
                ) : (
                  <div className="space-y-4">
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={stats?.revenueByNetwork ?? []} dataKey="revenue" nameKey="network" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                          {(Array.isArray(stats?.revenueByNetwork) ? stats?.revenueByNetwork : []).map((_, i) => (
                            <Cell key={i} fill={NETWORK_COLORS[i % NETWORK_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: "#11183A", border: "1px solid #1A2247", borderRadius: 8, color: "#fff" }} formatter={(v: number) => [`Ksh ${v.toLocaleString()}`, "Revenue"]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2">
                      {Array.isArray(stats?.revenueByNetwork) && stats?.revenueByNetwork.map((item: any) => (
                        <div key={item.network} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: NETWORK_COLORS[NETWORKS.indexOf(item.network) % NETWORK_COLORS.length] }} />
                            <span className="text-muted-foreground capitalize">{item.network}</span>
                          </div>
                          <span className="text-foreground font-medium">Ksh {(item.revenue || 0).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button className="glass-card rounded-lg p-5 space-y-3 border transition-all hover:border-primary/40 hover:bg-card/80 text-left group">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10 group-hover:scale-110 transition-transform">
                  <Plus className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Quick Action</p>
                  <p className="font-heading font-bold text-sm">Add Config Server</p>
                </div>
              </button>

              <button onClick={() => setActiveTab("Orders")} className="glass-card rounded-lg p-5 space-y-3 border transition-all hover:border-primary/40 hover:bg-card/80 text-left group">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-400/10 group-hover:scale-110 transition-transform">
                  <ShoppingCart className="w-5 h-5 text-green-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Quick Action</p>
                  <p className="font-heading font-bold text-sm">View Orders</p>
                </div>
              </button>

              <button className="glass-card rounded-lg p-5 space-y-3 border transition-all hover:border-primary/40 hover:bg-card/80 text-left group">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-yellow-400/10 group-hover:scale-110 transition-transform">
                  <Bell className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Quick Action</p>
                  <p className="font-heading font-bold text-sm">Send Notification</p>
                </div>
              </button>

              <button onClick={() => setActiveTab("Users")} className="glass-card rounded-lg p-5 space-y-3 border transition-all hover:border-primary/40 hover:bg-card/80 text-left group">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-secondary/10 group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5 text-secondary" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Quick Action</p>
                  <p className="font-heading font-bold text-sm">Manage Users</p>
                </div>
              </button>
            </div>

            {/* Recent Activity */}
            <div className="glass-card rounded-lg p-6 space-y-4 border border-card-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  <h3 className="font-heading font-bold text-lg">Recent Activity</h3>
                </div>
                <span className="text-xs text-muted-foreground">Last 5 items</span>
              </div>
              
              {orders.length === 0 && !ordersLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Activity className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground text-sm">No recent activity</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Orders will appear here as they are placed</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-muted/20 hover:border-primary/20 transition-all">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        order.status === "completed" ? "bg-green-400" :
                        order.status === "pending" ? "bg-yellow-400" :
                        order.status === "failed" ? "bg-red-400" : "bg-gray-400"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium truncate">{order.phone}</p>
                          <Badge variant="outline" className="text-xs">{capitalize(order.network)}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{capitalize(order.duration)} • Ksh {order.amount.toLocaleString()}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <Badge className={`text-xs ${
                          order.status === "completed" ? "bg-green-500/20 text-green-400 border-green-500/20" :
                          order.status === "pending" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/20" :
                          order.status === "failed" ? "bg-red-500/20 text-red-400 border-red-500/20" : 
                          "bg-muted/10 text-muted-foreground border-muted/20"
                        }`}>
                          {capitalize(order.status)}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">{timeAgo(order.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "Orders" && (
          <div className="space-y-6 animate-in fade-in-50 duration-300">
            {/* Search & Filter */}
            <div className="flex flex-col gap-2 md:gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by phone, device ID..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full pl-10 bg-card/50 border-card-border text-sm"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <select
                  value={orderFilter}
                  onChange={(e) => setOrderFilter(e.target.value)}
                  className="flex-1 min-w-max px-3 py-2 bg-card/50 border border-card-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="all">All Orders</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <Button onClick={fetchOrders} variant="outline" className="gap-2 px-3 py-2 h-auto text-sm">
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
              </div>
            </div>

            {/* Orders Table */}
            {ordersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-card/50 border border-card-border rounded-lg animate-pulse" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 glass-card rounded-lg border border-card-border">
                <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">No orders found</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {orders.map((order) => (
                  <div key={order.id} className="glass-card rounded-lg border border-card-border p-4 hover:bg-card/80 transition-all group">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1 flex-1 min-w-0">
                            <p className="text-sm font-medium text-primary">{order.phone}</p>
                            <p className="text-xs text-muted-foreground truncate">{order.deviceId}</p>
                            <p className="text-xs text-muted-foreground mt-1">Customer • Network: {capitalize(order.network)}</p>
                          </div>
                          <Badge className={`${statusColor(order.status)} flex-shrink-0 ml-2`}>{capitalize(order.status)}</Badge>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="outline" className={`text-xs ${networkColor(order.network)}`}>{capitalize(order.network)}</Badge>
                          <Badge variant="outline" className="text-xs text-yellow-400">{order.duration}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between md:flex-col md:items-end md:justify-between gap-2">
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-400">Ksh {order.amount.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{timeAgo(order.createdAt)}</p>
                        </div>
                        {order.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => setFulfillOrderId(order.id)}
                            className="bg-primary/20 hover:bg-primary/30 text-primary gap-2"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Fulfill
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Fulfill Modal */}
            {fulfillOrderId && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-card border border-card-border rounded-lg p-6 w-full max-w-md space-y-4">
                  <h3 className="font-heading font-bold text-lg">Fulfill Order</h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Configuration Server</Label>
                      {servers.length === 0 ? (
                        <div className="w-full px-3 py-2 bg-muted/30 border border-card-border rounded-lg text-muted-foreground text-sm flex items-center justify-center h-10">
                          No configuration servers available.
                        </div>
                      ) : (
                        <select
                          value={fulfillServerId}
                          onChange={(e) => setFulfillServerId(e.target.value)}
                          className="w-full px-3 py-2 bg-muted/30 border border-card-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer"
                        >
                          <option value="">Select a server...</option>
                          {servers.map((server: any) => (
                            <option key={server.id} value={server.id}>
                              {server.serverName} • {server.appType === "http_custom" ? "HTTP Custom" : "HTTP Injector"} • {capitalize(server.network)}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Setup Instructions</Label>
                      <textarea
                        placeholder="Optional setup instructions for the client"
                        value={fulfillInstructions}
                        onChange={(e) => setFulfillInstructions(e.target.value)}
                        className="w-full px-3 py-2 bg-muted/30 border border-card-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button onClick={() => setFulfillOrderId(null)} variant="outline">Cancel</Button>
                    <Button onClick={handleFulfillOrder} disabled={fulfilling || servers.length === 0} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                      {fulfilling && <Loader2 className="w-4 h-4 animate-spin" />}
                      Fulfill
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Config Servers Tab */}
        {activeTab === "Config Servers" && (
          <div className="space-y-6 animate-in fade-in-50 duration-300">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4">
              <h2 className="font-heading font-bold text-lg">Configuration Servers</h2>
              <Button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                <span className="sm:inline">Add Server</span>
              </Button>
            </div>

            {/* Add Server Form */}
            {showAddForm && (
              <div className="glass-card rounded-lg border border-card-border p-4 md:p-6 space-y-4 animate-in slide-in-from-top-2 overflow-x-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Server Name</Label>
                    <Input
                      placeholder="e.g., Safaricom Premium"
                      value={form.serverName}
                      onChange={(e) => setForm({ ...form, serverName: e.target.value })}
                      className="bg-muted/30 border-card-border"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Network</Label>
                    <select
                      value={form.network}
                      onChange={(e) => setForm({ ...form, network: e.target.value as any })}
                      className="w-full px-3 py-2 bg-muted/30 border border-card-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      {NETWORKS.map((n) => <option key={n} value={n}>{capitalize(n)}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">App Type</Label>
                    <select
                      value={form.appType}
                      onChange={(e) => setForm({ ...form, appType: e.target.value as any })}
                      className="w-full px-3 py-2 bg-muted/30 border border-card-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      {APP_TYPES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Plan Type</Label>
                    <select
                      value={form.planType}
                      onChange={(e) => setForm({ ...form, planType: e.target.value as any })}
                      className="w-full px-3 py-2 bg-muted/30 border border-card-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      {PLAN_TYPES.map((p) => <option key={p} value={p}>{capitalize(p)}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Duration</Label>
                    <select
                      value={form.duration}
                      onChange={(e) => setForm({ ...form, duration: e.target.value as any })}
                      className="w-full px-3 py-2 bg-muted/30 border border-card-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      {DURATIONS.map((d) => <option key={d} value={d}>{capitalize(d)}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Config File</Label>
                    <input
                      ref={fileRef}
                      type="file"
                      accept={acceptedExt}
                      onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })}
                      className="w-full text-xs text-muted-foreground file:mr-3 file:px-3 file:py-1.5 file:bg-primary/20 file:border-0 file:rounded file:text-primary file:cursor-pointer hover:file:bg-primary/30"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <Button onClick={() => setShowAddForm(false)} variant="outline">Cancel</Button>
                  <Button onClick={handleAddServer} disabled={uploading} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                    {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Add Server
                  </Button>
                </div>
              </div>
            )}

            {/* Servers List */}
            {serversLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-card/50 border border-card-border rounded-lg animate-pulse" />
                ))}
              </div>
            ) : servers.length === 0 ? (
              <div className="text-center py-12 glass-card rounded-lg border border-card-border">
                <Server className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">No config servers yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {(servers as any[]).map((server) => (
                  <div key={server.id} className="glass-card rounded-lg border border-card-border p-3 md:p-5 space-y-3 hover:bg-card/80 transition-all group">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-4">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-heading font-bold text-sm md:text-base truncate">{server.serverName}</h4>
                          <Badge variant="outline" className={`text-xs ${networkColor(server.network)}`}>{capitalize(server.network)}</Badge>
                          {server.isFree && <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/20">Free</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{server.appType} • {server.planType} • {server.duration}</p>
                      </div>
                      <Badge className={`w-fit ${server.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/20' : 'bg-red-500/20 text-red-400 border-red-500/20'}`}>
                        {capitalize(server.status)}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => downloadServer(server.id)} className="gap-2">
                        <Download className="w-3 h-3" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleStatus(server.id, server.status)}
                        className="gap-2"
                      >
                        {server.status === "active" ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {server.status === "active" ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleFree(server.id, server.isFree)}
                        className="gap-2"
                      >
                        <Gift className="w-3 h-3" />
                        {server.isFree ? "Unmark Free" : "Mark Free"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setReplaceId(replaceId === server.id ? null : server.id)}
                        className="gap-2"
                      >
                        <Upload className="w-3 h-3" />
                        Replace
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(server.id, server.serverName)}
                        className="gap-2 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </Button>
                    </div>

                    {/* Replace File Input */}
                    {replaceId === server.id && (
                      <div className="flex gap-2 pt-2 border-t border-card-border/50">
                        <input
                          ref={replaceFileRef}
                          type="file"
                          accept={acceptedExt}
                          onChange={(e) => setReplaceFile(e.target.files?.[0] || null)}
                          className="flex-1 text-xs text-muted-foreground file:mr-2 file:px-3 file:py-1 file:bg-primary/20 file:border-0 file:rounded file:text-primary file:cursor-pointer"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleReplaceFile(server.id)}
                          disabled={!replaceFile || uploading}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                        >
                          {uploading && <Loader2 className="w-3 h-3 animate-spin" />}
                          Upload
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "Notifications" && (
          <div className="animate-in fade-in-50 duration-300">
            <AdminNotificationsPanel />
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "Users" && (
          <div className="animate-in fade-in-50 duration-300 space-y-6">
            <div className="space-y-2">
              <h2 className="font-heading font-bold text-2xl">User Management</h2>
              <p className="text-muted-foreground">Manage registered users and their accounts</p>
            </div>

            <div className="glass-card rounded-lg p-6 space-y-4 border border-card-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by username, email, phone, or country..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-10 bg-card/50 border-card-border"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-card-border">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Avatar</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Username</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Phone</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Country</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Orders</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Active Plans</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Join Date</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr className="border-b border-card-border">
                        <td colSpan={10}>
                          <div className="flex items-center justify-center py-12">
                            <div className="space-y-3 text-center">
                              <Users className="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
                              <p className="text-muted-foreground font-medium">No users found</p>
                              <p className="text-xs text-muted-foreground">Try adjusting your search criteria</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b border-card-border hover:bg-muted/10 transition-colors">
                          <td className="py-3 px-4">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/50 rounded-lg flex items-center justify-center text-xs font-bold">
                              {user.username[0].toUpperCase()}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium">@{user.username}</td>
                          <td className="py-3 px-4 text-muted-foreground">{user.email}</td>
                          <td className="py-3 px-4 text-muted-foreground">{user.phone}</td>
                          <td className="py-3 px-4 text-muted-foreground">{user.country}</td>
                          <td className="py-3 px-4 text-center">{user.ordersCount}</td>
                          <td className="py-3 px-4 text-center">{user.activePlansCount}</td>
                          <td className="py-3 px-4">
                            <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground text-xs">{user.joinDate}</td>
                          <td className="py-3 px-4">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowUserDrawer(true);
                              }}
                              className="bg-primary/20 hover:bg-primary/30 text-primary text-xs"
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* User Detail Drawer */}
        <UserDetailDrawer
          user={selectedUser}
          isOpen={showUserDrawer}
          onClose={() => setShowUserDrawer(false)}
          onSendNotification={(userId) => {
            toast({ title: "Success", description: "Notification sent to user" });
            setShowUserDrawer(false);
          }}
        />

        {/* Settings Tab */}
        {activeTab === "Settings" && (
          <div className="animate-in fade-in-50 duration-300 space-y-6">
            <div className="space-y-2">
              <h2 className="font-heading font-bold text-2xl">Settings</h2>
              <p className="text-muted-foreground">Manage admin account and system preferences</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Profile Settings */}
              <div className="glass-card rounded-lg p-6 space-y-4 border border-card-border">
                <h3 className="font-heading font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Profile
                </h3>
                <div className="space-y-3 py-4 text-center">
                  <p className="text-sm text-muted-foreground">Admin profile settings</p>
                  <p className="text-xs text-muted-foreground">Coming soon</p>
                </div>
              </div>

              {/* Security Settings */}
              <div className="glass-card rounded-lg p-6 space-y-4 border border-card-border">
                <h3 className="font-heading font-bold flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Security
                </h3>
                <div className="space-y-3 py-4 text-center">
                  <p className="text-sm text-muted-foreground">Change password and security settings</p>
                  <p className="text-xs text-muted-foreground">Coming soon</p>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="glass-card rounded-lg p-6 space-y-4 border border-card-border">
                <h3 className="font-heading font-bold flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  Notifications
                </h3>
                <div className="space-y-3 py-4 text-center">
                  <p className="text-sm text-muted-foreground">Manage notification preferences</p>
                  <p className="text-xs text-muted-foreground">Coming soon</p>
                </div>
              </div>

              {/* System Settings */}
              <div className="glass-card rounded-lg p-6 space-y-4 border border-card-border">
                <h3 className="font-heading font-bold flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  System
                </h3>
                <div className="space-y-3 py-4 text-center">
                  <p className="text-sm text-muted-foreground">System configuration and preferences</p>
                  <p className="text-xs text-muted-foreground">Coming soon</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

// Missing icon import
function EyeOff(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.26 3.64m-5.88 5.88a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
