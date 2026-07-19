import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, Zap, Star, RefreshCw } from "lucide-react";
import { useListPackages } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";

const FAQS = [
  { q: "What apps do I need?", a: "You need HTTP Custom (for .hc files) or HTTP Injector (for .ehi files). Both are free on the Google Play Store." },
  { q: "What is a Device ID and HWID?", a: "Device ID is used for HTTP Custom (format: C4E61860CA87C6CB24C9C56BE3312E6J). HWID is for HTTP Injector (format: 0979c85da5eef2f998334156cb53edf6). You'll find these in your app settings." },
  { q: "How is the config delivered?", a: "After successful payment, your config file is sent automatically. It is device-locked to the Device ID or HWID you provide." },
  { q: "Can I share my config?", a: "No. Configs are locked to one specific device. Sharing will cause the config to stop working on both devices." },
  { q: "What networks are supported?", a: "We support Safaricom, Airtel, and Telkom Kenya. Make sure to buy the config for your active SIM network." },
  { q: "How long does activation take?", a: "Activation is instant after M-Pesa payment confirmation, usually within 30 seconds." },
  { q: "What if my payment goes through but I don't get the config?", a: "Contact our support team on WhatsApp with your phone number and M-Pesa transaction code. We resolve all issues within 1 hour." },
];

const DURATIONS = [
  { key: "daily", label: "Daily", priceKey: "dailyPrice" as const, labelKey: "dailyLabel" as const },
  { key: "weekly", label: "Weekly", priceKey: "weeklyPrice" as const, labelKey: "weeklyLabel" as const },
  { key: "monthly", label: "Monthly", priceKey: "monthlyPrice" as const, labelKey: "monthlyLabel" as const },
];

export default function Pricing() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { data: networks, isLoading } = useListPackages();
  const [activeNetwork, setActiveNetwork] = useState(0);
  const [activeCategory, setActiveCategory] = useState(0);
  const [activeDuration, setActiveDuration] = useState("monthly");
  const [renewalContext, setRenewalContext] = useState<{
    renewalOfPlanId: string;
    renewalPlanName: string;
    network: string;
    appType: string;
    configType: string;
  } | null>(null);

  // Handle renewal context from navigation state
  useEffect(() => {
    if (window.history.state?.state) {
      const state = window.history.state.state;
      if (state.renewalOfPlanId) {
        setRenewalContext({
          renewalOfPlanId: state.renewalOfPlanId,
          renewalPlanName: state.renewalPlanName,
          network: state.network,
          appType: state.appType,
          configType: state.configType,
        });

        // Pre-select network based on renewal context
        if (networks && networks.length > 0 && state.network) {
          const networkIndex = networks.findIndex(n => n.name.toLowerCase() === state.network.toLowerCase());
          if (networkIndex >= 0) {
            setActiveNetwork(networkIndex);
          }
        }
      }
    }
  }, [networks]);

  const network = networks?.[activeNetwork];
  const category = network?.categories?.[activeCategory];
  const durObj = DURATIONS.find((d) => d.key === activeDuration) ?? DURATIONS[2];

  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      {/* Renewal Context Banner */}
      {renewalContext && (
        <div className="max-w-7xl mx-auto mb-6">
          <div className="flex items-center gap-3 p-4 rounded-lg border border-primary/30 bg-primary/5 text-primary">
            <RefreshCw className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Renewing: {renewalContext.renewalPlanName}</p>
              <p className="text-xs text-primary/70">You&apos;re renewing your VPN plan. Select the same or different duration below.</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="max-w-7xl mx-auto text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium mb-4">
          <Zap className="w-4 h-4" />
          <span>{renewalContext ? "Renew Your Plan" : "Transparent Pricing"}</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
          {renewalContext ? "Complete Your Renewal" : "Choose Your"}{" "}
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {renewalContext ? "Plan" : "Network Plan"}
          </span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          {renewalContext 
            ? "Renew your VPN plan to maintain uninterrupted access to your services."
            : "All plans include device-locked VPN configs for HTTP Custom and HTTP Injector apps."}
        </p>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Network tabs */}
        <div className="flex flex-wrap justify-center gap-2" data-testid="network-tabs">
          {isLoading
            ? ["Safaricom", "Airtel", "Telkom"].map((n) => (
                <div key={n} className="h-10 w-28 bg-card rounded-lg animate-pulse" />
              ))
            : networks?.map((net, i) => (
                <button
                  key={net.id}
                  onClick={() => { setActiveNetwork(i); setActiveCategory(0); }}
                  data-testid={`tab-network-${net.id}`}
                  className={`px-5 py-2 rounded-lg font-medium text-sm transition-all ${
                    activeNetwork === i
                      ? "bg-primary text-primary-foreground glow-primary"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                  }`}
                >
                  {net.name}
                </button>
              ))}
        </div>

        {/* Category tabs */}
        {network && (
          <div className="flex flex-wrap justify-center gap-2">
            {(Array.isArray(network.categories) ? network.categories : []).map((cat, i) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(i)}
                data-testid={`tab-category-${cat.id}`}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all border ${
                  activeCategory === i
                    ? "border-secondary/60 bg-secondary/10 text-secondary"
                    : "border-border bg-card/50 text-muted-foreground hover:text-foreground hover:border-secondary/30"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Duration selector */}
        <div className="flex justify-center">
          <div className="inline-flex bg-card border border-border rounded-lg p-1 gap-1">
            {DURATIONS.map((d) => (
              <button
                key={d.key}
                onClick={() => setActiveDuration(d.key)}
                data-testid={`tab-duration-${d.key}`}
                className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${
                  activeDuration === d.key
                    ? "bg-primary/20 text-primary border border-primary/40"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? [1, 2, 3].map((i) => (
                <div key={i} className="glass-card rounded-xl p-6 space-y-4 animate-pulse">
                  <div className="h-6 bg-muted/30 rounded w-3/4" />
                  <div className="h-10 bg-muted/30 rounded w-1/2" />
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((j) => <div key={j} className="h-4 bg-muted/20 rounded" />)}
                  </div>
                </div>
              ))
            : (Array.isArray(category?.plans) ? category?.plans : []).map((plan) => {
                const price = plan[durObj.priceKey];
                const durationLabel = plan[durObj.labelKey];
                return (
                  <div
                    key={plan.id}
                    data-testid={`card-plan-${plan.id}`}
                    className={`glass-card rounded-xl p-6 flex flex-col relative transition-all hover:border-primary/50 ${
                      plan.popular
                        ? "border-primary/50 glow-primary ring-1 ring-primary/20"
                        : "border-border"
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground px-3 py-1 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" /> Most Popular
                        </Badge>
                      </div>
                    )}

                    <div className="mb-4">
                      <h3 className="font-heading font-bold text-lg mb-1">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground">{plan.speed}</p>
                      {plan.description && (
                        <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
                      )}
                    </div>

                    {price && price > 0 ? (
                      <div className="mb-6">
                        <span className="text-4xl font-heading font-bold text-primary">
                          Ksh {(price ?? 0).toLocaleString()}
                        </span>
                        <span className="text-muted-foreground text-sm"> / {durationLabel}</span>
                      </div>
                    ) : (
                      <div className="mb-6">
                        <span className="text-2xl font-heading font-bold text-muted-foreground">Contact Us</span>
                      </div>
                    )}

                    <ul className="space-y-2 mb-6 flex-1">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{feat}</span>
                        </li>
                      ))}
                    </ul>

                    {price > 0 ? (
                      user ? (
                        <Link
                          href="/checkout"
                          state={{ 
                            plan, 
                            network: network?.name, 
                            duration: activeDuration, 
                            amount: price,
                            isRenewal: !!renewalContext,
                            renewalOfPlanId: renewalContext?.renewalOfPlanId,
                            renewalPlanName: renewalContext?.renewalPlanName,
                          }}
                          data-testid={`button-select-${plan.id}`}
                        >
                          <Button
                            className={`w-full ${
                              plan.popular
                                ? "bg-primary text-primary-foreground hover:bg-primary/90 glow-primary-hover"
                                : "bg-secondary/20 text-secondary border border-secondary/40 hover:bg-secondary/30"
                            }`}
                          >
                            Get {durationLabel} Plan
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          onClick={() => navigate("/signup")}
                          className={`w-full ${
                            plan.popular
                              ? "bg-primary text-primary-foreground hover:bg-primary/90 glow-primary-hover"
                              : "bg-secondary/20 text-secondary border border-secondary/40 hover:bg-secondary/30"
                          }`}
                        >
                          Sign Up to Get Started
                        </Button>
                      )
                    ) : (
                      <Link href="/contact">
                        <Button variant="outline" className="w-full border-border hover:border-primary/50">
                          Contact for Pricing
                        </Button>
                      </Link>
                    )}
                  </div>
                );
              })}
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto pt-16">
          <h2 className="text-3xl font-heading font-bold text-center mb-8">
            Pricing <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">FAQs</span>
          </h2>
          <Accordion type="single" collapsible className="space-y-2">
            {FAQS.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="glass-card rounded-lg border-border px-4"
                data-testid={`faq-item-${i}`}
              >
                <AccordionTrigger className="text-left font-medium hover:text-primary hover:no-underline py-4">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
}
