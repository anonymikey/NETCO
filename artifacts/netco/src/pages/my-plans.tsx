import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

function getStatusBadge(status: string, expiryDate: string) {
  if (status === "expired") {
    return <Badge className="bg-red-500/20 text-red-400 gap-1"><AlertCircle className="w-3 h-3" /> Expired</Badge>;
  }
  if (status === "expiring_soon") {
    return <Badge className="bg-yellow-500/20 text-yellow-400 gap-1"><Clock className="w-3 h-3" /> Expiring Soon</Badge>;
  }
  return <Badge className="bg-green-500/20 text-green-400 gap-1"><CheckCircle2 className="w-3 h-3" /> Active</Badge>;
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
          <TabsContent value="active" className="space-y-4">
            {activePlans.length === 0 ? (
              <div className="glass-card rounded-lg border border-card-border p-8 text-center">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto opacity-40 mb-3" />
                <p className="text-muted-foreground">No active plans. Purchase a plan to get started.</p>
              </div>
            ) : (
              activePlans.map((plan) => (
                <div key={plan.id} className="glass-card rounded-lg border border-card-border p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Network</p>
                      <Badge className={`${getNetworkColor(plan.network)}`}>{plan.network}</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Plan</p>
                      <p className="font-medium">{plan.planName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Expires In</p>
                      <p className="font-medium text-cyan-400">{formatTimeLeft(plan.expiryDate)}</p>
                    </div>
                    <div className="flex justify-end md:justify-start">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Status</p>
                        {getStatusBadge(plan.status, plan.expiryDate)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-4 border-y border-border/30">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{plan.appType}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{plan.speed}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{plan.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{plan.deviceId}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 flex-wrap">
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={() => handleDownloadConfig(plan.id)}
                    >
                      <Download className="w-4 h-4" />
                      Download Config
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => handleViewInstructions(plan.id)}
                    >
                      <Eye className="w-4 h-4" />
                      Instructions
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* Expiring Soon Tab */}
          <TabsContent value="expiring" className="space-y-4">
            {expiringPlans.length === 0 ? (
              <div className="glass-card rounded-lg border border-card-border p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto opacity-40 mb-3" />
                <p className="text-muted-foreground">No plans expiring soon.</p>
              </div>
            ) : (
              expiringPlans.map((plan) => (
                <div key={plan.id} className="glass-card rounded-lg border border-yellow-400/20 bg-yellow-400/5 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Network</p>
                      <Badge className={`${getNetworkColor(plan.network)}`}>{plan.network}</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Plan</p>
                      <p className="font-medium">{plan.planName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Expires In</p>
                      <p className="font-medium text-yellow-400">{formatTimeLeft(plan.expiryDate)}</p>
                    </div>
                    <div className="flex justify-end md:justify-start">
                      {getStatusBadge(plan.status, plan.expiryDate)}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 flex-wrap">
                    <Button
                      size="sm"
                      className="gap-2 bg-primary hover:bg-primary/90"
                      onClick={() => handleRenewPlan(plan.id)}
                    >
                      <RotateCcw className="w-4 h-4" />
                      Renew Plan
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => handleDownloadConfig(plan.id)}
                    >
                      <Download className="w-4 h-4" />
                      Download Config
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* Expired Tab */}
          <TabsContent value="expired" className="space-y-4">
            {expiredPlans.length === 0 ? (
              <div className="glass-card rounded-lg border border-card-border p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto opacity-40 mb-3" />
                <p className="text-muted-foreground">No expired plans.</p>
              </div>
            ) : (
              expiredPlans.map((plan) => (
                <div key={plan.id} className="glass-card rounded-lg border border-red-400/20 bg-red-400/5 p-6 opacity-75">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Network</p>
                      <Badge className={`${getNetworkColor(plan.network)}`}>{plan.network}</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Plan</p>
                      <p className="font-medium">{plan.planName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Expired</p>
                      <p className="font-medium text-red-400">{formatTimeLeft(plan.expiryDate)}</p>
                    </div>
                    <div className="flex justify-end md:justify-start">
                      {getStatusBadge(plan.status, plan.expiryDate)}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 flex-wrap">
                    <Button
                      size="sm"
                      className="gap-2 bg-primary hover:bg-primary/90"
                      onClick={() => handleRenewPlan(plan.id)}
                    >
                      <RotateCcw className="w-4 h-4" />
                      Renew Plan
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
