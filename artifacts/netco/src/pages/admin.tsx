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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { apiUrl } from "@/lib/api";
import { AdminNotificationsPanel } from "@/components/admin-notifications-panel";

const NETWORK_COLORS = ["#00F5FF", "#7B61FF", "#0057A8"];
const TABS = ["Dashboard", "Orders", "Config Servers", "Notifications"] as const;
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
        { icon: ShoppingCart, label: "Total Orders", value: (stats.totalOrders ?? 0).toLocaleString(), color: "text-primary", bg: "bg-primary/10 border-primary/20" },
        { icon: DollarSign, label: "Total Revenue", value: `Ksh ${(stats.totalRevenue ?? 0).toLocaleString()}`, color: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
        { icon: Users, label: "Active Users", value: (stats.activeUsers ?? 0).toLocaleString(), color: "text-secondary", bg: "bg-secondary/10 border-secondary/20" },
        { icon: Server, label: "Active Plans", value: (stats.activePlans ?? 0).toLocaleString(), color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" },
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
      // Convert file to base64 for transport to backend
      const fileArrayBuffer = await form.file.arrayBuffer();
      const fileBytes = new Uint8Array(fileArrayBuffer);
      const fileBase64 = btoa(String.fromCharCode(...fileBytes));

      // Call backend API to handle file upload to Supabase using service role (bypasses RLS)
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
      console.log("[v0] Replacing config file at:", url);
      const res = await fetch(url, { method: "PUT", body: fd });
      console.log("[v0] Replace response:", res.status);
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
      console.error("[v0] Replace error:", err);
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
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-heading font-bold mb-2">
              Admin <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Panel</span>
            </h1>
            <p className="text-muted-foreground">Platform management and analytics</p>
          </div>
          {newOrderCount > 0 && (
            <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-xl px-4 py-2 animate-in slide-in-from-top-2">
              <Bell className="w-4 h-4 text-primary animate-bounce" />
              <span className="text-primary text-sm font-medium">{newOrderCount} new order{newOrderCount > 1 ? "s" : ""}</span>
              <button onClick={() => setNewOrderCount(0)} className="text-muted-foreground hover:text-foreground ml-1">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 p-1 glass-card rounded-xl w-fit">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); if (tab === "Orders") setNewOrderCount(0); }}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all relative ${
                activeTab === tab
                  ? "bg-primary text-primary-foreground glow-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
              {tab === "Orders" && pendingOrders > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-400 text-black text-[9px] font-bold flex items-center justify-center">
                  {pendingOrders > 9 ? "9+" : pendingOrders}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ─────────── DASHBOARD TAB ─────────── */}
        {activeTab === "Dashboard" && (
          <div className="space-y-8">
            {statsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => <div key={i} className="glass-card rounded-xl p-5 animate-pulse h-28" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statCards.map(({ icon: Icon, label, value, color, bg }) => (
                  <div key={label} className={`glass-card rounded-xl p-5 space-y-3 border ${bg}`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bg}`}>
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest">{label}</p>
                      <p className={`text-xl font-heading font-bold ${color}`}>{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 glass-card rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h2 className="font-heading font-bold text-lg">Revenue by Month</h2>
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

              <div className="glass-card rounded-xl p-6 space-y-4">
                <h2 className="font-heading font-bold text-lg">Revenue by Network</h2>
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
                      {(Array.isArray(stats?.revenueByNetwork) ? stats?.revenueByNetwork : []).map((n, i) => (
                        <div key={n.network} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: NETWORK_COLORS[i % NETWORK_COLORS.length] }} />
                            <span className="text-muted-foreground">{capitalize(n.network)}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">Ksh {n.revenue.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">{n.orders} orders</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="glass-card rounded-xl p-6 space-y-4">
              <h2 className="font-heading font-bold text-lg">Monthly Breakdown</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Month</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-medium">Orders</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-medium">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statsLoading
                      ? [1, 2, 3, 4].map((i) => (
                          <tr key={i} className="border-b border-border/50">
                            <td className="py-3 px-4"><div className="h-4 bg-muted/20 rounded w-16 animate-pulse" /></td>
                            <td className="py-3 px-4 text-right"><div className="h-4 bg-muted/20 rounded w-12 animate-pulse ml-auto" /></td>
                            <td className="py-3 px-4 text-right"><div className="h-4 bg-muted/20 rounded w-20 animate-pulse ml-auto" /></td>
                          </tr>
                        ))
                      : (Array.isArray(stats?.revenueByMonth) ? stats?.revenueByMonth : []).slice().reverse().slice(0, 6).map((row) => (
                          <tr key={row.month} className="border-b border-border/50 hover:bg-muted/5 transition-colors">
                            <td className="py-3 px-4 font-medium">{row.month}</td>
                            <td className="py-3 px-4 text-right text-muted-foreground">{row.orders.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right text-primary font-medium">Ksh {row.revenue.toLocaleString()}</td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─────────── ORDERS TAB ─────────── */}
        {activeTab === "Orders" && (
          <div className="space-y-5">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex gap-2 flex-wrap">
                {["all", "pending", "completed", "failed", "cancelled"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setOrderFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      orderFilter === f
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {capitalize(f)}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-52">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search phone or ref…"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchOrders()}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <Button size="sm" onClick={fetchOrders} variant="outline" className="border-border gap-1.5 shrink-0">
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Live indicator */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Live updates active — new orders appear instantly
            </div>

            {ordersLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => <div key={i} className="glass-card rounded-xl h-20 animate-pulse" />)}
              </div>
            ) : orders.length === 0 ? (
              <div className="glass-card rounded-xl p-12 text-center space-y-3">
                <Package className="w-10 h-10 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">No orders found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {orders.map((order) => (
                  <div key={order.id} className="glass-card rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Left: main info */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor(order.status)}`}>
                          {order.status === "completed" && <Check className="w-3 h-3" />}
                          {order.status === "pending" && <Clock className="w-3 h-3" />}
                          {order.status === "failed" && <XCircle className="w-3 h-3" />}
                          {capitalize(order.status)}
                        </span>
                        <span className={`text-xs font-medium ${networkColor(order.network)}`}>{capitalize(order.network)}</span>
                        <span className="text-xs text-muted-foreground">{capitalize(order.duration)}</span>
                        <span className="text-xs text-muted-foreground">{order.appType === "http_custom" ? "HTTP Custom" : "HTTP Injector"}</span>
                        {order.configUrl && <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Config ready</span>}
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-medium text-foreground">{order.phone}</span>
                        <span className="text-sm font-bold text-primary">Ksh {order.amount.toLocaleString()}</span>
                        {order.paymentReference && (
                          <span className="text-xs font-mono text-muted-foreground truncate max-w-[140px]">{order.paymentReference}</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono truncate">{order.deviceId}</div>
                    </div>

                    {/* Right: time + actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">{timeAgo(order.createdAt)}</span>

                      {order.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => { setFulfillOrderId(order.id); setFulfillServerId(""); }}
                          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1 text-xs h-8"
                        >
                          <Zap className="w-3 h-3" /> Fulfill
                        </Button>
                      )}

                      {order.status === "completed" && order.configUrl && (
                        <a href={order.configUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="border-green-500/30 text-green-400 hover:bg-green-500/10 gap-1 text-xs h-8">
                            <Download className="w-3 h-3" /> Config
                          </Button>
                        </a>
                      )}

                      {order.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkStatus(order.id, "failed")}
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs h-8"
                        >
                          <XCircle className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Fulfill Dialog */}
            {fulfillOrderId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="glass-card rounded-2xl p-6 w-full max-w-md space-y-5 border border-primary/30">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading font-bold text-lg text-primary flex items-center gap-2">
                      <Zap className="w-5 h-5" /> Fulfill Order
                    </h3>
                    <button onClick={() => { setFulfillOrderId(null); setFulfillServerId(""); }} className="text-muted-foreground hover:text-foreground">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Select a config server to deliver, or leave blank to auto-match by network, app type, and duration.
                  </p>

  <div className="space-y-2">
  <Label>Config Server (optional)</Label>
  <select
  value={fulfillServerId}
  onChange={(e) => setFulfillServerId(e.target.value)}
  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
  >
  <option value="">— Auto-match by order details —</option>
  {(servers as Array<{ id: string; serverName: string; network: string; duration: string; status: string }>)
  .filter((s) => s.status === "active")
  .map((s) => (
  <option key={s.id} value={s.id}>
  {s.serverName} ({capitalize(s.network)} · {capitalize(s.duration)})
  </option>
  ))}
  </select>
  </div>

  <div className="space-y-2">
  <Label>Customer Instructions (optional)</Label>
  <textarea
  value={fulfillInstructions}
  onChange={(e) => setFulfillInstructions(e.target.value)}
  placeholder="This file will connect within a few seconds after importing.&#10;Do not edit payload settings.&#10;Allow VPN permission if requested."
  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none h-24"
  />
  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleFulfillOrder}
                      disabled={fulfilling}
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                    >
                      {fulfilling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                      {fulfilling ? "Fulfilling…" : "Deliver Config"}
                    </Button>
                    <Button variant="outline" onClick={() => { setFulfillOrderId(null); setFulfillServerId(""); }} className="flex-1 border-border">
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─────────── NOTIFICATIONS TAB ─────────── */}
        {activeTab === "Notifications" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-heading font-bold">Notifications</h2>
              <p className="text-muted-foreground text-sm mt-1">Send notifications to users</p>
            </div>
            <AdminNotificationsPanel />
          </div>
        )}

        {/* ─────────── CONFIG SERVERS TAB ─────────── */}
        {activeTab === "Config Servers" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-heading font-bold">VPN Config Servers</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Upload <code className="text-primary text-xs">.hc</code> / <code className="text-primary text-xs">.ehi</code> files. Toggle <span className="text-yellow-400 font-medium">Free</span> to offer them as free trials.
                </p>
              </div>
              <Button
                onClick={() => setShowAddForm(true)}
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 glow-primary shrink-0"
              >
                <Plus className="w-4 h-4" /> Add New Server
              </Button>
            </div>

            {/* App download links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {APP_TYPES.map((app) => (
                <a key={app.value} href={app.store} target="_blank" rel="noopener noreferrer"
                  className="glass-card rounded-xl p-4 flex items-center gap-3 hover:border-primary/40 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{app.label}</p>
                    <p className="text-xs text-muted-foreground">Config format: {app.ext}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
                </a>
              ))}
            </div>

            {/* Add Server Form */}
            {showAddForm && (
              <div className="glass-card rounded-xl p-6 border border-primary/30 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-lg text-primary">Add New Config Server</h3>
                  <button onClick={() => { setShowAddForm(false); setForm(EMPTY_FORM); }} className="text-muted-foreground hover:text-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label htmlFor="serverName">Server Name</Label>
                    <Input id="serverName" placeholder="e.g. Safaricom Unlimited Monthly" value={form.serverName} onChange={(e) => setForm((f) => ({ ...f, serverName: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Network</Label>
                    <select value={form.network} onChange={(e) => setForm((f) => ({ ...f, network: e.target.value }))} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                      {NETWORKS.map((n) => <option key={n} value={n}>{capitalize(n)}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>App Type</Label>
                    <select value={form.appType} onChange={(e) => setForm((f) => ({ ...f, appType: e.target.value, file: null }))} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                      {APP_TYPES.map((a) => <option key={a.value} value={a.value}>{a.label} ({a.ext})</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Plan Type</Label>
                    <select value={form.planType} onChange={(e) => setForm((f) => ({ ...f, planType: e.target.value }))} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                      {PLAN_TYPES.map((p) => <option key={p} value={p}>{capitalize(p)}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Duration</Label>
                    <select value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                      {DURATIONS.map((d) => <option key={d} value={d}>{capitalize(d)}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label>Config File ({selectedAppType?.ext})</Label>
                    <div onClick={() => fileRef.current?.click()} className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all hover:border-primary/60 ${form.file ? "border-primary/50 bg-primary/5" : "border-border"}`}>
                      <input ref={fileRef} type="file" accept={acceptedExt} className="hidden" onChange={(e) => setForm((prev) => ({ ...prev, file: e.target.files?.[0] ?? null }))} />
                      {form.file ? (
                        <div className="flex items-center justify-center gap-3">
                          <CheckCircle className="w-5 h-5 text-primary" />
                          <span className="text-sm font-medium text-primary">{form.file.name}</span>
                          <span className="text-xs text-muted-foreground">({(form.file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
                          <p className="text-sm text-muted-foreground">Click to upload <span className="text-primary font-medium">{selectedAppType?.ext}</span> config file</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button onClick={handleAddServer} disabled={uploading} className="gap-2 bg-primary text-primary-foreground">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploading ? "Uploading..." : "Add Server"}
                  </Button>
                  <Button variant="outline" onClick={() => { setShowAddForm(false); setForm(EMPTY_FORM); }}>Cancel</Button>
                </div>
              </div>
            )}

            {/* Server list */}
            {serversLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="glass-card rounded-xl h-28 animate-pulse" />)}</div>
            ) : servers.length === 0 ? (
              <div className="glass-card rounded-xl p-12 text-center space-y-3">
                <Server className="w-10 h-10 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">No config servers yet. Add your first one.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(Array.isArray(servers) ? servers : []).map((server: any) => (
                  <div key={server.id} className={`glass-card rounded-xl p-4 border transition-all ${server.status === "active" ? "border-border" : "border-border/30 opacity-60"}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{server.serverName}</span>
                          {server.isFree && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
                              <Gift className="w-3 h-3" /> Free
                            </span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${server.status === "active" ? "bg-green-400/10 text-green-400 border-green-400/20" : "bg-muted/20 text-muted-foreground border-border"}`}>
                            {server.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                          <span className={`font-medium ${networkColor(server.network)}`}>{capitalize(server.network)}</span>
                          <span>·</span>
                          <span>{capitalize(server.planType)}</span>
                          <span>·</span>
                          <span>{capitalize(server.duration)}</span>
                          <span>·</span>
                          <span>{server.appType === "http_custom" ? "HTTP Custom" : "HTTP Injector"}</span>
                          <span>·</span>
                          <span className="font-mono">{server.originalName}</span>
                          {server.fileSize && <span>({(server.fileSize / 1024).toFixed(1)} KB)</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Free toggle */}
                        <button
                          onClick={() => handleToggleFree(server.id, !!server.isFree)}
                          title={server.isFree ? "Remove from free offers" : "Set as free offer"}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                            server.isFree
                              ? "bg-yellow-400/10 text-yellow-400 border-yellow-400/30 hover:bg-yellow-400/20"
                              : "border-border text-muted-foreground hover:text-yellow-400 hover:border-yellow-400/30"
                          }`}
                        >
                          <Gift className="w-3.5 h-3.5" />
                          {server.isFree ? "Free" : "Set Free"}
                        </button>

                        {/* Active/Inactive toggle */}
                        <button
                          onClick={() => handleToggleStatus(server.id, server.status)}
                          title={server.status === "active" ? "Deactivate" : "Activate"}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {server.status === "active"
                            ? <ToggleRight className="w-6 h-6 text-primary" />
                            : <ToggleLeft className="w-6 h-6" />}
                        </button>

                        {/* Download */}
                        <button onClick={() => downloadServer(server.id)} title="Download config" className="text-muted-foreground hover:text-primary transition-colors">
                          <Download className="w-4 h-4" />
                        </button>

                        {/* Replace file */}
                        {replaceId === server.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              ref={replaceFileRef}
                              type="file"
                              accept={server.appType === "http_custom" ? ".hc" : ".ehi"}
                              className="hidden"
                              onChange={(e) => setReplaceFile(e.target.files?.[0] ?? null)}
                            />
                            <Button size="sm" variant="outline" onClick={() => replaceFileRef.current?.click()} className="text-xs h-7 border-border">
                              {replaceFile ? replaceFile.name : "Choose file"}
                            </Button>
                            {replaceFile && (
                              <Button size="sm" onClick={() => handleReplaceFile(server.id)} disabled={uploading} className="h-7 text-xs bg-primary text-primary-foreground">
                                {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                              </Button>
                            )}
                            <button onClick={() => { setReplaceId(null); setReplaceFile(null); }} className="text-muted-foreground hover:text-foreground">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => { setReplaceId(server.id); setReplaceFile(null); }} title="Replace config file" className="text-muted-foreground hover:text-secondary transition-colors">
                            <Upload className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete */}
                        <button onClick={() => handleDelete(server.id, server.serverName)} title="Delete" className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
