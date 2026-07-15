import { useState, useEffect, useNavigate } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useUserPlans, PlanWithStatus } from "@/hooks/useUserPlans";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { PlanCountdownTimer } from "@/components/plan-countdown-timer";
import { SubscriptionProgress } from "@/components/subscription-progress";
import { NetworkLogo } from "@/components/network-logo";
import { ExpiryBadge } from "@/components/expiry-badge";
import { DeleteConfigModal } from "@/components/delete-config-modal";
import {
  Download, Eye, RotateCcw, Loader2, AlertCircle, CheckCircle2,
  Clock, Zap, Smartphone, Globe, Calendar, Trash2, AlertTriangle
} from "lucide-react";

function getColorStateClasses(colorState: string) {
  switch (colorState) {
    case "green":
      return "border-green-400/30 bg-green-400/5 from-green-400/5 to-secondary/5 hover:border-green-400/50 hover:shadow-green-400/10";
    case "yellow":
      return "border-yellow-400/30 bg-yellow-400/5 from-yellow-400/5 to-orange-500/5 hover:border-yellow-400/50 hover:shadow-yellow-400/10";
    case "orange":
      return "border-orange-400/30 bg-orange-400/5 from-orange-400/5 to-red-500/5 hover:border-orange-400/50 hover:shadow-orange-400/10";
    case "red":
      return "border-red-400/30 bg-red-400/5 from-red-400/5 to-red-600/5 hover:border-red-400/50 hover:shadow-red-400/10";
    case "grey":
      return "border-gray-400/30 bg-gray-400/5 from-gray-400/5 to-gray-500/5 hover:border-gray-400/50 hover:shadow-gray-400/10";
    default:
      return "border-primary/20 bg-primary/5 from-primary/5 to-secondary/5 hover:border-primary/40 hover:shadow-primary/10";
  }
}

function getColorStateTimerColor(colorState: string) {
  switch (colorState) {
    case "green":
      return "bg-green-400/20 border-green-400/30";
    case "yellow":
      return "bg-yellow-400/20 border-yellow-400/30";
    case "orange":
      return "bg-orange-400/20 border-orange-400/30";
    case "red":
      return "bg-red-400/20 border-red-400/30";
    case "grey":
      return "bg-gray-400/20 border-gray-400/30";
    default:
      return "bg-secondary/20 border-border/30";
  }
}

function getColorStateIconColor(colorState: string) {
  switch (colorState) {
    case "green":
      return "text-green-400";
    case "yellow":
      return "text-yellow-400";
    case "orange":
      return "text-orange-400";
    case "red":
      return "text-red-400";
    case "grey":
      return "text-gray-400";
    default:
      return "text-cyan-400";
  }
}

function formatTimeRemaining(ms: number) {
  if (ms <= 0) return "Expired";
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function getWarningMessage(colorState: string, daysUntilDelete?: number): string | null {
  switch (colorState) {
    case "yellow":
      return "Plan expiring soon - consider renewing";
    case "orange":
      return "Plan expiring in less than 24 hours";
    case "red":
      return "Plan expiring very soon - renew immediately";
    case "grey":
      return daysUntilDelete ? `Plan will auto-delete in ${daysUntilDelete} day${daysUntilDelete === 1 ? "" : "s"}` : "Plan has expired";
    default:
      return null;
  }
}

export default function MyPlansPage() {
  const { user, loading: authLoading, sessionExpired } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("active");
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; planId?: string; planName?: string }>({
    isOpen: false,
  });

  const { plans, stats, loading, error, deletePlan } = useUserPlans(user?.id);

  // Show notification when session expires
  useEffect(() => {
    if (sessionExpired) {
      toast({
        title: "Session Expired",
        description: "Your session has expired. Please log in again.",
        variant: "destructive",
      });
    }
  }, [sessionExpired, toast]);

  // Auth guard - redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      // Redirect to login
      window.location.href = "/login";
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen pt-24 pb-20 px-4 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading plans...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-24 pb-20 px-4 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="w-12 h-12 text-red-400" />
          <p className="text-red-400 font-medium">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  // Filter plans by status
  const activePlans = plans.filter(p => p.timeRemaining > 0 && p.status === "active");
  const expiringPlans = plans.filter(p => p.timeRemaining > 0 && p.timeRemaining <= 3 * 24 * 60 * 60 * 1000 && p.status === "active");
  const expiredPlans = plans.filter(p => p.timeRemaining <= 0);

  const handleDownloadConfig = async (planId: string) => {
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast({ title: "Error", description: "Please log in to download config", variant: "destructive" });
        return;
      }

      const response = await fetch(`/api/plans/${planId}/config`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to get config");
      }

      const configData = await response.json();

      if (configData.configUrl) {
        // Open config URL in new tab for download
        window.open(configData.configUrl, "_blank");
        toast({ title: "Success", description: "Config file opening in new tab" });
      } else {
        toast({ title: "Info", description: "Config will be available soon. Please check back later.", variant: "default" });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to download config";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleRenewPlan = async (planId: string) => {
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast({ title: "Error", description: "Please log in to renew plan", variant: "destructive" });
        return;
      }

      const response = await fetch(`/api/plans/${planId}/renew`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to initiate renewal");
      }

      const renewalData = await response.json();
      
      toast({ 
        title: "Renewal Ready", 
        description: `Ready to renew ${renewalData.planName}. Checkout page will open when integrated.` 
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to renew plan";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleViewInstructions = async (planId: string) => {
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast({ title: "Error", description: "Please log in to view instructions", variant: "destructive" });
        return;
      }

      const response = await fetch(`/api/plans/${planId}/config`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to get instructions");
      }

      const configData = await response.json();

      if (configData.instructions) {
        // Show instructions in a modal or new tab/window
        // For now, show as alert - could be enhanced with a modal component
        toast({ 
          title: `Setup Instructions for ${configData.network}`, 
          description: configData.instructions,
        });
      } else {
        toast({ title: "Info", description: "Setup instructions not available yet. Please check back later." });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to get instructions";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleOpenDeleteModal = (plan: PlanWithStatus) => {
    if (plan.isDeletable) {
      setDeleteModal({
        isOpen: true,
        planId: plan.id,
        planName: plan.planName,
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.planId) return;

    try {
      const success = await deletePlan(deleteModal.planId);
      if (success) {
        setDeleteModal({ isOpen: false });
        toast({
          title: "Success",
          description: "Plan deleted successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete plan",
          variant: "destructive",
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete plan";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const PlanCard = ({ plan, index }: { plan: PlanWithStatus; index: number }) => {
    const warningMessage = getWarningMessage(plan.colorState, plan.daysUntilAutoDelete);
    const colorStateClasses = getColorStateClasses(plan.colorState);
    const timerColorClasses = getColorStateTimerColor(plan.colorState);
    const iconColor = getColorStateIconColor(plan.colorState);

    return (
      <motion.div
        key={plan.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.4 }}
        className={`group relative overflow-hidden rounded-2xl border backdrop-blur-xl bg-gradient-to-br p-6 hover:transition-all duration-300 hover:shadow-xl ${colorStateClasses}`}
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-transparent group-hover:from-cyan-500/10 group-hover:to-primary/10 transition-all duration-500 pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Warning Banner */}
          {warningMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                plan.colorState === "grey"
                  ? "bg-gray-400/10 border-gray-400/30"
                  : plan.colorState === "red"
                  ? "bg-red-400/10 border-red-400/30"
                  : plan.colorState === "orange"
                  ? "bg-orange-400/10 border-orange-400/30"
                  : "bg-yellow-400/10 border-yellow-400/30"
              }`}
            >
              {plan.colorState === "grey" ? (
                <AlertTriangle className="w-4 h-4 text-gray-400 flex-shrink-0" />
              ) : (
                <AlertTriangle className={`w-4 h-4 ${iconColor} flex-shrink-0`} />
              )}
              <p className={`text-xs font-semibold ${plan.colorState === "grey" ? "text-gray-300" : ""}`}>
                {warningMessage}
              </p>
            </motion.div>
          )}

          {/* Header with network logo and title */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <motion.div whileHover={{ scale: 1.05 }} className={iconColor}>
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
            <div className={`rounded-xl p-4 border ${timerColorClasses}`}>
              <div className="grid grid-cols-4 gap-3 text-center">
                {[
                  { value: Math.floor(plan.timeRemaining / (1000 * 60 * 60 * 24)), label: "Days" },
                  { value: Math.floor((plan.timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)), label: "Hours" },
                  { value: Math.floor((plan.timeRemaining % (1000 * 60 * 60)) / (1000 * 60)), label: "Minutes" },
                  { value: Math.floor((plan.timeRemaining % (1000 * 60)) / 1000), label: "Seconds" },
                ].map((time, idx) => (
                  <div key={idx}>
                    <p className={`text-lg font-bold ${
                      plan.colorState === "green" ? "text-green-400" :
                      plan.colorState === "yellow" ? "text-yellow-400" :
                      plan.colorState === "orange" ? "text-orange-400" :
                      plan.colorState === "red" ? "text-red-400" :
                      "text-gray-400"
                    }`}>
                      {String(time.value).padStart(2, "0")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{time.label}</p>
                  </div>
                ))}
              </div>
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
                <Zap className={`w-4 h-4 ${iconColor}`} />
                <span className="text-sm font-medium">{plan.speed}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Type</p>
              <div className="flex items-center gap-2">
                <Smartphone className={`w-4 h-4 ${iconColor}`} />
                <span className="text-sm font-medium">{plan.appType}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Device</p>
              <div className="flex items-center gap-2">
                <Globe className={`w-4 h-4 ${iconColor}`} />
                <span className="text-sm font-medium text-muted-foreground">{plan.deviceId}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Purchased</p>
              <div className="flex items-center gap-2">
                <Calendar className={`w-4 h-4 ${iconColor}`} />
                <span className="text-sm font-medium">{new Date(plan.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t border-border/30 flex-wrap">
            {plan.timeRemaining <= 0 ? (
              // Show delete and renew buttons for expired plans
              <>
                {plan.isDeletable && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleOpenDeleteModal(plan)}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-red-500/20 border border-red-400/30 text-red-400 font-medium text-sm flex items-center justify-center gap-2 hover:bg-red-500/30 transition-all duration-300"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleRenewPlan(plan.id)}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-medium text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
                >
                  <RotateCcw className="w-4 h-4" />
                  Renew
                </motion.button>
              </>
            ) : (
              // Show standard buttons for active plans
              <>
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
              </>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

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
            <p className="text-2xl font-bold">{stats.activePlans}</p>
            <p className="text-xs text-muted-foreground mt-1">Active Plans</p>
          </div>
          <div className="glass-card rounded-lg border border-card-border p-4 text-center">
            <Clock className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.expiringPlans}</p>
            <p className="text-xs text-muted-foreground mt-1">Expiring Soon</p>
          </div>
          <div className="glass-card rounded-lg border border-card-border p-4 text-center">
            <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.expiredPlans}</p>
            <p className="text-xs text-muted-foreground mt-1">Expired</p>
          </div>
          <div className="glass-card rounded-lg border border-card-border p-4 text-center">
            <Zap className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.totalPurchased}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Plans</p>
          </div>
        </div>

        {/* Plans Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="active">Active ({stats.activePlans})</TabsTrigger>
            <TabsTrigger value="expiring">Expiring ({stats.expiringPlans})</TabsTrigger>
            <TabsTrigger value="expired">Expired ({stats.expiredPlans})</TabsTrigger>
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
                  <PlanCard key={plan.id} plan={plan} index={index} />
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
                  <PlanCard key={plan.id} plan={plan} index={index} />
                ))}
              </motion.div>
            )}
          </TabsContent>

          {/* Expired Plans Tab */}
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
                  <PlanCard key={plan.id} plan={plan} index={index} />
                ))}
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Modal */}
      <DeleteConfigModal
        isOpen={deleteModal.isOpen}
        configName={deleteModal.planName}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false })}
      />
    </div>
  );
}
