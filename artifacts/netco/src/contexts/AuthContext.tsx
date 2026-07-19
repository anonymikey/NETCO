import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, isAdmin } from "@/lib/supabase";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isAdminUser: boolean;
  loading: boolean;
  sessionExpired: boolean;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  isAdminUser: false,
  loading: true,
  sessionExpired: false,
  signOut: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [expiryTimeoutId, setExpiryTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Helper function to set session expiry timer
  const scheduleSessionExpiry = (session: Session | null) => {
    // Clear any existing timeout
    if (expiryTimeoutId) {
      clearTimeout(expiryTimeoutId);
    }

    if (!session?.expires_at) {
      return;
    }

    // Calculate time until expiry (with 1-minute buffer before actual expiry)
    const expiresAt = session.expires_at * 1000; // Convert to milliseconds
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now - 60000; // 1-minute buffer

    if (timeUntilExpiry > 0) {
      const timeoutId = setTimeout(() => {
        setSessionExpired(true);
        // Auto-logout when session expires
        supabase.auth.signOut();
      }, timeUntilExpiry);

      setExpiryTimeoutId(timeoutId);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSessionExpired(false);
      scheduleSessionExpiry(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setSessionExpired(false);
        scheduleSessionExpiry(session);
      } else {
        setSessionExpired(false);
        if (expiryTimeoutId) {
          clearTimeout(expiryTimeoutId);
        }
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      if (expiryTimeoutId) {
        clearTimeout(expiryTimeoutId);
      }
    };
  }, []);

  const signOut = async () => {
    if (expiryTimeoutId) {
      clearTimeout(expiryTimeoutId);
    }
    await supabase.auth.signOut();
  };

  const logout = async () => {
    if (expiryTimeoutId) {
      clearTimeout(expiryTimeoutId);
    }
    await supabase.auth.signOut();
  };

  const user = session?.user ?? null;

  return (
    <AuthContext.Provider value={{ session, user, isAdminUser: isAdmin(user?.email), loading, sessionExpired, signOut, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
