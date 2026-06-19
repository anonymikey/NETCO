import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useListPlans, getListPlansQueryKey, useListConfigServers } from "@workspace/api-client-react";
import { Search, Download, Clock, CheckCircle, XCircle, Smartphone, Wifi, RefreshCw, AlertCircle, Gift, Server, ArrowRight, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { initServerStatusUpdates, subscribeToServerStatus, stopServerStatusUpdates } from "@/lib/server-status-realtime";
import { FreeConfigDownloadModal } from "@/components/free-config-download-modal";
import { AppShowcase } from "@/components/app-showcase";

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
  const [, navigate] = useLocation();
  const [phone, setPhone] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [searchParams, setSearchParams] = useState<{ phone?: string; deviceId?: string } | null>(null);
  const [serverStatus, setServerStatus] = useState<Record<string, any>>({});
  const [selectedFreeConfig, setSelectedFreeConfig] = useState<any>(null);

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

  const { data: availableServers = [] } = useListConfigServers();

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

  const networkColor = (network: string) => {
    switch (network.toLowerCase()) {
      case "safaricom": return "border-green-400/30 bg-green-400/5 text-green-400";
      case "airtel": return "border-red-400/30 bg-red-400/5 text-red-400";
      case "telkom": return "border-blue-400/30 bg-blue-400/5 text-blue-400";
      default: return "border-primary/30 bg-primary/5 text-primary";
    }
  };

  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  const activeServers = availableServers.filter((s: any) => s.status === "active") ?? [];

  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-heading font-bold mb-2">
            My <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Dashboard</span>
          </h1>
          <p className="text-muted-foreground">Look up your active VPN configs and plan details</p>
        </div>

        {/* App Showcase - Compact */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96">
            <AppShowcase
              app="http-custom"
              title="HTTP Custom"
              description="Configure your VPN with advanced options"
              playStoreUrl="https://play.google.com/store/apps/details?id=xyz.easypro.httpcustom&pcampaignid=web_share"
            />
          </div>
          <div className="h-96">
            <AppShowcase
              app="http-injector"
              title="HTTP Injector"
              description="Powerful tunneling and diagnostic tools"
              playStoreUrl="https://play.google.com/store/apps/details?id=com.evozi.injector&pcampaignid=web_share"
            />
          </div>
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

        {/* Available Configs Section */}
        {activeServers.length > 0 && (
          <div className="space-y-6 pt-8 border-t border-border">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-primary" />
                <h2 className="font-heading font-bold text-2xl">Available Configurations</h2>
              </div>
              <p className="text-muted-foreground">Browse and purchase new configs from our collection of free and premium options.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeServers.map((server: any) => (
                <div
                  key={server.id}
                  className={`group glass-card rounded-xl p-5 border transition-all hover:shadow-lg relative overflow-hidden ${
                    server.isFree 
                      ? "border-yellow-400/30 bg-yellow-400/5 hover:border-yellow-400/50 hover:shadow-yellow-400/20" 
                      : "border-border hover:border-primary/50 hover:shadow-primary/20"
                  } space-y-4`}
                >
                  {/* Background accent for free configs */}
                  {server.isFree && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
                  )}

                  <div className="relative z-10">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-foreground leading-tight">{server.serverName}</h3>
                        <p className="text-xs text-muted-foreground mt-1.5">{server.originalName}</p>
                      </div>
                      {server.isFree && (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-400/20 text-yellow-400 border border-yellow-400/40 text-xs font-bold whitespace-nowrap">
                          <Gift className="w-3 h-3" /> FREE
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border ${networkColor(server.network)}`}>
                        {capitalize(server.network)}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border border-secondary/30 bg-secondary/5 text-secondary">
                        {server.appType === "http_custom" ? "HTTP Custom" : "HTTP Injector"}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border border-primary/30 bg-primary/5 text-primary">
                        {capitalize(server.duration)}
                      </span>
                    </div>

                    {server.isFree ? (
                      <div className="mt-4 pt-4 border-t border-yellow-400/20 space-y-2">
                        <p className="text-xs text-muted-foreground">Download this free config to get started instantly.</p>
                        <Button
                          onClick={() => setSelectedFreeConfig(server)}
                          className="w-full bg-yellow-500 hover:bg-yellow-600 text-yellow-950 font-bold text-sm transition-all"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Free Config
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => navigate("/pricing")}
                        className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        View Premium Plans <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!searchParams && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
            {[
              { icon: Search, label: "Check Expiry", href: "/check-expiry", color: "text-primary", bg: "bg-primary/5 border-primary/20" },
              { icon: Smartphone, label: "How to Connect", href: "/how-to-connect", color: "text-secondary", bg: "bg-secondary/5 border-secondary/20" },
              { icon: Wifi, label: "Server Status", href: "/server-status", color: "text-success", bg: "bg-success/5 border-success/20" },
            ].map(({ icon: Icon, label, href, color, bg }) => (
              <Link key={href} href={href}>
                <div className={`glass-card rounded-xl p-5 flex items-center gap-4 cursor-pointer hover:border-primary/50 transition-all ${bg}`} data-testid={`link-quick-${label.toLowerCase().replace(/\s+/g, '-')}`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                  <span className="font-medium">{label}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Free Config Download Modal */}
        {selectedFreeConfig && (
          <FreeConfigDownloadModal
            isOpen={!!selectedFreeConfig}
            onClose={() => setSelectedFreeConfig(null)}
            server={{
              id: selectedFreeConfig.id,
              serverName: selectedFreeConfig.serverName,
              network: selectedFreeConfig.network,
              appType: selectedFreeConfig.appType,
              duration: selectedFreeConfig.duration,
              originalName: selectedFreeConfig.originalName,
            }}
          />
        )}
      </div>
      </div>
    </div>
  );
}
