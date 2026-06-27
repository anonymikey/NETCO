import { useState } from "react";
import {
  X, Mail, Phone, MapPin, Shield, Clock, CheckCircle, AlertCircle,
  Smartphone, Globe, Calendar, Send, ShoppingCart, Eye, Loader2, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserDevices, useUserLoginHistory, useUserPlans } from "@/hooks/useAdminUsers";

interface UserDetailDrawerProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onSendNotification: (userId: string) => void;
}

export function UserDetailDrawer({ user, isOpen, onClose, onSendNotification }: UserDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "devices" | "history" | "plans">("profile");
  
  // Fetch real data from Supabase
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
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{user?.email || "No email"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{user?.phone || "No phone"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{user?.country || "Not specified"}</span>
                </div>
              </div>

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
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-card rounded-lg p-4 border border-card-border text-center">
                <p className="text-2xl font-bold text-primary">{user?.ordersCount ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Orders</p>
              </div>
              <div className="glass-card rounded-lg p-4 border border-card-border text-center">
                <p className="text-2xl font-bold text-green-400">Ksh {user?.totalSpent ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Spent</p>
              </div>
              <div className="glass-card rounded-lg p-4 border border-card-border text-center">
                <p className="text-2xl font-bold text-blue-400">{user?.notificationsCount ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Notifications</p>
              </div>
              <div className="glass-card rounded-lg p-4 border border-card-border text-center">
                <p className="text-2xl font-bold text-yellow-400">{user?.activePlansCount ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Active Plans</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div>
            <div className="flex gap-2 mb-4 border-b border-card-border">
              {["profile", "devices", "history", "plans"].map((tab) => (
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
                  devices.map((device) => (
                    <div key={device.id} className="p-3 bg-muted/10 rounded-lg border border-muted/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{device.name}</p>
                            <p className="text-xs text-muted-foreground">{device.browser} • {device.os}</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{device.lastActive}</p>
                      </div>
                    </div>
                  ))
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
                    <div key={login.id} className="p-3 bg-muted/10 rounded-lg border border-muted/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{login.browser} • {login.device}</p>
                            <p className="text-xs text-muted-foreground">{login.date}</p>
                            {login.ipAddress && <p className="text-xs text-muted-foreground">IP: {login.ipAddress}</p>}
                          </div>
                        </div>
                        <Badge className={login.status === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                          {login.status}
                        </Badge>
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

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t border-card-border">
            <Button
              onClick={() => user?.id && onSendNotification(user.id)}
              disabled={!user?.id}
              className="flex-1 bg-primary/20 hover:bg-primary/30 text-primary gap-2"
            >
              <Send className="w-4 h-4" />
              Send Notification
            </Button>
            <Button variant="outline" className="flex-1 gap-2" disabled={!user?.id}>
              <ShoppingCart className="w-4 h-4" />
              View Orders
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
