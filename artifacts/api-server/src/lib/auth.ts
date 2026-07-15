import { createClient } from "@supabase/supabase-js";
import type { Request, Response, NextFunction } from "express";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * Express middleware to verify Supabase JWT tokens
 * Extracts user ID from JWT and adds to req.userId
 * Returns 401 for missing or invalid tokens
 */
export async function verifyJWT(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Missing or invalid Authorization header" });
      return;
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix

    // Verify token with Supabase using getUser() method
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error("[v0] JWT verification failed:", error);
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    // Attach user ID to request for downstream handlers
    (req as any).userId = user.id;
    next();
  } catch (err) {
    console.error("[v0] Auth middleware error:", err);
    res.status(401).json({ error: "Authentication failed" });
  }
}

/**
 * Middleware to check if user owns a specific plan
 * Must be used after verifyJWT middleware
 */
export async function checkPlanOwnership(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    const planId = req.params.planId;

    if (!userId) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    if (!planId) {
      res.status(400).json({ error: "Plan ID is required" });
      return;
    }

    // Import here to avoid circular dependency
    const { db: dbModule, userPlansTable: table } = await import("@workspace/db");
    const { eq: eqFunc, and: andFunc } = await import("drizzle-orm");

    // First check if plan exists for this user
    const [plan] = await dbModule
      .select()
      .from(table)
      .where(andFunc(eqFunc(table.id, planId), eqFunc(table.userId, userId)));

    if (!plan) {
      // Check if plan exists for any user to distinguish 404 from 403
      const [anyPlan] = await dbModule
        .select()
        .from(table)
        .where(eqFunc(table.id, planId));
      
      if (!anyPlan) {
        res.status(404).json({ error: "Plan not found" });
      } else {
        res.status(403).json({ error: "You do not have access to this plan" });
      }
      return;
    }

    // Attach plan to request for downstream handlers
    (req as any).plan = plan;
    next();
  } catch (err) {
    console.error("[v0] Ownership check error:", err);
    res.status(500).json({ error: "Authorization check failed" });
  }
}
