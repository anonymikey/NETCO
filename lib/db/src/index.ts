import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const dbUrl = process.env.POSTGRES_URL ?? process.env.SUPABASE_DATABASE_URL ?? process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error(
    "POSTGRES_URL (or SUPABASE_DATABASE_URL or DATABASE_URL) must be set.",
  );
}

export const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

pool.on("error", (err) => console.error("[v0] Database pool error:", err.message));

export const db = drizzle(pool, { schema });

export * from "./schema";
