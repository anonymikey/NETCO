import { createContext, ReactNode, useEffect } from "react";
import { apiUrl } from "@/lib/api";
import { supabase } from "@/lib/supabase";

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
        // Wait for session to be available before making request
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        // Only proceed if we have a valid session
        if (sessionError || !session?.access_token) {
          console.debug("[v0] Skipping plan notifications check - no active session");
          return;
        }

        const response = await fetch(apiUrl("/api/notifications/check-plan-expiry"), {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          console.error("[v0] Failed to check plan notifications - status:", response.status);
        }
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
