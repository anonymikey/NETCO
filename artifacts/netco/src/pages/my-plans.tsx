import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useListPlans, getListPlansQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Download, Eye, RefreshCw, AlertCircle, CheckCircle, Clock, ShoppingCart, Loader2 } from "lucide-react";

function formatTimeLeft(expiryDate: string) {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diff = expiry.getTime() - now.getTime();
  if (diff <= 0) return "Expired";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${mins}m`;
}

function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case "active":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "expiring":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "expired":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
}

function getNetworkColor(network: string) {
  switch (network?.toLowerCase()) {
    case "safaricom":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "airtel":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "telkom":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    default:
      return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
  }
}

export default function MyPlansPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"active" | "expired">("active");

  const { data: plans = [], isLoading } = useListPlans(
    user ? { phone: user.phone || "" } : {},
    { query: { enabled: !!user, queryKey: getListPlansQueryKey(user ? { phone: user.phone || "" } : {}), refetchInterval: 30000 } }
  );

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const activePlans = plans.filter((p) => p.status === "active");
  const expiringPlans = plans.filter((p) => p.status === "expiring");
  const expiredPlans = plans.filter((p) => p.status === "expired");

  const handleDownloadConfig = (plan: any) => {
    toast({
      title: "Success",
      description: `Configuration for ${plan.network} plan downloaded`,
    });
  };

  const handleViewInstructions = (plan: any) => {
    toast({
      title: "Instructions",
      description: `Opening setup instructions for ${plan.plan_name}`,
    });
  };

  const handleRenewPlan = (plan: any) => {
    navigate(`/checkout?plan=${plan.id}`);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-20 px-4 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 bg-background">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-heading font-bold mb-2">
            My <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Plans</span>
          </h1>
          <p className="text-muted-foreground">Manage your active VPN plans and subscriptions</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card rounded-lg border border-card-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Plans</p>
                <p className="text-3xl font-bold">{activePlans.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400 opacity-20" />
            </div>
          </div>

          <div className="glass-card rounded-lg border border-card-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
                <p className="text-3xl font-bold">{expiringPlans.length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-400 opacity-20" />
            </div>
          </div>

          <div className="glass-card rounded-lg border border-card-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expired Plans</p>
                <p className="text-3xl font-bold">{expiredPlans.length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-400 opacity-20" />
            </div>
          </div>

          <div className="glass-card rounded-lg border border-card-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Purchased</p>
                <p className="text-3xl font-bold">{plans.length}</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-cyan-400 opacity-20" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab("active")}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === "active"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Active Plans ({activePlans.length + expiringPlans.length})
          </button>
          <button
            onClick={() => setActiveTab("expired")}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === "expired"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Expired Plans ({expiredPlans.length})
          </button>
        </div>

        {/* Plans Grid */}
        <div className="space-y-4">
          {activeTab === "active" ? (
            <>
              {activePlans.length === 0 && expiringPlans.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto opacity-40 mb-4" />
                  <p className="text-muted-foreground font-medium">No active plans found</p>
                  <p className="text-sm text-muted-foreground mt-1">Purchase a plan to get started</p>
                </div>
              ) : (
                <>
                  {/* Expiring Plans Section */}
                  {expiringPlans.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-bold text-sm text-yellow-400 uppercase tracking-wider">Expiring Soon</h3>
                      {expiringPlans.map((plan) => (
                        <div key={plan.id} className="glass-card rounded-lg border border-yellow-500/30 p-4 sm:p-6 hover:border-yellow-500/50 transition-colors">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wider">Network</p>
                              <Badge className={`mt-2 ${getNetworkColor(plan.network)}`}>
                                {plan.network}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wider">Plan</p>
                              <p className="font-bold mt-1">{plan.plan_name}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wider">Duration</p>
                              <p className="font-bold mt-1">{plan.duration} days</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wider">Expires in</p>
                              <p className="font-bold text-yellow-400 mt-1">{formatTimeLeft(plan.expiry_date)}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-4 border-t border-border/30">
                            <Button onClick={() => handleDownloadConfig(plan)} variant="outline" size="sm" className="gap-2">
                              <Download className="w-4 h-4" />
                              Download Config
                            </Button>
                            <Button onClick={() => handleViewInstructions(plan)} variant="outline" size="sm" className="gap-2">
                              <Eye className="w-4 h-4" />
                              Instructions
                            </Button>
                            <Button onClick={() => handleRenewPlan(plan)} className="ml-auto bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 gap-2">
                              <RefreshCw className="w-4 h-4" />
                              Renew Plan
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Active Plans Section */}
                  {activePlans.length > 0 && (
                    <div className="space-y-3">
                      {expiringPlans.length > 0 && <h3 className="font-bold text-sm text-green-400 uppercase tracking-wider mt-6">Active Plans</h3>}
                      {activePlans.map((plan) => (
                        <div key={plan.id} className="glass-card rounded-lg border border-green-500/30 p-4 sm:p-6 hover:border-green-500/50 transition-colors">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wider">Network</p>
                              <Badge className={`mt-2 ${getNetworkColor(plan.network)}`}>
                                {plan.network}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wider">Plan</p>
                              <p className="font-bold mt-1">{plan.plan_name}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wider">Duration</p>
                              <p className="font-bold mt-1">{plan.duration} days</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wider">Expires in</p>
                              <p className="font-bold text-green-400 mt-1">{formatTimeLeft(plan.expiry_date)}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-4 border-t border-border/30">
                            <Button onClick={() => handleDownloadConfig(plan)} variant="outline" size="sm" className="gap-2">
                              <Download className="w-4 h-4" />
                              Download Config
                            </Button>
                            <Button onClick={() => handleViewInstructions(plan)} variant="outline" size="sm" className="gap-2">
                              <Eye className="w-4 h-4" />
                              Instructions
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              {expiredPlans.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto opacity-40 mb-4" />
                  <p className="text-muted-foreground font-medium">No expired plans</p>
                  <p className="text-sm text-muted-foreground mt-1">Your plans are all up to date</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expiredPlans.map((plan) => (
                    <div key={plan.id} className="glass-card rounded-lg border border-red-500/30 p-4 sm:p-6 hover:border-red-500/50 transition-colors opacity-70">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Network</p>
                          <Badge className={`mt-2 ${getNetworkColor(plan.network)}`}>
                            {plan.network}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Plan</p>
                          <p className="font-bold mt-1">{plan.plan_name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Duration</p>
                          <p className="font-bold mt-1">{plan.duration} days</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p>
                          <Badge className={`mt-2 ${getStatusColor("expired")}`}>
                            Expired
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-4 border-t border-border/30">
                        <Button onClick={() => handleRenewPlan(plan)} className="ml-auto bg-primary hover:bg-primary/90 gap-2">
                          <RefreshCw className="w-4 h-4" />
                          Renew Now
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
