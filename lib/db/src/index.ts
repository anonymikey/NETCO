import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import { URL } from "url";

const { Pool } = pg;

// Determine which environment variable is being used
let dbUrl = "";
let selectedEnvVar = "";

if (process.env.POSTGRES_URL) {
  dbUrl = process.env.POSTGRES_URL;
  selectedEnvVar = "POSTGRES_URL";
} else if (process.env.SUPABASE_DATABASE_URL) {
  dbUrl = process.env.SUPABASE_DATABASE_URL;
  selectedEnvVar = "SUPABASE_DATABASE_URL";
} else if (process.env.DATABASE_URL) {
  dbUrl = process.env.DATABASE_URL;
  selectedEnvVar = "DATABASE_URL";
}

if (!dbUrl) {
  throw new Error(
    "POSTGRES_URL (or SUPABASE_DATABASE_URL or DATABASE_URL) must be set.",
  );
}

// Parse connection details for logging (without exposing password)
let maskedUrl = "";
let hostname = "unknown";
let port = "unknown";
try {
  const url = new URL(dbUrl);
  maskedUrl = dbUrl.replace(/:[^:@]+@/, ":****@");
  hostname = url.hostname;
  port = url.port || "5432";
} catch (e) {
  maskedUrl = "invalid-url-format";
}

console.log("[v0] ===== DATABASE INITIALIZATION =====");
console.log(`[v0] Environment Variable: ${selectedEnvVar}`);
console.log(`[v0] Connection String: ${maskedUrl}`);
console.log(`[v0] Hostname: ${hostname}`);
console.log(`[v0] Port: ${port}`);
console.log(`[v0] SSL Enabled: true`);
console.log(`[v0] SSL Reject Unauthorized: false`);
console.log("[v0] ===================================");

export const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

// Log connection events for debugging
pool.on("connect", () => console.log("[v0] Database pool: connection established"));
pool.on("error", (err) => console.error("[v0] Database pool error:", err.message));

export const db = drizzle(pool, { schema });

console.log("[v0] Database client initialized successfully");

export * from "./schema";
