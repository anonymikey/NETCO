import { useState } from "react";
import {
  X, Mail, Phone, MapPin, Shield, Clock, CheckCircle, AlertCircle,
  Smartphone, Globe, Calendar, Send, ShoppingCart, Eye, Loader2, Users, Package,
  Copy, CheckCheck, Wifi, WifiOff, Dot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserDevices, useUserLoginHistory, useUserPlans, useUserOrders } from "@/hooks/useAdminUsers";

// Utility functions
function getDeviceStatus(lastActive: string): "online" | "recent" | "offline" {
  if (!lastActive) return "offline";
  const lastActiveTime = new Date(lastActive).getTime();
  const now = new Date().getTime();
  const diffMinutes = (now - lastActiveTime) / (1000 * 60);
  
  if (diffMinutes < 5) return "online";
  if (diffMinutes < 60) return "recent";
  return "offline";
}

function getUserStatus(lastActive: string | null, hasActivePlans: boolean): "active" | "inactive" | "offline" {
  if (!lastActive) return "offline";
  if (!hasActivePlans) return "inactive";
  const lastActiveTime = new Date(lastActive).getTime();
  const now = new Date().getTime();
  const diffHours = (now - lastActiveTime) / (1000 * 60 * 60);
  
  if (diffHours < 24) return "active";
  return "inactive";
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

interface UserDetailDrawerProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onSendNotification: (userId: string) => void;
}

export function UserDetailDrawer({ user, isOpen, onClose, onSendNotification }: UserDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "orders" | "devices" | "history" | "plans">("profile");
  
  // Fetch real data from Supabase
  const { orders, loading: ordersLoading } = useUserOrders(user?.id);
  const { devices, loading: devicesLoading } = useUserDevices(user?.id);
  const { history: loginHistory, loading: historyLoading } = useUserLoginHistory(user?.id);
  const { plans, loading: plansLoading } = useUserPlans(user?.id);

  if (!user) {
    return (
      <>
        {isOpen && <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />}
        <div className={`fixed right-0 top-0 h-full w-full max-w-2xl bg-card border-l border-card-border shadow-lg transition-transform z-50 overflow-y-auto ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div className="sticky top-0 bg-card border-b border-card-border p-6 flex items-center justify-between">
            <h2 className="font-heading font-bold text-xl">User Profile</h2>
            <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 flex items-center justify-center h-96">
            <div className="text-center space-y-3">
              <Users className="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
              <p className="text-muted-foreground font-medium">No user selected</p>
              <p className="text-xs text-muted-foreground">Select a user from the list to view details</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />}
      <div className={`fixed right-0 top-0 h-full w-full max-w-2xl bg-card border-l border-card-border shadow-lg transition-transform z-50 overflow-y-auto ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-card-border p-6 flex items-center justify-between">
          <h2 className="font-heading font-bold text-xl">User Profile</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* User Status Header */}
          <div className="flex items-center justify-between pb-4 border-b border-card-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/50 rounded-lg flex items-center justify-center text-lg font-bold text-primary-foreground">
                {(user?.username || "U")[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-lg">{user?.fullName || user?.username || "Unknown User"}</p>
                <p className="text-xs text-muted-foreground">@{user?.username || "No username"}</p>
              </div>
            </div>
            <Badge className={`flex items-center gap-1 ${
              user?.status === "active" ? "bg-green-500/20 text-green-400" :
              user?.status === "inactive" ? "bg-yellow-500/20 text-yellow-400" :
              "bg-red-500/20 text-red-400"
            }`}>
              <Dot className="w-2 h-2 fill-current" />
              {user?.status || "Unknown"}
            </Badge>
          </div>

          {/* Profile Info */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Profile</h3>
            <div className="glass-card rounded-lg p-4 space-y-3 border border-card-border">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/50 rounded-lg flex items-center justify-center text-2xl font-bold text-primary-foreground">
                  {(user?.username || "U")[0]?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-lg">{user?.fullName || user?.username || "Unknown User"}</p>
                  <p className="text-sm text-muted-foreground">@{user?.username || "No username"}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm group">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{user?.email || "No email"}</span>
                  </div>
                  {user?.email && (
                    <button
                      onClick={() => copyToClipboard(user.email)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                      title="Copy email"
                    >
                      <Copy className="w-3 h-3 text-muted-foreground" />
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm group">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{user?.phone || "No phone"}</span>
                  </div>
                  {user?.phone && (
                    <button
                      onClick={() => copyToClipboard(user.phone)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                      title="Copy phone"
                    >
                      <Copy className="w-3 h-3 text-muted-foreground" />
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm group">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{user?.country || "Not specified"}</span>
                  </div>
                  {user?.id && (
                    <button
                      onClick={() => copyToClipboard(user.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                      title="Copy User ID"
                    >
                      <Copy className="w-3 h-3 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Last Login Card */}
              {loginHistory && loginHistory.length > 0 && (
                <div className="pt-3 border-t border-card-border">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Last Login</p>
                  <div className="bg-muted/5 rounded p-2 border border-muted/10">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{loginHistory[0].browser}</span>
                      <Badge className={loginHistory[0].status === "success" ? "bg-green-500/20 text-green-400 text-xs" : "bg-red-500/20 text-red-400 text-xs"}>
                        {loginHistory[0].status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{loginHistory[0].device}</p>
                    {loginHistory[0].ipAddress && <p className="text-xs text-muted-foreground">IP: {loginHistory[0].ipAddress}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{loginHistory[0].date}</p>
                  </div>
                </div>
              )}

              {user?.bio && <p className="text-sm text-muted-foreground italic">{user.bio}</p>}
            </div>
          </div>

          {/* Verification Status */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Verification</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-muted/10 rounded-lg border border-muted/20">
                <span className="text-sm">Email Verified</span>
                {user?.emailVerified ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                )}
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/10 rounded-lg border border-muted/20">
                <span className="text-sm">Phone Verified</span>
                {user?.phoneVerified ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                )}
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/10 rounded-lg border border-muted/20">
                <span className="text-sm">Two Factor Authentication</span>
                {user?.twoFactorEnabled ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                )}
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Statistics</h3>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="glass-card rounded-lg p-4 border border-card-border text-center hover:border-primary/50 transition-colors">
                <p className="text-2xl font-bold text-primary">{user?.ordersCount ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Orders</p>
              </div>
              <div className="glass-card rounded-lg p-4 border border-card-border text-center hover:border-green-500/50 transition-colors">
                <p className="text-2xl font-bold text-green-400">Ksh {(user?.totalSpent ?? 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Spent</p>
              </div>
              <div className="glass-card rounded-lg p-4 border border-card-border text-center hover:border-blue-500/50 transition-colors">
                <p className="text-2xl font-bold text-blue-400">{user?.activePlansCount ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Active Plans</p>
              </div>
              <div className="glass-card rounded-lg p-4 border border-card-border text-center hover:border-yellow-500/50 transition-colors">
                <p className="text-2xl font-bold text-yellow-400">{devices?.length ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Connected Devices</p>
              </div>
              <div className="glass-card rounded-lg p-4 border border-card-border text-center hover:border-cyan-500/50 transition-colors">
                <p className="text-2xl font-bold text-cyan-400">{user?.notificationsCount ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Unread Notifs</p>
              </div>
              <div className="glass-card rounded-lg p-4 border border-card-border text-center hover:border-purple-500/50 transition-colors">
                <p className="text-2xl font-bold text-purple-400">{user?.joinDate}</p>
                <p className="text-xs text-muted-foreground mt-1">Member Since</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div>
            <div className="flex gap-2 mb-4 border-b border-card-border overflow-x-auto">
              {["profile", "orders", "devices", "history", "plans"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === tab
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Orders Tab */}
            {activeTab === "orders" && (
              <div className="space-y-2">
                {ordersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-8 h-8 text-muted-foreground mx-auto opacity-50 mb-2" />
                    <p className="text-sm text-muted-foreground">No orders found</p>
                  </div>
                ) : (
                  orders.map((order) => (
                    <div key={order.id} className="p-3 bg-muted/10 rounded-lg border border-muted/20">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium capitalize">{order.network}</span>
                        </div>
                        <Badge className={
                          order.status === "completed" ? "bg-green-500/20 text-green-400" :
                          order.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                          order.status === "failed" ? "bg-red-500/20 text-red-400" :
                          "bg-gray-500/20 text-gray-400"
                        }>
                          {order.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-medium">Ksh {order.amount.toLocaleString()}</span>
                        <span>{order.createdAt}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Devices Tab */}
            {activeTab === "devices" && (
              <div className="space-y-2">
                {devicesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : devices.length === 0 ? (
                  <div className="text-center py-8">
                    <Smartphone className="w-8 h-8 text-muted-foreground mx-auto opacity-50 mb-2" />
                    <p className="text-sm text-muted-foreground">No devices found</p>
                  </div>
                ) : (
                  devices.map((device) => {
                    const status = getDeviceStatus(device.lastActive);
                    return (
                      <div key={device.id} className="p-3 bg-muted/10 rounded-lg border border-muted/20 hover:border-muted/40 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{device.name}</p>
                              <p className="text-xs text-muted-foreground">{device.browser} • {device.os}</p>
                            </div>
                          </div>
                          <Badge className={`flex items-center gap-1 text-xs ${
                            status === "online" ? "bg-green-500/20 text-green-400" :
                            status === "recent" ? "bg-blue-500/20 text-blue-400" :
                            "bg-gray-500/20 text-gray-400"
                          }`}>
                            {status === "online" && <Wifi className="w-3 h-3" />}
                            {status === "offline" && <WifiOff className="w-3 h-3" />}
                            {status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Last active: {device.lastActive}</p>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Login History Tab */}
            {activeTab === "history" && (
              <div className="space-y-2">
                {historyLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : loginHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-8 h-8 text-muted-foreground mx-auto opacity-50 mb-2" />
                    <p className="text-sm text-muted-foreground">No login history</p>
                  </div>
                ) : (
                  loginHistory.map((login) => (
                    <div key={login.id} className="p-3 bg-muted/10 rounded-lg border border-muted/20 hover:border-muted/40 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{login.browser}</p>
                            <p className="text-xs text-muted-foreground">{login.device}</p>
                          </div>
                        </div>
                        <Badge className={login.status === "success" ? "bg-green-500/20 text-green-400 gap-1" : "bg-red-500/20 text-red-400 gap-1"}>
                          {login.status === "success" ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {login.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p>{login.date}</p>
                        {login.ipAddress && <p>IP: {login.ipAddress}</p>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Plans Tab */}
            {activeTab === "plans" && (
              <div className="space-y-2">
                {plansLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : plans.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-8 h-8 text-muted-foreground mx-auto opacity-50 mb-2" />
                    <p className="text-sm text-muted-foreground">No active plans</p>
                  </div>
                ) : (
                  plans.map((plan) => (
                    <div key={plan.id} className="p-3 bg-muted/10 rounded-lg border border-muted/20">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">{plan.name}</p>
                        <Badge className={plan.status === "active" ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}>
                          {plan.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="capitalize">{plan.network}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {plan.expiryDate}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Button
                onClick={() => user?.id && onSendNotification(user.id)}
                disabled={!user?.id}
                className="bg-primary/20 hover:bg-primary/30 text-primary gap-2 h-auto py-3"
              >
                <Send className="w-4 h-4" />
                <span className="text-xs">Send Notification</span>
              </Button>
              <Button 
                variant="outline" 
                className="gap-2 h-auto py-3" 
                disabled={!user?.id}
                onClick={() => setActiveTab("orders")}
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="text-xs">View Orders</span>
              </Button>
              <Button 
                variant="outline" 
                className="gap-2 h-auto py-3" 
                disabled={!user?.id}
                onClick={() => setActiveTab("plans")}
              >
                <Eye className="w-4 h-4" />
                <span className="text-xs">View Plans</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
