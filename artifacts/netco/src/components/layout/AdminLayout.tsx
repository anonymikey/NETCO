import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, LogOut, Home, ShoppingCart, Users, Server, BarChart3, Settings, Bell, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import netcoLogo from "/logo.png";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [location] = useLocation();
  const { signOut } = useAuth();

  const adminLinks = [
    { href: "/admin", label: "Dashboard", icon: Home },
    { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/servers", label: "Config Servers", icon: Server },
    { href: "/admin/plans", label: "Plans & Pricing", icon: BarChart3 },
    { href: "/admin/transactions", label: "Transactions", icon: DollarSign },
    { href: "/admin/notifications", label: "Notifications", icon: Bell },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Mobile Sidebar Toggle */}
      <button
        className="fixed md:hidden top-4 right-4 z-40 p-2 bg-primary text-primary-foreground rounded-lg"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed md:relative w-64 h-screen bg-card border-r border-border transition-transform duration-300 z-30 ${
          !isSidebarOpen ? "-translate-x-full md:translate-x-0" : ""
        }`}
      >
        {/* Logo */}
        <div className="h-16 md:h-20 flex items-center justify-center border-b border-border p-4">
          <Link href="/admin" className="flex items-center group">
            <img src={netcoLogo} alt="NETCO Admin" className="h-8 md:h-10 w-auto object-contain" />
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {adminLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location === link.href || location.startsWith(link.href + "/");
            return (
              <Link key={link.href} href={link.href}>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{link.label}</span>
                </button>
              </Link>
            );
          })}
        </nav>

        {/* Settings & Logout */}
        <div className="border-t border-border p-4 space-y-2">
          <Link href="/admin/settings">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-left text-sm">
              <Settings className="w-5 h-5" />
              Settings
            </button>
          </Link>
          <Button
            onClick={signOut}
            variant="ghost"
            className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-500/10 h-auto px-4 py-3"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-card border-b border-border px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center">
          <div className="flex items-center justify-between w-full">
            <h1 className="text-xl md:text-2xl font-bold hidden md:block">Admin Dashboard</h1>
            <div className="flex items-center gap-4 ml-auto">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-20"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
