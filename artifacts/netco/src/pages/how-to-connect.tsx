import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppShowcase } from "@/components/app-showcase";
import { Smartphone, Download, Key, Upload, Play, Lightbulb, ExternalLink } from "lucide-react";

const APPS = [
  {
    id: "http_custom",
    name: "HTTP Custom",
    fileExt: ".hc",
    deviceLabel: "HWID",
    playStoreUrl: "https://play.google.com/store/apps/details?id=xyz.easypro.httpcustom&pcampaignid=web_share",
    icon: "HC",
    color: "text-primary",
    steps: [
      {
        icon: Download,
        title: "Install HTTP Custom",
        description: "Download HTTP Custom from Google Play Store. It's free and requires Android 5.0+.",
        highlight: "Search 'HTTP Custom' on Play Store",
      },
      {
        icon: Key,
        title: "Get Your HWID",
        description: "Open the app → tap the three-line menu in the top-left → tap 'Device ID' and find your HWID. Copy the full string.",
        highlight: "Menu → Device ID → Copy HWID",
      },
      {
        icon: Smartphone,
        title: "Purchase Your Config",
        description: "Go to the Pricing page, select your network (Safaricom/Airtel/Telkom) and plan, then paste your HWID at checkout.",
        highlight: "Paste HWID exactly as shown",
      },
      {
        icon: Upload,
        title: "Import the Config",
        description: "After payment, download your .hc file. In HTTP Custom, tap Import → select the .hc file from your Downloads.",
        highlight: "Import → .hc file from Downloads",
      },
      {
        icon: Play,
        title: "Connect & Enjoy",
        description: "Tap Connect. The app will establish your VPN tunnel. You'll see a VPN icon in your status bar when connected.",
        highlight: "Tap Connect — done!",
      },
    ],
    tips: [
      "Keep your HWID saved somewhere safe — you'll need it to renew your plan",
      "If the connection drops, tap Disconnect, wait 10 seconds, then reconnect",
      "Do not uninstall and reinstall the app — your HWID may change",
      "Make sure your active SIM matches the network you purchased (e.g. Safaricom config on Safaricom SIM)",
    ],
  },
  {
    id: "http_injector",
    name: "HTTP Injector",
    fileExt: ".ehi",
    deviceLabel: "HWID",
    playStoreUrl: "https://play.google.com/store/apps/details?id=com.evozi.injector&pcampaignid=web_share",
    icon: "HI",
    color: "text-secondary",
    steps: [
      {
        icon: Download,
        title: "Install HTTP Injector",
        description: "Download HTTP Injector from Google Play Store. It's free and works on Android 4.4+.",
        highlight: "Search 'HTTP Injector' on Play Store",
      },
      {
        icon: Key,
        title: "Find Your HWID",
        description: "Open HTTP Injector → go to the Config tab → tap the info or settings icon. Your HWID is displayed at the top.",
        highlight: "Config tab → HWID shown at top",
      },
      {
        icon: Smartphone,
        title: "Purchase Your Config",
        description: "Visit the Pricing page, select your network and plan. Paste your HWID (not Device ID) during checkout.",
        highlight: "Use HWID — not Device ID",
      },
      {
        icon: Upload,
        title: "Import the .ehi File",
        description: "Download your .ehi config file. In HTTP Injector, tap Import → locate the file in your Downloads folder.",
        highlight: "Import → .ehi file",
      },
      {
        icon: Play,
        title: "Start the Connection",
        description: "Tap the power/start button. HTTP Injector will connect and route your traffic through NETCO's servers.",
        highlight: "Tap Start — VPN icon appears",
      },
    ],
    tips: [
      "HTTP Injector uses HWID (not Device ID) — make sure you copy the right identifier",
      "If you see 'Config Expired', your plan has ended — purchase a renewal",
      "Enable 'Start on Boot' in settings to auto-connect when your phone restarts",
      "Use Wi-Fi calling if your carrier supports it — VPN may affect regular calls on some networks",
    ],
  },
];

export default function HowToConnect() {
  const [activeApp, setActiveApp] = useState(0);
  const app = APPS[activeApp];

  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
            How to <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Connect</span>
          </h1>
          <p className="text-muted-foreground text-lg">Step-by-step guides for both supported VPN apps</p>
        </div>

        {/* App Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
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

        {/* App selector */}
        <div className="flex justify-center gap-3">
          {APPS.map((a, i) => (
            <button
              key={a.id}
              onClick={() => setActiveApp(i)}
              data-testid={`tab-app-${a.id}`}
              className={`px-6 py-3 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                activeApp === i
                  ? "bg-primary text-primary-foreground glow-primary"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
              }`}
            >
              <span className={`font-heading font-bold ${activeApp === i ? "text-primary-foreground" : a.color}`}>{a.icon}</span>
              {a.name}
              <Badge variant="outline" className="text-xs ml-1 border-current opacity-70">{a.fileExt}</Badge>
            </button>
          ))}
        </div>

        {/* Play Store link */}
        <div className="flex justify-center">
          <a href={app.playStoreUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="border-border hover:border-primary/50 text-sm gap-2" data-testid="link-play-store">
              <ExternalLink className="w-4 h-4" /> Download {app.name} on Google Play
            </Button>
          </a>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {app.steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="glass-card rounded-xl p-5 flex gap-5 items-start" data-testid={`step-${i}`}>
                <div className="flex-shrink-0 flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-heading font-bold text-sm">
                    {i + 1}
                  </div>
                  {i < app.steps.length - 1 && <div className="w-px h-8 bg-border" />}
                </div>
                <div className="flex-1 space-y-2 pt-1">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                    <h3 className="font-heading font-bold">{step.title}</h3>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                  <div className="inline-flex items-center gap-1.5 bg-primary/5 border border-primary/20 rounded-md px-3 py-1.5 text-xs text-primary font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    {step.highlight}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tips */}
        <div className="glass-card rounded-xl p-6 space-y-4 border-secondary/20 bg-secondary/5">
          <div className="flex items-center gap-2 text-secondary font-heading font-bold">
            <Lightbulb className="w-5 h-5" />
            Pro Tips for {app.name}
          </div>
          <ul className="space-y-2.5">
            {app.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5 flex-shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Ready to get started?</p>
          <Link href="/pricing">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary-hover px-8 h-11" data-testid="button-browse-plans">
              Browse Plans
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
