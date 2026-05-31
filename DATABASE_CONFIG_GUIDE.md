# Database Configuration Guide - NETCO API Server

## EXACT ENVIRONMENT VARIABLE PRIORITY ORDER

Your codebase uses a consistent three-tier fallback system **across all database connection points**.

### Priority Order (Left to Right = Highest to Lowest):

```
1. POSTGRES_URL (PRIMARY)
   ↓ (if not set)
2. SUPABASE_DATABASE_URL (SECONDARY)
   ↓ (if not set)
3. DATABASE_URL (FALLBACK)
```

**In Code (Nullish Coalescing Pattern):**
```typescript
const dbUrl = process.env.POSTGRES_URL ?? process.env.SUPABASE_DATABASE_URL ?? process.env.DATABASE_URL;
```

---

## WHERE THIS CONFIGURATION IS USED

### 1. **Primary Runtime Connection** - `/lib/db/src/index.ts`
```typescript
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

export const db = drizzle(pool, { schema });
```

**When Used:** Server startup - connects to database for all API requests

---

### 2. **Drizzle Kit Configuration** - `/lib/db/drizzle.config.ts`
```typescript
const dbUrl = process.env.POSTGRES_URL || process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error("POSTGRES_URL (or SUPABASE_DATABASE_URL or DATABASE_URL) must be set");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl,
  },
  out: path.join(__dirname, "./migrations"),
});
```

**When Used:** Schema generation, Drizzle Studio, migrations introspection

---

### 3. **Database Migrations** - `/lib/db/scripts/migrate.ts`
```typescript
const dbUrl = process.env.POSTGRES_URL || process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("❌ Database URL not found. Set POSTGRES_URL, SUPABASE_DATABASE_URL, or DATABASE_URL");
  process.exit(1);
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});
```

**When Used:** Running migrations during deployment or manual schema updates

---

## RENDER DEPLOYMENT CONFIGURATION

### Which Variable to Set on Render?

**Use `POSTGRES_URL`** - It has highest priority and is the standard convention.

### How to Get Your Database URL

#### From Supabase (Recommended):

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your NETCO project
3. Click **Settings** → **Database**
4. Look for **Connection String**
5. Choose **Connection Pooling** (NOT direct connection)
6. Select **Psycopg2** as the driver
7. Copy the entire connection string

**Example:**
```
postgresql://postgres.[project-id]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require
```

---

## ENVIRONMENT VARIABLE COMPARISON

| Variable | Source | When to Use | Priority |
|----------|--------|------------|----------|
| `POSTGRES_URL` | Any PostgreSQL provider | Always preferred if available | 1st (Highest) |
| `SUPABASE_DATABASE_URL` | Supabase Dashboard | Fallback if POSTGRES_URL not available | 2nd |
| `DATABASE_URL` | Generic convention | Last resort fallback | 3rd (Lowest) |

---

## RENDER CONFIGURATION STEPS

### In Render Dashboard:

1. Go to your Web Service settings
2. Click **Environment**
3. Add new variable:
   - **Key:** `POSTGRES_URL`
   - **Value:** Paste your Supabase connection string
4. Click **Save**

That's it. The code will automatically use it in this priority order:
1. Check for `POSTGRES_URL` ✓ (finds it)
2. Returns and uses it
3. Never checks SUPABASE_DATABASE_URL or DATABASE_URL

---

## VERIFICATION

After setting POSTGRES_URL on Render, watch the logs during deployment:

```
[v0] Initializing database connection with Drizzle ORM...
[v0] Database pool connected
[v0] Database client initialized successfully
```

If you see these messages, the connection is working correctly.

---

## SSL CONFIGURATION

All three code locations use the same SSL configuration:

```typescript
ssl: { rejectUnauthorized: false }
```

This is required for Supabase connections over the internet (Render → Supabase).

---

## IMPORTANT NOTES

1. **All three locations use the same priority order** - Consistency across the codebase
2. **Nullish coalescing (`??`) vs logical OR (`||`)**:
   - `index.ts` uses `??` (checks for null/undefined)
   - `drizzle.config.ts` and `migrate.ts` use `||` (checks for falsy)
   - Both work the same for environment variables
3. **Connection pooling enabled** - Using Supabase pooling is required to avoid connection limits
4. **No manual migrations needed** - Drizzle automatically manages schema

---

## TROUBLESHOOTING

### "POSTGRES_URL not found" Error
- Verify you added the variable in Render's Environment section
- Check the connection string doesn't have typos
- Ensure it starts with `postgresql://`

### "Connection pooling connection limit reached"
- Using connection pooling URL instead of direct connection (you should be)
- Render limits connections to 100 per dyno type

### "SSL certificate problem"
- This is expected and handled by `rejectUnauthorized: false`
- Necessary for cloud-to-cloud connections

---

## SUMMARY FOR RENDER

- Set `POSTGRES_URL` in Render Environment Variables
- Use Supabase Connection Pooling URL as the value
- No other variables needed for database connectivity
- Render auto-restarts on env var change
- Migrations run automatically on app startup
- You're done!
