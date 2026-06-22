import { createContext, ReactNode } from "react";

interface NotificationsContextType {
  isInitialized: boolean;
}

export const NotificationsContext = createContext<NotificationsContextType | null>(null);

interface NotificationsProviderProps {
  children: ReactNode;
}

export function NotificationsProvider({ children }: NotificationsProviderProps) {
  const value: NotificationsContextType = {
    isInitialized: true,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}
