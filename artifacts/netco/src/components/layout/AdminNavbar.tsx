import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, LogOut, Users, Bell, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { AdminNotificationBell } from "@/components/notifications/AdminNotificationBell";
import netcoLogo from "/logo.png";

export function AdminNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  const { user, signOut, loading, isAdminUser } = useAuth();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location]);

  // Fetch active users count
  useEffect(() => {
    const fetchActiveUsers = async () => {
      try {
        const response = await fetch("/api/admin/active-users", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setActiveUsersCount(data.count || 0);
        }
      } catch (error) {
        console.error("[v0] Failed to fetch active users:", error);
      }
    };

    fetchActiveUsers();
    const interval = setInterval(fetchActiveUsers, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const adminNavLinks = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin?tab=Orders", label: "Orders" },
    { href: "/admin?tab=Config Servers", label: "Servers" },
  ];

  // Only show admin navbar if user is admin
  if (!isAdminUser) {
    return null;
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-amber-400/20 ${
        isScrolled
          ? "bg-background/95 backdrop-blur-md shadow-lg shadow-amber-400/10"
          : "bg-background/80 backdrop-blur-sm"
      }`}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo with Admin Badge */}
          <Link href="/admin" className="flex items-center gap-3 group" data-testid="link-admin-logo">
            <img
              src={netcoLogo}
              alt="NETCO Admin"
              className="h-10 sm:h-12 w-auto object-contain transition-opacity group-hover:opacity-90"
            />
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-semibold text-amber-400">ADMIN PANEL</span>
              <span className="text-xs text-muted-foreground">Management Console</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {adminNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location === link.href
                    ? "text-amber-400 bg-amber-400/10 border border-amber-400/30"
                    : "text-muted-foreground hover:text-amber-400 hover:bg-amber-400/5"
                }`}
                data-testid={`link-admin-nav-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Admin Controls (Desktop) */}
          <div className="hidden md:flex items-center gap-4">
            {/* Active Users Badge */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary/10 border border-primary/20">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">{activeUsersCount}</span>
              <span className="text-xs text-muted-foreground">Active</span>
            </div>

            {/* Admin Notification Bell */}
            <AdminNotificationBell />

            {/* Logout Button */}
            {!loading && user && (
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="border-amber-400/30 text-amber-400 hover:bg-amber-400/10 gap-1.5"
                data-testid="button-admin-signout"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-amber-400 focus:outline-none transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            data-testid="button-admin-mobile-menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-card border-b border-amber-400/20 shadow-xl animate-in slide-in-from-top-2">
          <div className="px-4 pt-2 pb-6 space-y-1 flex flex-col">
            {adminNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-3 rounded-md text-base font-medium transition-colors ${
                  location === link.href
                    ? "text-amber-400 bg-amber-400/10 border-l-2 border-amber-400"
                    : "text-muted-foreground hover:text-amber-400 hover:bg-amber-400/5"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Mobile Admin Stats */}
            <div className="mt-4 p-3 rounded-md bg-primary/10 border border-primary/20 space-y-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">{activeUsersCount} Active Users</span>
              </div>
            </div>

            {!loading && user && (
              <div className="pt-4 mt-2 border-t border-border">
                <Button onClick={signOut} variant="ghost" className="w-full text-amber-400 gap-2 font-semibold">
                  <LogOut className="w-4 h-4" /> Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
