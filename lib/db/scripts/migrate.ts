import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import path from "path";
import { URL } from "url";

const { Pool } = pg;

async function runMigrations() {
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
    console.error("❌ Database URL not found. Set POSTGRES_URL, SUPABASE_DATABASE_URL, or DATABASE_URL");
    process.exit(1);
  }

  // Parse connection details for logging
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

  console.log("[v0] ===== MIGRATION INITIALIZATION =====");
  console.log(`[v0] Environment Variable: ${selectedEnvVar}`);
  console.log(`[v0] Connection String: ${maskedUrl}`);
  console.log(`[v0] Hostname: ${hostname}`);
  console.log(`[v0] Port: ${port}`);
  console.log(`[v0] SSL Enabled: true`);
  console.log("[v0] ========================================");
  console.log("[v0] Starting database migrations...");

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const db = drizzle(pool);

    await migrate(db, { migrationsFolder: path.join(__dirname, "../migrations") });

    console.log("✅ Migrations completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
