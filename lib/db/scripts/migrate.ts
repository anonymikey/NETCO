import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import path from "path";

const { Pool } = pg;

async function runMigrations() {
  const dbUrl = process.env.POSTGRES_URL || process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error("❌ Database URL not found. Set POSTGRES_URL, SUPABASE_DATABASE_URL, or DATABASE_URL");
    process.exit(1);
  }

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
