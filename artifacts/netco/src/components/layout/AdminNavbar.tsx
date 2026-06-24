import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Menu, X, LogOut, Settings, LayoutDashboard, ShoppingCart, Server,
  Bell, Users, ChevronDown,
} from "lucide-react";

interface AdminNavbarProps {
  sidebarOpen: boolean;
  onSidebarToggle: (open: boolean) => void;
}

export function AdminNavbar({ sidebarOpen, onSidebarToggle }: AdminNavbarProps) {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Left: Logo + Menu Toggle */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => onSidebarToggle(!sidebarOpen)}
            className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-primary" />
            </div>
            <span className="font-heading font-bold text-lg hidden sm:inline">Admin</span>
          </div>
        </div>

        {/* Right: Notifications + User Menu */}
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => navigate("/admin?tab=Notifications")}
            className="p-2 hover:bg-muted rounded-lg transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-2 md:px-3 py-2 hover:bg-muted rounded-lg transition-colors text-sm"
            >
              <span className="hidden sm:inline text-foreground/80">{user?.email?.split("@")[0]}</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg py-1 z-50">
                <button
                  onClick={() => {
                    navigate("/admin?tab=Settings");
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-muted flex items-center gap-2 text-sm transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <hr className="my-1 border-border" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-destructive/10 hover:text-destructive flex items-center gap-2 text-sm transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
