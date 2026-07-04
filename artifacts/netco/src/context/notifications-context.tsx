import { createContext, ReactNode, useEffect } from "react";
import { apiUrl } from "@/lib/api";

interface NotificationsContextType {
  isInitialized: boolean;
}

export const NotificationsContext = createContext<NotificationsContextType | null>(null);

interface NotificationsProviderProps {
  children: ReactNode;
}

export function NotificationsProvider({ children }: NotificationsProviderProps) {
  useEffect(() => {
    // Check plan expiry notifications on mount
    const checkPlanNotifications = async () => {
      try {
        await fetch(apiUrl("/api/notifications/check-plan-expiry"), {
          method: "POST",
        });
      } catch (error) {
        console.error("[v0] Failed to check plan notifications:", error);
      }
    };

    checkPlanNotifications();

    // Check every 5 minutes (300000 ms)
    const interval = setInterval(checkPlanNotifications, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const value: NotificationsContextType = {
    isInitialized: true,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}
