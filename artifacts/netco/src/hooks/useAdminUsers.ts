import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface AdminUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  bio?: string;
  ordersCount: number;
  activePlansCount: number;
  totalSpent: number;
  notificationsCount: number;
  status: "active" | "inactive" | "suspended";
  joinDate: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
}

export interface UserDevices {
  id: string;
  name: string;
  browser: string;
  os: string;
  lastActive: string;
}

export interface UserLoginHistory {
  id: string;
  browser: string;
  device: string;
  status: "success" | "failed";
  date: string;
  ipAddress?: string;
}

export interface UserPlan {
  id: string;
  name: string;
  network: string;
  expiryDate: string;
  status: "active" | "expired" | "cancelled";
}

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user profiles with their associated data
      const { data: profiles, error: profileError } = await supabase
        .from("user_profiles")
        .select("*");

      if (profileError) throw profileError;

      // Enrich profiles with order and plan data
      const enrichedUsers = await Promise.all(
        (profiles || []).map(async (profile) => {
          // Get orders count and total spent
          const { data: orders, error: ordersError } = await supabase
            .from("orders")
            .select("amount, status")
            .eq("user_id", profile.id);

          // Get active plans count
          const { data: plans, error: plansError } = await supabase
            .from("user_plans")
            .select("id")
            .eq("user_id", profile.id)
            .eq("status", "active");

          // Get notification count
          const { data: notifications, error: notifError } = await supabase
            .from("notifications")
            .select("id")
            .eq("user_id", profile.id)
            .eq("is_read", false);

          const ordersCount = orders?.length || 0;
          const totalSpent = orders?.reduce((sum, o) => sum + (o.amount || 0), 0) || 0;
          const activePlansCount = plans?.length || 0;
          const notificationsCount = notifications?.length || 0;

          return {
            id: profile?.id || "",
            username: profile?.username || "user",
            fullName: profile?.full_name || profile?.username || "User",
            email: profile?.email || "No email",
            phone: profile?.phone || "No phone",
            country: profile?.country || "Not specified",
            bio: profile?.bio || undefined,
            ordersCount: ordersCount || 0,
            activePlansCount: activePlansCount || 0,
            totalSpent: totalSpent || 0,
            notificationsCount: notificationsCount || 0,
            status: (profile?.status || "active") as "active" | "inactive" | "suspended",
            joinDate: profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "Unknown",
            emailVerified: profile?.email_verified ?? false,
            phoneVerified: profile?.phone_verified ?? false,
            twoFactorEnabled: profile?.two_factor_enabled ?? false,
          };
        })
      );

      setUsers(enrichedUsers);
    } catch (err) {
      console.error("[v0] Error fetching users:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  return { users, loading, error, refetch: fetchUsers };
}

export function useUserDevices(userId: string | null | undefined) {
  const [devices, setDevices] = useState<UserDevices[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchDevices = async () => {
      try {
        const { data, error } = await supabase
          .from("devices")
          .select("id, name, browser, os, last_active")
          .eq("user_id", userId)
          .order("last_active", { ascending: false });

        if (error) throw error;

        setDevices(
          (data || []).map((d) => ({
            id: d.id,
            name: d.name,
            browser: d.browser,
            os: d.os,
            lastActive: formatTimeAgo(new Date(d.last_active)),
          }))
        );
      } catch (err) {
        console.error("[v0] Error fetching devices:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, [userId]);

  return { devices, loading };
}

export function useUserLoginHistory(userId: string | null | undefined) {
  const [history, setHistory] = useState<UserLoginHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchHistory = async () => {
      try {
        const { data, error } = await supabase
          .from("login_history")
          .select("id, browser, device, status, created_at, ip_address")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) throw error;

        setHistory(
          (data || []).map((h) => ({
            id: h.id,
            browser: h.browser,
            device: h.device,
            status: h.status,
            date: formatTimeAgo(new Date(h.created_at)),
            ipAddress: h.ip_address,
          }))
        );
      } catch (err) {
        console.error("[v0] Error fetching login history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [userId]);

  return { history, loading };
}

export function useUserPlans(userId: string | null | undefined) {
  const [plans, setPlans] = useState<UserPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchPlans = async () => {
      try {
        const { data, error } = await supabase
          .from("user_plans")
          .select("id, plan_name, network, expiry_date, status")
          .eq("user_id", userId)
          .order("expiry_date", { ascending: false });

        if (error) throw error;

        setPlans(
          (data || []).map((p) => ({
            id: p.id,
            name: p.plan_name,
            network: p.network,
            expiryDate: new Date(p.expiry_date).toLocaleDateString(),
            status: p.status,
          }))
        );
      } catch (err) {
        console.error("[v0] Error fetching plans:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [userId]);

  return { plans, loading };
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}
