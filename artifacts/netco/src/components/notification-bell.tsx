import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/use-notifications";
import { NotificationsDropdown } from "./notifications-dropdown";
import { NotificationsDrawer } from "./notifications-drawer";
import { useState, useRef, useEffect } from "react";

export function NotificationBell() {
  const { unreadCount } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isOpen && bellRef.current && !isMobile) {
      const rect = bellRef.current.getBoundingClientRect();
      const newPos = {
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      };
      setDropdownPos(newPos);
    }
  }, [isOpen, isMobile]);

  // Close on ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

  const handleBellClick = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div ref={bellRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={handleBellClick}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>

      {isMobile ? (
        <>
          {isOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
          )}
          {isOpen && <NotificationsDrawer onClose={() => setIsOpen(false)} />}
        </>
      ) : (
        <>
          {isOpen && (
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          )}
          {isOpen && (
            <div
              style={{
                position: "fixed",
                top: `${dropdownPos.top}px`,
                right: `${dropdownPos.right}px`,
                zIndex: 50,
              }}
              className="animate-in fade-in zoom-in-95 duration-200"
            >
              <NotificationsDropdown onClose={() => setIsOpen(false)} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
