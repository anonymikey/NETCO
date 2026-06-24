import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/use-notifications";
import { NotificationsDropdown } from "./notifications-dropdown";
import { useState, useRef, useEffect } from "react";

export function NotificationBell() {
  const { unreadCount } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && bellRef.current) {
      const rect = bellRef.current.getBoundingClientRect();
      const newPos = {
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      };
      console.log("[v0] Dropdown position:", newPos, "Bell rect:", rect);
      setDropdownPos(newPos);
    }
  }, [isOpen]);

  const handleBellClick = () => {
    console.log("[v0] Bell clicked, isOpen was:", isOpen);
    setIsOpen(!isOpen);
    console.log("[v0] Bell clicked, isOpen now:", !isOpen);
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

      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
      {isOpen && (
        <>
          {console.log("[v0] Rendering dropdown at:", dropdownPos)}
          <div
            style={{
              position: "fixed",
              top: `${dropdownPos.top}px`,
              right: `${dropdownPos.right}px`,
              zIndex: 50,
            }}
          >
            <NotificationsDropdown onClose={() => setIsOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
}
