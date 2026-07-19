import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { authenticatedFetch } from "@/lib/auth-helpers";

export interface UserPlan {
  id: string;
  userId: string;
  orderId: string;
  network: string;
  planName: string;
  planType: string;
  duration: string;
  appType: string;
  deviceId: string;
  phone: string;
  expiryDate: string;
  createdAt: string;
  status: "active" | "expired" | "cancelled" | "refunded";
  configUrl: string | null;
  fileExtension: string | null;
  speed: string | null;
  instructions: string | null;
}

export interface PlanStats {
  activePlans: number;
  expiringPlans: number;
  expiredPlans: number;
  totalPurchased: number;
}

export interface PlanWithStatus extends UserPlan {
  timeRemaining: number; // in milliseconds
  isDeletable: boolean;
  colorState: "green" | "yellow" | "orange" | "red" | "grey";
  daysUntilAutoDelete?: number; // For expired plans
}

export function useUserPlans(userId: string | undefined) {
  const [plans, setPlans] = useState<PlanWithStatus[]>([]);
  const [stats, setStats] = useState<PlanStats>({
    activePlans: 0,
    expiringPlans: 0,
    expiredPlans: 0,
    totalPurchased: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<any>(null);

  // Helper function to calculate plan status and color
  const calculatePlanStatus = useCallback((plan: UserPlan): PlanWithStatus => {
    const now = new Date().getTime();
    const expiryTime = new Date(plan.expiryDate).getTime();
    const timeRemaining = expiryTime - now;

    // Determine if plan is expired
    const isExpired = timeRemaining <= 0;

    // Calculate color state based on time remaining
    let colorState: "green" | "yellow" | "orange" | "red" | "grey" = "green";
    if (isExpired) {
      colorState = "grey";
    } else if (timeRemaining <= 6 * 60 * 60 * 1000) {
      // ≤6 hours
      colorState = "red";
    } else if (timeRemaining <= 24 * 60 * 60 * 1000) {
      // ≤24 hours
      colorState = "orange";
    } else if (timeRemaining <= 3 * 24 * 60 * 60 * 1000) {
      // ≤3 days
      colorState = "yellow";
    }

    // Determine if plan is deletable (expired, cancelled, or refunded)
    const isDeletable = isExpired || plan.status === "cancelled" || plan.status === "refunded";

    // Calculate days until auto-delete for expired plans (2 days after expiry)
    let daysUntilAutoDelete: number | undefined;
    if (isExpired) {
      const createdTime = new Date(plan.createdAt).getTime();
      const expiryDate = new Date(plan.expiryDate);
      const autoDeleteDate = new Date(expiryDate.getTime() + 2 * 24 * 60 * 60 * 1000);
      const daysRemaining = (autoDeleteDate.getTime() - now) / (24 * 60 * 60 * 1000);
      daysUntilAutoDelete = Math.max(0, Math.ceil(daysRemaining));
    }

    return {
      ...plan,
      timeRemaining,
      colorState,
      isDeletable,
      daysUntilAutoDelete,
    };
  }, []);

  // Fetch user plans from API
  const fetchPlans = useCallback(async () => {
    if (!userId) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await authenticatedFetch("/api/plans/user-plans");

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Your session has expired. Please log in again.");
        }
        throw new Error("Failed to fetch plans");
      }

      const rawPlans: UserPlan[] = await response.json();
      const enhancedPlans = rawPlans.map(calculatePlanStatus);

      setPlans(enhancedPlans);
      calculateStats(enhancedPlans);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch plans";
      setError(message);
      console.error("[v0] Error fetching plans:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, calculatePlanStatus]);

  // Calculate statistics from plans
  const calculateStats = useCallback((plansData: PlanWithStatus[]) => {
    const now = new Date().getTime();

    const activePlans = plansData.filter((p) => {
      const expiryTime = new Date(p.expiryDate).getTime();
      return expiryTime > now && p.status === "active";
    }).length;

    const expiredPlans = plansData.filter((p) => {
      const expiryTime = new Date(p.expiryDate).getTime();
      return expiryTime <= now;
    }).length;

    const expiringPlans = plansData.filter((p) => {
      const expiryTime = new Date(p.expiryDate).getTime();
      const timeRemaining = expiryTime - now;
      return timeRemaining > 0 && timeRemaining <= 3 * 24 * 60 * 60 * 1000 && p.status === "active";
    }).length;

    setStats({
      activePlans,
      expiringPlans,
      expiredPlans,
      totalPurchased: plansData.length,
    });
  }, []);

  // Set up Supabase real-time subscription
  const setupRealtimeSubscription = useCallback(() => {
    if (!userId) return;

    // Subscribe to changes in user_plans table
    const subscription = supabase
      .channel(`user_plans_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT", // New plan added
          schema: "public",
          table: "user_plans",
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          console.log("[v0] Plan created/approved:", payload);
          // Fetch fresh data when new plan is inserted
          await fetchPlans();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE", // Plan status changed (renewed, expired, etc.)
          schema: "public",
          table: "user_plans",
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          console.log("[v0] Plan updated:", payload);
          // Fetch fresh data when plan is updated
          await fetchPlans();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE", // Plan deleted
          schema: "public",
          table: "user_plans",
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          console.log("[v0] Plan deleted:", payload);
          // Fetch fresh data when plan is deleted
          await fetchPlans();
        }
      )
      .subscribe((status) => {
        console.log("[v0] Realtime subscription status:", status);
      });

    subscriptionRef.current = subscription;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [userId, fetchPlans]);

  // Initial fetch and real-time setup
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetchPlans();
    const unsubscribe = setupRealtimeSubscription();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [userId, fetchPlans, setupRealtimeSubscription]);

  // Update countdown timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      setPlans((prevPlans) =>
        prevPlans.map((plan) => {
          const now = new Date().getTime();
          const expiryTime = new Date(plan.expiryDate).getTime();
          const timeRemaining = expiryTime - now;

          // Recalculate color state on each tick
          let colorState: "green" | "yellow" | "orange" | "red" | "grey" = "green";
          if (timeRemaining <= 0) {
            colorState = "grey";
          } else if (timeRemaining <= 6 * 60 * 60 * 1000) {
            colorState = "red";
          } else if (timeRemaining <= 24 * 60 * 60 * 1000) {
            colorState = "orange";
          } else if (timeRemaining <= 3 * 24 * 60 * 60 * 1000) {
            colorState = "yellow";
          }

          return {
            ...plan,
            timeRemaining,
            colorState,
          };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Delete handler
  const deletePlan = useCallback(
    async (planId: string) => {
      try {
        const response = await authenticatedFetch(`/api/plans/${planId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Your session has expired. Please log in again.");
          }
          if (response.status === 403) {
            const errorData = await response.json();
            throw new Error(errorData.error || "You cannot delete this plan");
          }
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to delete plan");
        }

        // Optimistically remove from state
        setPlans((prevPlans) => prevPlans.filter((p) => p.id !== planId));
        calculateStats(plans.filter((p) => p.id !== planId));

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delete plan";
        setError(message);
        console.error("[v0] Error deleting plan:", err);
        return false;
      }
    },
    [plans, calculateStats]
  );

  // Refetch handler
  const refetch = useCallback(async () => {
    await fetchPlans();
  }, [fetchPlans]);

  return {
    plans,
    stats,
    loading,
    error,
    deletePlan,
    refetch,
  };
}
