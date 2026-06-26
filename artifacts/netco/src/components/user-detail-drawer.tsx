import { useState } from "react";
import {
  X, Mail, Phone, MapPin, Shield, Clock, CheckCircle, AlertCircle,
  Smartphone, Globe, Calendar, Send, ShoppingCart, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface UserDetailDrawerProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onSendNotification: (userId: string) => void;
}

export function UserDetailDrawer({ user, isOpen, onClose, onSendNotification }: UserDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "devices" | "history" | "plans">("profile");

  if (!isOpen || !user) return null;

  // Mock data for demonstration - replace with real API calls
  const devices = [
    { name: "iPhone 13", browser: "Safari", os: "iOS 16", lastActive: "2 hours ago" },
    { name: "Desktop", browser: "Chrome", os: "Windows 11", lastActive: "1 day ago" },
  ];

  const loginHistory = [
    { browser: "Safari", device: "iPhone", status: "success", date: "2 hours ago" },
    { browser: "Chrome", device: "Desktop", status: "success", date: "1 day ago" },
  ];

  const plans = [
    { name: "Safaricom Monthly", network: "safaricom", expiry: "2024-07-26", status: "active" },
  ];

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
                  {user.username?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-lg">{user.fullName || user.username}</p>
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{user.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{user.country || "Not specified"}</span>
                </div>
              </div>

              {user.bio && <p className="text-sm text-muted-foreground italic">{user.bio}</p>}
            </div>
          </div>

          {/* Verification Status */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Verification</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-muted/10 rounded-lg border border-muted/20">
                <span className="text-sm">Email Verified</span>
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/10 rounded-lg border border-muted/20">
                <span className="text-sm">Phone Verified</span>
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/10 rounded-lg border border-muted/20">
                <span className="text-sm">Two Factor Authentication</span>
                <AlertCircle className="w-5 h-5 text-yellow-400" />
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Statistics</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-card rounded-lg p-4 border border-card-border text-center">
                <p className="text-2xl font-bold text-primary">{user.ordersCount || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Orders</p>
              </div>
              <div className="glass-card rounded-lg p-4 border border-card-border text-center">
                <p className="text-2xl font-bold text-green-400">Ksh {user.totalSpent || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Spent</p>
              </div>
              <div className="glass-card rounded-lg p-4 border border-card-border text-center">
                <p className="text-2xl font-bold text-blue-400">{user.notificationsCount || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Notifications</p>
              </div>
              <div className="glass-card rounded-lg p-4 border border-card-border text-center">
                <p className="text-2xl font-bold text-yellow-400">{user.activePlansCount || 0}</p>
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
                {devices.map((device, idx) => (
                  <div key={idx} className="p-3 bg-muted/10 rounded-lg border border-muted/20">
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
                ))}
              </div>
            )}

            {/* Login History Tab */}
            {activeTab === "history" && (
              <div className="space-y-2">
                {loginHistory.map((login, idx) => (
                  <div key={idx} className="p-3 bg-muted/10 rounded-lg border border-muted/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{login.browser} • {login.device}</p>
                          <p className="text-xs text-muted-foreground">{login.date}</p>
                        </div>
                      </div>
                      <Badge className={login.status === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                        {login.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Plans Tab */}
            {activeTab === "plans" && (
              <div className="space-y-2">
                {plans.map((plan, idx) => (
                  <div key={idx} className="p-3 bg-muted/10 rounded-lg border border-muted/20">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">{plan.name}</p>
                      <Badge className={plan.status === "active" ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}>
                        {plan.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{plan.network}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {plan.expiry}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t border-card-border">
            <Button
              onClick={() => onSendNotification(user.id)}
              className="flex-1 bg-primary/20 hover:bg-primary/30 text-primary gap-2"
            >
              <Send className="w-4 h-4" />
              Send Notification
            </Button>
            <Button variant="outline" className="flex-1 gap-2">
              <ShoppingCart className="w-4 h-4" />
              View Orders
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
