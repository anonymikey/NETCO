import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield, Zap, Globe, Cpu, ArrowRight, Server, Check, Gift, Lock, Smartphone, Wifi, Clock, Users, TrendingUp, Headphones } from "lucide-react";
import { useGetPlatformStats, useListPackages, useListConfigServers } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { FreeConfigDownloadModal } from "@/components/free-config-download-modal";
import { AppGallerySection } from "@/components/app-gallery-section";

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function networkColor(network: string) {
  if (network === "safaricom") return "text-green-400";
  if (network === "airtel") return "text-red-400";
  return "text-blue-400";
}

export default function Home() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  
  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const { data: stats } = useGetPlatformStats();
  const { data: packages } = useListPackages();
  const { data: servers = [] } = useListConfigServers();
  const activeServers = (Array.isArray(servers) ? servers : []).filter((s: any) => s.status === "active");
  const [freeConfigModal, setFreeConfigModal] = useState<{ isOpen: boolean; server?: any }>({ isOpen: false });

  const handleProtectedLink = (href: string) => {
    if (!user) {
      navigate("/signup");
    } else {
      navigate(href);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex flex-col items-center justify-center text-center px-4">
        {/* Cyber grid bg */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00F5FF10_1px,transparent_1px),linear-gradient(to_bottom,#00F5FF10_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium mb-4">
            <Zap className="w-4 h-4" />
            <span>High-Speed Configs for Kenya</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold font-heading text-foreground tracking-tight text-glow">
            Unlock the <br />
            <span className="bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text">Unrestricted Web</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Premium VPN configurations engineered for power users. Bypass throttling, access blocked content, and encrypt your traffic on Safaricom, Airtel, and Telkom.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button 
              size="lg" 
              onClick={() => handleProtectedLink("/pricing")}
              className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 glow-primary-hover font-bold px-8 h-12 text-lg"
            >
              Get Access Now <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Link href="/how-to-connect">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-primary/50 hover:bg-primary/10 h-12 text-lg">
                How It Works
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-border bg-card/50 relative">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center space-y-2">
            <div className="text-3xl font-bold font-heading text-primary glow-primary inline-block text-glow">{stats?.activeUsers || "2.4K"}+</div>
            <div className="text-sm text-muted-foreground uppercase tracking-widest">Active Users</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-3xl font-bold font-heading text-secondary text-glow-secondary inline-block">{stats?.serversOnline || "18"}</div>
            <div className="text-sm text-muted-foreground uppercase tracking-widest">Servers Online</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-3xl font-bold font-heading text-success inline-block">{stats?.uptime || "99.9"}%</div>
            <div className="text-sm text-muted-foreground uppercase tracking-widest">Uptime</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-3xl font-bold font-heading text-foreground inline-block">24/7</div>
            <div className="text-sm text-muted-foreground uppercase tracking-widest">Support</div>
          </div>
        </div>
      </section>

      {/* Available Servers Section */}
      {activeServers.length > 0 && (
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium">
                <Server className="w-4 h-4" />
                <span>Available Configurations</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold font-heading text-foreground">
                Choose Your Config
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Select from our curated collection of high-speed configurations optimized for your network and usage.
              </p>
              {!user && (
                <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-warning/10 text-warning border border-warning/30">
                  <Lock className="w-4 h-4" />
                  <span className="text-sm font-medium">Sign in to purchase configs</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeServers.map((server: any) => (
                <div
                  key={server.id}
                  className="group relative glass-card rounded-xl p-6 border border-border hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/20"
                >
                  {server.isFree && (
                    <div className="absolute -top-3 -right-3">
                      <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 text-xs font-bold">
                        <Gift className="w-3 h-3" /> FREE
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Server Name */}
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{server.serverName}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{server.originalName}</p>
                    </div>

                    {/* Network & Details */}
                    <div className="flex flex-wrap gap-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border ${networkColor(server.network)} bg-opacity-10`}>
                        {capitalize(server.network)}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border border-primary/30 bg-primary/5 text-primary">
                        {capitalize(server.planType)}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border border-secondary/30 bg-secondary/5 text-secondary">
                        {capitalize(server.duration)}
                      </span>
                    </div>

                    {/* App Type */}
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2">Compatible with:</p>
                      <p className="text-sm font-medium">
                        {server.appType === "http_custom" ? "HTTP Custom (.hc)" : "HTTP Injector (.ehi)"}
                      </p>
                    </div>

                    {/* File Info */}
                    {server.fileSize && (
                      <div className="text-xs text-muted-foreground">
                        File size: {(server.fileSize / 1024).toFixed(1)} KB
                      </div>
                    )}

                    {/* CTA Button */}
                    {server.isFree ? (
                      <Button
                        onClick={() => setFreeConfigModal({ isOpen: true, server })}
                        className="w-full mt-4 bg-success text-success-foreground hover:bg-success/90"
                      >
                        <Gift className="w-4 h-4 mr-2" />
                        Download Free Config
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleProtectedLink("/pricing")}
                        className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        {user ? "Get Access" : "Sign In to Buy"} <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Section */}
            <div className="text-center space-y-4 pt-8">
              <p className="text-muted-foreground">Ready to unlock the web?</p>
              <Button 
                size="lg" 
                onClick={() => handleProtectedLink("/pricing")}
                className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary-hover font-bold px-8 h-12 text-lg"
              >
                View All Plans <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* App Gallery Section */}
      <AppGallerySection />

      {/* Features Section */}
      <section className="py-20 px-4 bg-card/30 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium">
              <Zap className="w-4 h-4" />
              <span>Why Choose NETCO</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold font-heading text-foreground">
              Enterprise-Grade Security, Consumer Pricing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Advanced VPN technology with the simplicity and affordability Kenyans deserve
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Lock,
                title: "Device-Locked Security",
                description: "Your config is locked to your specific device. Can't be shared or used elsewhere, ensuring exclusive access.",
              },
              {
                icon: Clock,
                title: "Instant Activation",
                description: "Get your config within seconds of payment. Start browsing immediately—no waiting, no hassles.",
              },
              {
                icon: Globe,
                title: "All Networks Supported",
                description: "Works on Safaricom, Airtel, and Telkom. Choose your network and get optimized speeds.",
              },
              {
                icon: Smartphone,
                title: "Easy Setup",
                description: "Simple 3-step process. Import into HTTP Custom or HTTP Injector and you're done.",
              },
              {
                icon: Wifi,
                title: "99.9% Uptime",
                description: "Reliable servers with 24/7 monitoring ensure your connection stays stable.",
              },
              {
                icon: Headphones,
                title: "24/7 Support",
                description: "Chat with our team on WhatsApp anytime. We resolve issues in under 1 hour.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="glass-card rounded-xl p-6 border border-border hover:border-primary/50 transition-all group"
              >
                <div className="mb-4 inline-flex p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium">
              <TrendingUp className="w-4 h-4" />
              <span>Getting Started</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold font-heading text-foreground">
              Three Steps to Unlimited Access
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connection lines (visible on md+) */}
            <div className="hidden md:block absolute top-1/4 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

            {[
              {
                step: 1,
                title: "Choose Your Plan",
                description: "Select your network (Safaricom, Airtel, Telkom), duration (daily, weekly, monthly), and app type.",
                icon: "🎯",
              },
              {
                step: 2,
                title: "Complete Payment",
                description: "Pay securely via M-Pesa. Your config is generated instantly after payment confirmation.",
                icon: "💳",
              },
              {
                step: 3,
                title: "Start Browsing",
                description: "Import your config into HTTP Custom or HTTP Injector and enjoy unlimited, encrypted browsing.",
                icon: "🚀",
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="relative z-10 bg-background rounded-xl p-6 border border-border text-center">
                  <div className="text-5xl mb-4 inline-block">{item.icon}</div>
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 border-2 border-primary text-primary font-bold text-sm mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <Link href="/how-to-connect">
              <Button size="lg" variant="outline" className="border-primary/50 hover:bg-primary/10">
                View Detailed Guide <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 px-4 bg-card/30 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-heading text-foreground">
              Trusted by Kenyans Nationwide
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of satisfied users who've unlocked faster, unrestricted internet
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { stat: "2,400+", label: "Active Users", icon: Users },
              { stat: "99.9%", label: "Uptime Guarantee", icon: Wifi },
              { stat: "150+", label: "5-Star Reviews", icon: Check },
            ].map((item, i) => (
              <div key={i} className="text-center p-6 rounded-xl border border-border/50 hover:border-primary/30 transition-colors">
                <div className="inline-flex p-3 rounded-lg bg-primary/10 mb-4">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-4xl font-bold text-primary mb-2 font-heading">{item.stat}</div>
                <div className="text-muted-foreground">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 opacity-50" />
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold font-heading text-foreground">
            Ready to Experience Unlimited Internet?
          </h2>
          <p className="text-xl text-muted-foreground">
            Join thousands of Kenyans already enjoying fast, secure, unrestricted browsing. Get started in seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button 
              size="lg" 
              onClick={() => handleProtectedLink("/pricing")}
              className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 glow-primary-hover font-bold px-8 h-12 text-lg"
            >
              Get Started Now <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Link href="/faqs">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-primary/50 hover:bg-primary/10 h-12 text-lg">
                Have Questions? Check FAQs
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <FreeConfigDownloadModal
        isOpen={freeConfigModal.isOpen}
        onClose={() => setFreeConfigModal({ isOpen: false })}
        server={freeConfigModal.server}
      />
    </div>
  );
}
