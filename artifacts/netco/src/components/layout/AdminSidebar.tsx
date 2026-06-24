import { useLocation } from "wouter";
import {
  LayoutDashboard, ShoppingCart, Server, Bell, Users, Settings, LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const MENU_ITEMS = [
  { id: "Dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "Orders", label: "Orders", icon: ShoppingCart },
  { id: "Config Servers", label: "Config Servers", icon: Server },
  { id: "Notifications", label: "Notifications", icon: Bell },
  { id: "Users", label: "Users", icon: Users },
  { id: "Settings", label: "Settings", icon: Settings },
] as const;

export function AdminSidebar({ isOpen, onClose, activeTab, onTabChange }: AdminSidebarProps) {
  const [, navigate] = useLocation();
  const { logout } = useAuth();

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    onClose?.();
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-16 md:top-0 left-0 h-[calc(100vh-64px)] w-64 bg-card border-r border-border transform transition-transform duration-300 z-40 md:z-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Menu Items */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {MENU_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleTabClick(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
                  activeTab === id
                    ? "bg-primary/20 text-primary border border-primary/40"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          {/* Logout Button */}
          <div className="px-4 py-4 border-t border-border">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
