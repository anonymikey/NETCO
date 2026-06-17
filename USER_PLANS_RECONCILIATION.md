# User Plans Schema Reconciliation Report

## Executive Summary

The Supabase `user_plans` table has a completely different schema than the Drizzle ORM definition. This causes `INSERT` operations to fail because the code attempts to populate columns that don't exist.

**Status:** Table is empty (0 rows) → Safe to drop and recreate

---

## Schema Comparison

### Drizzle ORM Schema (Source of Truth)
**File:** `lib/db/src/schema/user_plans.ts`

```
id (TEXT, PK)
├─ order_id (TEXT, NOT NULL)          ← Foreign key to orders
├─ network (TEXT, NOT NULL)
├─ plan_name (TEXT, NOT NULL)
├─ plan_type (TEXT, NOT NULL)
├─ duration (TEXT, NOT NULL)
├─ app_type (TEXT, NOT NULL)
├─ device_id (TEXT, NOT NULL)
├─ phone (TEXT, NOT NULL)
├─ speed (TEXT, nullable)
├─ expiry_date (TIMESTAMP, NOT NULL)
├─ status (TEXT, NOT NULL, DEFAULT 'active')
├─ config_url (TEXT, nullable)
├─ file_extension (TEXT, nullable)
└─ created_at (TIMESTAMP, NOT NULL, DEFAULT NOW())
```

**Total: 15 columns**

### Current Supabase Schema
```
id
├─ user_id
├─ plan_type
├─ plan_name
├─ duration_days
├─ status
├─ activated_at
├─ expires_at
├─ created_at
└─ updated_at
```

**Total: 10 columns**

---

## Gap Analysis

### Critical Missing Columns (All used by routes)

| Column | Drizzle Name | Used By | Impact |
|--------|--------------|---------|--------|
| `order_id` | `orderId` | orders.ts, payment.ts, admin-orders.ts | **BLOCKING** — Inserted by all 3 routes |
| `network` | `network` | orders.ts, payment.ts, admin-orders.ts | **BLOCKING** — Inserted by all 3 routes |
| `app_type` | `appType` | orders.ts, payment.ts, admin-orders.ts | **BLOCKING** — Inserted by all 3 routes |
| `device_id` | `deviceId` | orders.ts, payment.ts, admin-orders.ts | **BLOCKING** — Inserted by all 3 routes |
| `phone` | `phone` | orders.ts, payment.ts, admin-orders.ts | **BLOCKING** — Inserted by all 3 routes |
| `duration` | `duration` | orders.ts, payment.ts, admin-orders.ts | **BLOCKING** — Stored as "duration", not "duration_days" |
| `expiry_date` | `expiryDate` | orders.ts, payment.ts, admin-orders.ts | **BLOCKING** — Stored as "expiry_date", not "expires_at" |
| `config_url` | `configUrl` | orders.ts, payment.ts, admin-orders.ts | **BLOCKING** — Used for config download |
| `file_extension` | `fileExtension` | orders.ts, payment.ts, admin-orders.ts | **BLOCKING** — Used for file download |

### Optional Missing Columns

| Column | Drizzle Name | Used By | Impact |
|--------|--------------|---------|--------|
| `speed` | `speed` | Not set by any route | Low priority (nullable) |

### Extra Columns in Supabase (Not in Drizzle/code)

| Column | Problem |
|--------|---------|
| `user_id` | Not defined in Drizzle schema; routes don't populate it |
| `activated_at` | Not defined in Drizzle schema; routes don't populate it |
| `updated_at` | Not defined in Drizzle schema (only `created_at` exists) |

---

## Evidence: What Routes Actually Insert

### orders.ts (POST /api/orders/free) - Lines 137-151
```typescript
await db.insert(userPlansTable).values({
  id: randomUUID(),
  orderId,              // ← order_id
  network,              // ← network
  planName,             // ← plan_name
  planType,             // ← plan_type
  duration,             // ← duration (NOT duration_days)
  appType,              // ← app_type
  deviceId,             // ← device_id
  phone,                // ← phone
  expiryDate,           // ← expiry_date (NOT expires_at)
  status: "active",     // ← status
  configUrl,            // ← config_url
  fileExtension,        // ← file_extension
});
```

### payment.ts (POST /api/payment/verify-callback) - Lines 87-101
Same fields as orders.ts

### admin-orders.ts (POST /api/admin/orders/:id/fulfill) - Lines 108-122
Same fields as orders.ts

---

## Root Cause

The Supabase table was created with a **completely different schema** than what the code expects. Possible causes:

1. Someone manually created the table in Supabase without using the migration
2. An older migration from a different version was applied
3. The schema was designed for a different application version

---

## Solution

### Migration File
**File:** `lib/db/migrations/0006_reconcile_user_plans_schema.sql`

**Action:** DROP and RECREATE the user_plans table

**Rationale:**
- ✅ Table is empty (0 rows) — safe to drop
- ✅ Ensures schema perfectly matches Drizzle definition
- ✅ All 15 columns present with correct names and types
- ✅ All indices created for query performance
- ✅ Default values and constraints match Drizzle

**SQL:**
```sql
DROP TABLE IF EXISTS user_plans CASCADE;

CREATE TABLE user_plans (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  network TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  plan_type TEXT NOT NULL,
  duration TEXT NOT NULL,
  app_type TEXT NOT NULL,
  device_id TEXT NOT NULL,
  phone TEXT NOT NULL,
  speed TEXT,
  expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  config_url TEXT,
  file_extension TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_plans_order_id ON user_plans(order_id);
CREATE INDEX idx_user_plans_status ON user_plans(status);
```

---

## Deployment Steps

1. **Run migration** in Supabase:
   ```bash
   psql -h db.supabase.co -U postgres -d postgres -f lib/db/migrations/0006_reconcile_user_plans_schema.sql
   ```
   Or execute via Supabase SQL Editor

2. **Verify table structure:**
   ```sql
   \d user_plans;
   ```

3. **Redeploy API server** (no code changes needed)

4. **Test free config download** → Should now succeed without INSERT errors

---

## Verification Checklist

After applying migration:

- [ ] Table `user_plans` exists with 15 columns
- [ ] All columns have correct names: `order_id`, `network`, `plan_name`, etc.
- [ ] `order_id` is NOT NULL
- [ ] `status` has DEFAULT 'active'
- [ ] `created_at` has DEFAULT NOW()
- [ ] Indices exist: `idx_user_plans_order_id`, `idx_user_plans_status`
- [ ] POST /api/orders/free succeeds
- [ ] POST /api/payment/verify-callback succeeds
- [ ] POST /api/admin/orders/:id/fulfill succeeds

---

## Why This is the Correct Solution

1. ✅ **Drizzle schema is correct** — No changes needed to code
2. ✅ **All routes are correct** — They properly populate all fields
3. ❌ **Database schema is wrong** — Has completely different columns
4. ✅ **Table is empty** — No data loss by dropping and recreating
5. ✅ **Full reconciliation** — Not an incremental fix; complete alignment

After this migration, the database schema will perfectly match what the application code expects.
