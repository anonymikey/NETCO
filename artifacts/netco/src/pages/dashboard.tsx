import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useListPlans, getListPlansQueryKey } from "@workspace/api-client-react";
import { Search, Download, Clock, CheckCircle, XCircle, Smartphone, Wifi, RefreshCw, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { initServerStatusUpdates, subscribeToServerStatus, stopServerStatusUpdates } from "@/lib/server-status-realtime";

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

export default function Dashboard() {
  const { toast } = useToast();
  const [phone, setPhone] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [searchParams, setSearchParams] = useState<{ phone?: string; deviceId?: string } | null>(null);
  const [serverStatus, setServerStatus] = useState<Record<string, any>>({});

  // Initialize real-time server status updates
  useEffect(() => {
    initServerStatusUpdates();
    const unsubscribe = subscribeToServerStatus(setServerStatus);

    return () => {
      unsubscribe();
      stopServerStatusUpdates();
    };
  }, []);

  const { data: plans, isLoading } = useListPlans(
    searchParams ?? {},
    { query: { enabled: !!searchParams, queryKey: getListPlansQueryKey(searchParams ?? {}) } }
  );

  const handleSearch = () => {
    if (!phone.trim() && !deviceId.trim()) {
      toast({ title: "Enter phone or device ID", description: "Provide at least one search term.", variant: "destructive" });
      return;
    }
    const params: { phone?: string; deviceId?: string } = {};
    if (phone.trim()) params.phone = phone.trim();
    if (deviceId.trim()) params.deviceId = deviceId.trim();
    setSearchParams(params);
  };

  const activePlans = plans?.filter((p) => p.status === "active") ?? [];
  const expiredPlans = plans?.filter((p) => p.status === "expired") ?? [];

  const getNetworkColor = (network: string) => {
    switch (network.toLowerCase()) {
      case "safaricom": return "text-green-400";
      case "airtel": return "text-red-400";
      case "telkom": return "text-blue-400";
      default: return "text-primary";
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-heading font-bold mb-2">
            My <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Dashboard</span>
          </h1>
          <p className="text-muted-foreground">Look up your active VPN configs and plan details</p>
        </div>

        <div className="glass-card rounded-xl p-6 space-y-4" data-testid="search-panel">
          <h2 className="font-heading font-bold text-lg">Find Your Plans</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search-phone">M-Pesa Phone Number</Label>
              <Input id="search-phone" type="tel" placeholder="e.g. 0712345678" value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-card border-border focus:border-primary h-11" data-testid="input-search-phone" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="search-device">Device ID / HWID</Label>
              <Input id="search-device" placeholder="Paste your Device ID or HWID" value={deviceId} onChange={(e) => setDeviceId(e.target.value)} className="bg-card border-border focus:border-primary h-11 font-mono text-sm" data-testid="input-search-device" />
            </div>
          </div>
          <Button onClick={handleSearch} className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary-hover h-11" data-testid="button-search">
            <Search className="w-4 h-4 mr-2" /> Search Plans
          </Button>
        </div>

        {isLoading && (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="glass-card rounded-xl p-6 animate-pulse space-y-3">
                <div className="h-5 bg-muted/30 rounded w-1/3" />
                <div className="h-4 bg-muted/20 rounded w-1/2" />
                <div className="h-10 bg-muted/20 rounded" />
              </div>
            ))}
          </div>
        )}

        {searchParams && !isLoading && plans?.length === 0 && (
          <div className="glass-card rounded-xl p-12 text-center space-y-4">
            <Search className="w-12 h-12 text-muted-foreground mx-auto" />
            <h3 className="font-heading font-bold text-xl">No Plans Found</h3>
            <p className="text-muted-foreground">No configs were found for this phone number or Device ID.</p>
            <Link href="/pricing"><Button className="bg-primary text-primary-foreground">Browse Plans</Button></Link>
          </div>
        )}

        {activePlans.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              <h2 className="font-heading font-bold text-xl">Active Plans ({activePlans.length})</h2>
            </div>
            {activePlans.map((plan) => (
              <div key={plan.id} className="glass-card rounded-xl p-6 space-y-4 border-success/20" style={{ boxShadow: "0 0 15px 0px rgba(0,230,118,0.15)" }} data-testid={`card-plan-${plan.id}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-heading font-bold text-lg ${getNetworkColor(plan.network)}`}>{plan.network}</span>
                      <Badge className="bg-success/20 text-success border-success/30 text-xs">Active</Badge>
                    </div>
                    <p className="font-medium">{plan.planName}</p>
                    <p className="text-sm text-muted-foreground capitalize">{plan.appType.replace("_", " ")} · {plan.duration} plan</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-success text-sm font-medium">
                      <Clock className="w-4 h-4" />
                      {formatTimeLeft(plan.expiryDate)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Expires: {new Date(plan.expiryDate).toLocaleDateString("en-KE")}</p>
                  </div>
                </div>
                {plan.speed && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Wifi className="w-4 h-4 text-primary" />{plan.speed}</div>}
                <div className="flex items-center gap-2 text-xs font-mono bg-muted/10 rounded-md px-3 py-2 border border-border">
                  <Smartphone className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground truncate">{plan.deviceId}</span>
                </div>
                {plan.configUrl && (
                  <div className="space-y-2">
                    <a href={plan.configUrl} download data-testid={`button-download-${plan.id}`}>
                      <Button size="sm" className="bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 w-full">
                        <Download className="w-4 h-4 mr-2" /> Download Config ({plan.fileExtension})
                      </Button>
                    </a>
                    {/* Server availability status */}
                    {plan.serverId && serverStatus[plan.serverId] && (
                      <div className={`flex items-center gap-2 text-xs p-2 rounded-md ${serverStatus[plan.serverId].isFree ? "bg-success/10 text-success border border-success/20" : "bg-warning/10 text-warning border border-warning/20"}`}>
                        <span className={`w-2 h-2 rounded-full ${serverStatus[plan.serverId].isFree ? "bg-success" : "bg-warning"}`} />
                        {serverStatus[plan.serverId].isFree ? "Free server available" : "Premium server (limited slots)"}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {expiredPlans.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-heading font-bold text-xl text-muted-foreground">Expired Plans ({expiredPlans.length})</h2>
            </div>
            {expiredPlans.map((plan) => (
              <div key={plan.id} className="glass-card rounded-xl p-6 opacity-60 space-y-3" data-testid={`card-expired-${plan.id}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-heading font-bold">{plan.network}</span>
                      <Badge variant="outline" className="text-xs text-muted-foreground">Expired</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{plan.planName} · {plan.duration}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Expired {new Date(plan.expiryDate).toLocaleDateString("en-KE")}</p>
                </div>
                <Link href="/pricing">
                  <Button size="sm" variant="outline" className="border-border hover:border-primary/50 text-xs">
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Renew Plan
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}

        {!searchParams && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Search, label: "Check Expiry", href: "/check-expiry", color: "text-primary", bg: "bg-primary/5 border-primary/20" },
              { icon: Smartphone, label: "How to Connect", href: "/how-to-connect", color: "text-secondary", bg: "bg-secondary/5 border-secondary/20" },
              { icon: Wifi, label: "Server Status", href: "/server-status", color: "text-success", bg: "bg-success/5 border-success/20" },
            ].map(({ icon: Icon, label, href, color, bg }) => (
              <Link key={href} href={href}>
                <div className={`glass-card rounded-xl p-5 flex items-center gap-4 cursor-pointer hover:border-primary/50 transition-all ${bg}`} data-testid={`link-quick-${label.toLowerCase().replace(/\s+/g, "-")}`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                  <span className="font-medium">{label}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
