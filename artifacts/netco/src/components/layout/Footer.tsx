import { Link } from "wouter";
import { Shield, MessageCircle, Mail, Clock, ExternalLink } from "lucide-react";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "Pricing", href: "/pricing" },
  { label: "How to Connect", href: "/how-to-connect" },
  { label: "Server Status", href: "/server-status" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Check Expiry", href: "/check-expiry" },
];

const supportLinks = [
  { label: "FAQs", href: "/faqs" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Contact Us", href: "/contact" },
];

export function Footer() {
  return (
    <footer className="relative bg-card border-t border-border">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00F5FF08_1px,transparent_1px),linear-gradient(to_bottom,#00F5FF08_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">

          {/* Brand Column */}
          <div className="lg:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-heading text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                NETCO
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Premium VPN internet configs for Kenya. Unlimited data on Safaricom, Airtel &amp; Telkom. Fast, secure, and reliable.
            </p>
            <p className="text-xs text-muted-foreground/60 uppercase tracking-wider">
              Managed by ANONYMIKETECH
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://wa.me/254782829321"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-green-400 hover:border-green-400/40 transition-all"
                data-testid="link-social-whatsapp"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              <a
                href="https://t.me/netco"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-all"
                data-testid="link-social-telegram"
                aria-label="Telegram"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <a
                href="mailto:netco@anonymiketech.online"
                className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-secondary hover:border-secondary/40 transition-all"
                data-testid="link-social-email"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-heading text-foreground font-semibold tracking-wide">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground text-sm hover:text-primary transition-colors"
                    data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="font-heading text-foreground font-semibold tracking-wide">Support</h4>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground text-sm hover:text-primary transition-colors"
                    data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-heading text-foreground font-semibold tracking-wide">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MessageCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">WhatsApp Support</p>
                  <a
                    href="https://wa.me/254782829321"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground text-sm hover:text-green-400 transition-colors font-medium"
                    data-testid="link-whatsapp-number"
                  >
                    +254 782 829 321
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Email</p>
                  <a
                    href="mailto:netco@anonymiketech.online"
                    className="text-foreground text-sm hover:text-secondary transition-colors font-medium"
                    data-testid="link-email"
                  >
                    netco@anonymiketech.online
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Support Hours</p>
                  <p className="text-foreground text-sm font-medium">24 / 7 / 365</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-xs">
            &copy; {new Date().getFullYear()} NETCO. All rights reserved.
          </p>
          <p className="text-muted-foreground/50 text-xs uppercase tracking-wider">
            Systems managed by ANONYMIKETECH
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/terms"
              className="text-muted-foreground text-xs hover:text-foreground transition-colors"
              data-testid="link-footer-privacy"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-muted-foreground text-xs hover:text-foreground transition-colors"
              data-testid="link-footer-terms-bottom"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
