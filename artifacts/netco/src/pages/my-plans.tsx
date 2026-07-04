import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { PlanCountdownTimer } from "@/components/plan-countdown-timer";
import { SubscriptionProgress } from "@/components/subscription-progress";
import { NetworkLogo } from "@/components/network-logo";
import { ExpiryBadge } from "@/components/expiry-badge";
import {
  Download, Eye, RotateCcw, Loader2, AlertCircle, CheckCircle2,
  Clock, Zap, Smartphone, Globe, Calendar, FileText
} from "lucide-react";

interface Plan {
  id: string;
  network: string;
  planName: string;
  duration: string;
  expiryDate: string;
  status: "active" | "expired" | "expiring_soon";
  appType: string;
  deviceId: string;
  speed: string;
  createdAt: string;
}

const MOCK_PLANS: Plan[] = [
  {
    id: "plan-1",
    network: "Safaricom",
    planName: "Premium 100GB",
    duration: "30 days",
    expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: "expiring_soon",
    appType: "VPN",
    deviceId: "device-001",
    speed: "Unlimited",
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "plan-2",
    network: "Airtel",
    planName: "Basic 50GB",
    duration: "30 days",
    expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
    appType: "VPN",
    deviceId: "device-002",
    speed: "High",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "plan-3",
    network: "Telkom",
    planName: "Standard 75GB",
    duration: "30 days",
    expiryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: "expired",
    appType: "VPN",
    deviceId: "device-003",
    speed: "Medium",
    createdAt: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

function formatTimeLeft(expiryDate: string) {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diff = expiry.getTime() - now.getTime();
  if (diff <= 0) return "Expired";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h remaining`;
  const mins = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${mins}m remaining`;
}



function getNetworkColor(network: string) {
  switch (network.toLowerCase()) {
    case "safaricom": return "border-green-400/30 bg-green-400/5 text-green-400";
    case "airtel": return "border-red-400/30 bg-red-400/5 text-red-400";
    case "telkom": return "border-blue-400/30 bg-blue-400/5 text-blue-400";
    default: return "border-primary/30 bg-primary/5 text-primary";
  }
}

export default function MyPlansPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activeTab, setActiveTab] = useState("active");

  useEffect(() => {
    // Simulated loading
    const timer = setTimeout(() => {
      setPlans(MOCK_PLANS);
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const activePlans = plans.filter(p => p.status === "active");
  const expiringPlans = plans.filter(p => p.status === "expiring_soon");
  const expiredPlans = plans.filter(p => p.status === "expired");
  const totalPurchased = plans.length;

  const handleDownloadConfig = (planId: string) => {
    toast({ title: "Success", description: "Config downloaded successfully" });
  };

  const handleRenewPlan = (planId: string) => {
    toast({ title: "Success", description: "Redirecting to renewal..." });
  };

  const handleViewInstructions = (planId: string) => {
    toast({ title: "Info", description: "Opening setup instructions..." });
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-20 px-4 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 bg-background">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-heading font-bold mb-2">
            My <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Plans</span>
          </h1>
          <p className="text-muted-foreground">Manage and renew your active subscriptions</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="glass-card rounded-lg border border-card-border p-4 text-center">
            <CheckCircle2 className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{activePlans.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Active Plans</p>
          </div>
          <div className="glass-card rounded-lg border border-card-border p-4 text-center">
            <Clock className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{expiringPlans.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Expiring Soon</p>
          </div>
          <div className="glass-card rounded-lg border border-card-border p-4 text-center">
            <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{expiredPlans.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Expired</p>
          </div>
          <div className="glass-card rounded-lg border border-card-border p-4 text-center">
            <Zap className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{totalPurchased}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Plans</p>
          </div>
        </div>

        {/* Plans Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="active">Active ({activePlans.length})</TabsTrigger>
            <TabsTrigger value="expiring">Expiring ({expiringPlans.length})</TabsTrigger>
            <TabsTrigger value="expired">Expired ({expiredPlans.length})</TabsTrigger>
          </TabsList>

          {/* Active Plans Tab */}
          <TabsContent value="active" className="space-y-6">
            {activePlans.length === 0 ? (
              <motion.div 
                className="glass-card rounded-xl border border-card-border p-8 text-center backdrop-blur-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto opacity-40 mb-3" />
                <p className="text-muted-foreground">No active plans. Purchase a plan to get started.</p>
              </motion.div>
            ) : (
              <motion.div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                {activePlans.map((plan, index) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    className="group relative overflow-hidden rounded-2xl border border-primary/20 backdrop-blur-xl bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-6 hover:border-primary/40 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10"
                  >
                    {/* Animated background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-transparent to-primary/0 group-hover:from-cyan-500/10 group-hover:to-primary/10 transition-all duration-500 pointer-events-none" />
                    
                    <div className="relative z-10 space-y-6">
                      {/* Header with network logo and title */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="text-green-400"
                          >
                            <NetworkLogo network={plan.network} className="w-16 h-16" />
                          </motion.div>
                          <div>
                            <h3 className="text-xl font-bold text-white mb-1">{plan.planName}</h3>
                            <p className="text-sm text-muted-foreground">{plan.network} • {plan.duration}</p>
                          </div>
                        </div>
                        <ExpiryBadge expiryDate={plan.expiryDate} />
                      </div>

                      {/* Countdown Timer */}
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Time Remaining</p>
                        <div className="bg-secondary/20 rounded-xl p-4 border border-border/30">
                          <PlanCountdownTimer expiryDate={plan.expiryDate} />
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Subscription Progress</p>
                        <SubscriptionProgress expiryDate={plan.expiryDate} createdDate={plan.createdAt} />
                      </div>

                      {/* Plan Details Grid */}
                      <div className="grid grid-cols-2 gap-3 py-4 border-t border-border/30">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Speed</p>
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-cyan-400" />
                            <span className="text-sm font-medium">{plan.speed}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Type</p>
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-cyan-400" />
                            <span className="text-sm font-medium">{plan.appType}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Device</p>
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-cyan-400" />
                            <span className="text-sm font-medium text-muted-foreground">{plan.deviceId}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Purchased</p>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-cyan-400" />
                            <span className="text-sm font-medium">{new Date(plan.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-4 border-t border-border/30">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleDownloadConfig(plan.id)}
                          className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-medium text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
                        >
                          <Download className="w-4 h-4" />
                          Download Config
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleViewInstructions(plan.id)}
                          className="px-4 py-2.5 rounded-lg border border-primary/30 text-primary font-medium text-sm flex items-center justify-center gap-2 hover:bg-primary/10 transition-all duration-300"
                        >
                          <Eye className="w-4 h-4" />
                          Setup
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </TabsContent>

          {/* Expiring Soon Tab */}
          <TabsContent value="expiring" className="space-y-6">
            {expiringPlans.length === 0 ? (
              <motion.div 
                className="glass-card rounded-xl border border-card-border p-8 text-center backdrop-blur-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <CheckCircle2 className="w-12 h-12 text-yellow-400 mx-auto opacity-40 mb-3" />
                <p className="text-muted-foreground">No plans expiring soon.</p>
              </motion.div>
            ) : (
              <motion.div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                {expiringPlans.map((plan, index) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    className="group relative overflow-hidden rounded-2xl border border-yellow-400/30 backdrop-blur-xl bg-gradient-to-br from-yellow-400/5 via-background to-orange-500/5 p-6 hover:border-yellow-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-yellow-400/10"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/0 via-transparent to-orange-500/0 group-hover:from-yellow-500/10 group-hover:to-orange-500/10 transition-all duration-500 pointer-events-none" />
                    
                    <div className="relative z-10 space-y-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="text-yellow-400"
                          >
                            <NetworkLogo network={plan.network} className="w-16 h-16" />
                          </motion.div>
                          <div>
                            <h3 className="text-xl font-bold text-white mb-1">{plan.planName}</h3>
                            <p className="text-sm text-muted-foreground">{plan.network} • {plan.duration}</p>
                          </div>
                        </div>
                        <ExpiryBadge expiryDate={plan.expiryDate} />
                      </div>

                      <div className="space-y-2 bg-yellow-400/10 rounded-xl p-4 border border-yellow-400/20">
                        <p className="text-xs text-yellow-400 uppercase tracking-wider font-semibold">Expiring Soon - Renew Now</p>
                        <div className="bg-secondary/20 rounded-lg p-3 border border-border/30">
                          <PlanCountdownTimer expiryDate={plan.expiryDate} />
                        </div>
                      </div>

                      <SubscriptionProgress expiryDate={plan.expiryDate} createdDate={plan.createdAt} />

                      <div className="grid grid-cols-2 gap-3 py-4 border-t border-border/30">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Speed</p>
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm font-medium">{plan.speed}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Type</p>
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm font-medium">{plan.appType}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Device</p>
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm font-medium text-muted-foreground">{plan.deviceId}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Purchased</p>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm font-medium">{new Date(plan.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4 border-t border-border/30">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleRenewPlan(plan.id)}
                          className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-400 text-background font-medium text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-yellow-400/30 transition-all duration-300"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Renew Plan
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleDownloadConfig(plan.id)}
                          className="px-4 py-2.5 rounded-lg border border-yellow-400/30 text-yellow-400 font-medium text-sm flex items-center justify-center gap-2 hover:bg-yellow-400/10 transition-all duration-300"
                        >
                          <Download className="w-4 h-4" />
                          Config
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </TabsContent>

          {/* Expired Tab */}
          <TabsContent value="expired" className="space-y-6">
            {expiredPlans.length === 0 ? (
              <motion.div 
                className="glass-card rounded-xl border border-card-border p-8 text-center backdrop-blur-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto opacity-40 mb-3" />
                <p className="text-muted-foreground">No expired plans.</p>
              </motion.div>
            ) : (
              <motion.div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                {expiredPlans.map((plan, index) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    className="group relative overflow-hidden rounded-2xl border border-red-400/30 backdrop-blur-xl bg-gradient-to-br from-red-400/5 via-background to-rose-500/5 p-6 opacity-80 hover:opacity-100 hover:border-red-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-red-400/10"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 via-transparent to-rose-500/0 group-hover:from-red-500/10 group-hover:to-rose-500/10 transition-all duration-500 pointer-events-none" />
                    
                    <div className="relative z-10 space-y-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="text-red-400"
                          >
                            <NetworkLogo network={plan.network} className="w-16 h-16" />
                          </motion.div>
                          <div>
                            <h3 className="text-xl font-bold text-white mb-1 line-through opacity-70">{plan.planName}</h3>
                            <p className="text-sm text-muted-foreground">{plan.network} • {plan.duration}</p>
                          </div>
                        </div>
                        <ExpiryBadge expiryDate={plan.expiryDate} />
                      </div>

                      <div className="space-y-2 bg-red-400/10 rounded-xl p-4 border border-red-400/20">
                        <p className="text-xs text-red-400 uppercase tracking-wider font-semibold">This Plan Has Expired</p>
                        <p className="text-sm text-muted-foreground">Expired on {new Date(plan.expiryDate).toLocaleDateString()}</p>
                      </div>

                      <SubscriptionProgress expiryDate={plan.expiryDate} createdDate={plan.createdAt} />

                      <div className="grid grid-cols-2 gap-3 py-4 border-t border-border/30 opacity-60">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Speed</p>
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-red-400" />
                            <span className="text-sm font-medium">{plan.speed}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Type</p>
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-red-400" />
                            <span className="text-sm font-medium">{plan.appType}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Device</p>
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-red-400" />
                            <span className="text-sm font-medium text-muted-foreground">{plan.deviceId}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Purchased</p>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-red-400" />
                            <span className="text-sm font-medium">{new Date(plan.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4 border-t border-border/30">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleRenewPlan(plan.id)}
                          className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-red-400 to-rose-400 text-background font-medium text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-red-400/30 transition-all duration-300"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Renew Now
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
