import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { apiUrl } from "@/lib/api";
import { CheckCircle2, Zap, Star, ArrowRight, Loader2 } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  downloadSpeed: string;
  supportedApps: string[];
  features: string[];
  isRecommended?: boolean;
  isActive: boolean;
}

export default function PlansPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const res = await fetch(apiUrl("api/plans"), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load plans");

      const data = await res.json();
      setPlans(data || []);
    } catch (err) {
      console.error("[v0] Failed to load plans:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelection = (planId: string) => {
    setSelectedPlanId(planId);
    if (user) {
      navigate(`/checkout?planId=${planId}`);
    } else {
      navigate("/login");
    }
  };

  const defaultPlans: Plan[] = [
    {
      id: "free",
      name: "Free",
      description: "Perfect for trying out NETCO",
      price: 0,
      duration: "Forever",
      downloadSpeed: "1 Mbps",
      supportedApps: ["All Major Apps"],
      features: [
        "1 device",
        "1 Mbps speed",
        "Limited bandwidth",
        "Email support",
        "Basic security",
      ],
      isActive: true,
    },
    {
      id: "weekly",
      name: "Weekly",
      description: "Great for short-term access",
      price: 299,
      duration: "7 days",
      downloadSpeed: "10 Mbps",
      supportedApps: ["All Major Apps"],
      features: [
        "1 device",
        "10 Mbps speed",
        "Unlimited bandwidth",
        "Email support",
        "Premium security",
        "Ad-free experience",
      ],
      isActive: true,
    },
    {
      id: "biweekly",
      name: "Bi-Weekly",
      description: "Best value for regular users",
      price: 549,
      duration: "14 days",
      downloadSpeed: "15 Mbps",
      supportedApps: ["All Major Apps"],
      features: [
        "2 devices",
        "15 Mbps speed",
        "Unlimited bandwidth",
        "Priority email support",
        "Premium security",
        "Ad-free experience",
        "Auto-renewal",
      ],
      isRecommended: true,
      isActive: true,
    },
    {
      id: "monthly",
      name: "Monthly",
      description: "Most popular plan",
      price: 999,
      duration: "30 days",
      downloadSpeed: "20 Mbps",
      supportedApps: ["All Major Apps"],
      features: [
        "3 devices",
        "20 Mbps speed",
        "Unlimited bandwidth",
        "24/7 priority support",
        "Premium security",
        "Ad-free experience",
        "Auto-renewal",
        "Device management",
      ],
      isActive: true,
    },
  ];

  const displayPlans = plans.length > 0 ? plans : defaultPlans;

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 bg-gradient-to-b from-background to-background/50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 text-balance">Simple, Transparent Pricing</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that works best for you. Upgrade or downgrade anytime.
          </p>
        </div>

        {/* Plans Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {displayPlans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative flex flex-col transition-all duration-300 hover:shadow-lg ${
                  plan.isRecommended
                    ? "md:scale-105 border-primary/50 bg-gradient-to-br from-primary/5 to-background"
                    : "hover:border-primary/30"
                }`}
              >
                {/* Recommended Badge */}
                {plan.isRecommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground gap-1">
                      <Star className="w-3 h-3" />
                      Recommended
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>

                  {/* Price */}
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">
                      {plan.price === 0 ? "Free" : `KES ${plan.price.toLocaleString()}`}
                    </span>
                    <span className="text-muted-foreground text-sm ml-2">/{plan.duration}</span>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 pb-4">
                  {/* Speed & Apps */}
                  <div className="mb-6 space-y-3">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium text-foreground">
                        <Zap className="w-4 h-4 inline mr-2 text-yellow-500" />
                        Speed: {plan.downloadSpeed}
                      </p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium text-foreground">
                        Apps: {plan.supportedApps.join(", ")}
                      </p>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-foreground">What&apos;s included:</p>
                    <ul className="space-y-2">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    onClick={() => handlePlanSelection(plan.id)}
                    disabled={selectedPlanId === plan.id}
                    className={`w-full gap-2 ${
                      plan.isRecommended
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : ""
                    }`}
                    variant={plan.isRecommended ? "default" : "outline"}
                  >
                    {plan.price === 0 ? "Choose Free" : "Buy Now"}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Custom Plan Section */}
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/30">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Need a Custom Plan?</CardTitle>
            <CardDescription>
              Looking for a custom solution? We can work with you to create a plan that fits your needs.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" size="lg" onClick={() => navigate("/contact")}>
              Contact Sales
            </Button>
          </CardContent>
        </Card>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                q: "Can I change my plan anytime?",
                a: "Yes! You can upgrade, downgrade, or cancel your plan anytime. Changes take effect immediately.",
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept M-Pesa, credit cards, and bank transfers. All transactions are secure and encrypted.",
              },
              {
                q: "Is there a refund policy?",
                a: "If you&apos;re not satisfied with our service, we offer a 7-day money-back guarantee.",
              },
              {
                q: "Can I use one plan on multiple devices?",
                a: "Yes! Most plans support multiple devices. Check the plan details for device limits.",
              },
              {
                q: "Do you offer annual plans?",
                a: "Currently we offer weekly, bi-weekly, and monthly plans. Contact us for annual pricing.",
              },
              {
                q: "What happens if I exceed my bandwidth?",
                a: "Our plans offer unlimited bandwidth, so you&apos;ll never have to worry about limits.",
              },
            ].map((faq, idx) => (
              <Card key={idx} className="bg-card/50">
                <CardHeader>
                  <CardTitle className="text-lg">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
