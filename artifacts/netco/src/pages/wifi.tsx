import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wifi, Zap, Shield, Users, Download, Phone, MessageCircle } from "lucide-react";

interface Package {
  network: string;
  color: string;
  icon: string;
  description: string;
  image: string;
  installationFee: number;
  contact: string;
  plans: {
    name: string;
    speed: string;
    validity: string;
    price: number;
  }[];
  features: string[];
}

const packages: Package[] = [
  {
    network: "NETCO Professional Installation",
    color: "from-blue-500 to-cyan-500",
    icon: "🚀",
    description: "Fast, Reliable & Unlimited Internet Installation Services",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-pCiWwBAvqwA1n6HSHtdvDadjqTNYcQ.png",
    installationFee: 1000,
    contact: "0113 313 240",
    plans: [],
    features: ["Professional Technicians", "ODU Installation", "Router Setup", "WiFi Optimization", "After Sales Support"],
  },
  {
    network: "Airtel 5G ODU Packages",
    color: "from-red-500 to-pink-500",
    icon: "📡",
    description: "Super Fast 5G Speed • Strong & Stable Signal • Reliable Connection",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-xgeGqk7BgJHLpXRkJ0gOFbeKy315OO.png",
    installationFee: 1000,
    contact: "0113 313 240",
    plans: [
      { name: "5G 15Mbps", speed: "15.0 Mbps", validity: "30 Days", price: 1999 },
      { name: "5G 30Mbps", speed: "30.0 Mbps", validity: "30 Days", price: 2999 },
      { name: "5G 15Mbps", speed: "15.0 Mbps", validity: "90 Days", price: 5399 },
    ],
    features: ["HD Streaming", "Online Gaming", "Multiple Users", "High Speed Download"],
  },
  {
    network: "Safaricom 5G Home Internet",
    color: "from-green-500 to-emerald-500",
    icon: "🏠",
    description: "Faster • Stronger • Better 5G Monthly Speed Plans",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-IZISa9UZkAvHoroM5BqAv4NYUF9rns.png",
    installationFee: 1000,
    contact: "0113 313 240",
    plans: [
      { name: "15Mbps", speed: "15 Mbps", validity: "30 Days", price: 2999 },
      { name: "50Mbps", speed: "50 Mbps", validity: "30 Days", price: 4000 },
      { name: "100Mbps", speed: "100 Mbps", validity: "30 Days", price: 5000 },
      { name: "250Mbps", speed: "250 Mbps", validity: "30 Days", price: 10000 },
    ],
    features: ["Ultra Fast Internet", "Unlimited Entertainment", "Work From Home", "Connect Many Devices"],
  },
];

export default function WiFi() {
  const [activeIndex, setActiveIndex] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // Intersection Observer for scroll animations
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-fade-in-up");
        }
      });
    }, { threshold: 0.1 });

    sectionRefs.current.forEach((ref) => {
      if (ref) observerRef.current?.observe(ref);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto space-y-20">
        <div ref={(el) => { sectionRefs.current[0] = el; }} className="text-center space-y-6 opacity-0">
          <Badge className="mx-auto bg-primary/20 border-primary/30 text-primary hover:bg-primary/30">
            <Wifi className="w-3 h-3 mr-1" />
            Professional WiFi Solutions
          </Badge>
          <h1 className="text-5xl md:text-6xl font-heading font-bold">
            Fast, Reliable & <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">Unlimited Internet</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Professional installation with same-day service. Choose from Airtel 5G, Safaricom 5G, or complete WiFi setup packages.
          </p>
        </div>

        {/* Main Hero Image */}
        <div ref={(el) => { sectionRefs.current[1] = el; }} className="opacity-0 transform hover:scale-105 transition-transform duration-500">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-GEYMgL7cJxOS7O6pgPNvzpufLXzseg.png"
            alt="NETCO Internet Solutions Installation"
            className="w-full h-auto rounded-2xl shadow-2xl border border-border/50"
          />
        </div>

        {/* Video Section */}
        <div ref={(el) => { sectionRefs.current[2] = el; }} className="opacity-0 space-y-6">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-center">See It In Action</h2>
          <div style={{ position: "relative", width: "100%", height: "0px", paddingBottom: "56.368%" }}>
            <iframe
              allow="fullscreen"
              allowFullScreen
              height="100%"
              src="https://streamable.com/e/cxgmy7?muted=1&nocontrols=1"
              width="100%"
              style={{ border: "none", width: "100%", height: "100%", position: "absolute", left: "0px", top: "0px", overflow: "hidden", borderRadius: "1rem" }}
            />
          </div>
        </div>

        {/* Packages Section */}
        <div className="space-y-12">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-12">
            Choose Your <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Perfect Plan</span>
          </h2>

          {packages.map((pkg, idx) => (
            <div
              key={idx}
              ref={(el) => { sectionRefs.current[3 + idx] = el; }}
              className="opacity-0 space-y-6"
            >
              {/* Package Header with Image */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-4 lg:order-last">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r ${pkg.color} text-white font-heading font-bold`}>
                    <span className="text-xl">{pkg.icon}</span>
                    {pkg.network}
                  </div>
                  <h3 className="text-3xl md:text-4xl font-heading font-bold">{pkg.description}</h3>
                  <p className="text-muted-foreground text-lg">
                    Installation Fee: <span className="font-bold text-foreground">KES {pkg.installationFee.toLocaleString()}</span>
                  </p>

                  {/* Features Grid */}
                  <div className="grid grid-cols-2 gap-3 pt-4">
                    {pkg.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-card border border-border/50">
                        <Zap className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-sm font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Contact CTA */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-6">
                    <a href={`https://wa.me/254113313240`} target="_blank" rel="noopener noreferrer">
                      <Button className="w-full bg-green-600 hover:bg-green-700 text-white gap-2">
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp: {pkg.contact}
                      </Button>
                    </a>
                    <a href={`tel:+254${pkg.contact.replace(/\s/g, "")}`}>
                      <Button variant="outline" className="w-full gap-2">
                        <Phone className="w-4 h-4" />
                        Call: {pkg.contact}
                      </Button>
                    </a>
                  </div>
                </div>

                {/* Package Image */}
                <div className="relative h-96 rounded-xl overflow-hidden border border-border/50 shadow-xl">
                  <img
                    src={pkg.image}
                    alt={pkg.network}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
              </div>

              {/* Plans Table */}
              {pkg.plans.length > 0 && (
                <div className="glass-card rounded-xl overflow-hidden border border-border/50">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className={`bg-gradient-to-r ${pkg.color} text-white font-heading font-bold`}>
                          <th className="px-4 py-4 text-left">Plan</th>
                          <th className="px-4 py-4 text-center">Speed</th>
                          <th className="px-4 py-4 text-center">Validity</th>
                          <th className="px-4 py-4 text-right">Price (KES)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pkg.plans.map((plan, i) => (
                          <tr key={i} className="border-t border-border hover:bg-card/50 transition-colors">
                            <td className="px-4 py-4 font-medium">{plan.name}</td>
                            <td className="px-4 py-4 text-center text-muted-foreground">{plan.speed}</td>
                            <td className="px-4 py-4 text-center text-muted-foreground">{plan.validity}</td>
                            <td className="px-4 py-4 text-right font-heading font-bold text-lg">{plan.price.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Divider */}
              {idx < packages.length - 1 && <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-12" />}
            </div>
          ))}
        </div>

        {/* Final CTA */}
        <div ref={(el) => { sectionRefs.current[6] = el; }} className="opacity-0 text-center space-y-8 py-12 px-6 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20">
          <h2 className="text-3xl md:text-4xl font-heading font-bold">Get Connected Today</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Professional installation available same-day. 24/7 customer support with 100% satisfaction guarantee.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="https://wa.me/254113313240" target="_blank" rel="noopener noreferrer">
              <Button className="bg-green-600 hover:bg-green-700 text-white px-8 h-12 text-lg gap-2">
                <MessageCircle className="w-5 h-5" />
                Chat on WhatsApp
              </Button>
            </a>
            <a href="tel:+254113313240">
              <Button variant="outline" className="px-8 h-12 text-lg gap-2">
                <Phone className="w-5 h-5" />
                Call 0113 313 240
              </Button>
            </a>
          </div>
          <p className="text-muted-foreground text-sm">
            Visit: <span className="font-medium text-foreground">netco.anonymiketech.online/wifi</span>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        
        @media (prefers-reduced-motion: reduce) {
          .animate-fade-in-up {
            animation: none;
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
