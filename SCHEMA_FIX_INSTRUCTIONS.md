# Schema Fix Instructions - user_plans Table

## Problem Summary

The fulfillment is failing because the Supabase `user_plans` table has the **wrong schema**. 

**Error shown:** `null value in column "duration_days" violates not-null constraint`

**Root cause:** The code tries to insert columns that don't exist in the database, and the database has different columns that the code doesn't populate.

---

## Audit Results - Legacy Columns

All legacy columns in the Supabase database are **NOT USED** anywhere in the codebase:

### 1. `duration_days` - NOT USED ✅
- **Search:** `grep -r "duration_days" --include="*.ts"`
- **Result:** ZERO references in actual code
- **Conclusion:** Code sends `duration` field, not `duration_days`
- **Safe to drop:** YES

### 2. `expires_at` - NOT USED ✅
- **Search:** `grep -r "expires_at" --include="*.ts"`
- **Result:** ZERO references in actual code
- **Conclusion:** Code sends `expiry_date` field, not `expires_at`
- **Safe to drop:** YES

### 3. `activated_at` - NOT USED ✅
- **Search:** `grep -r "activated_at" --include="*.ts"`
- **Result:** ZERO references in actual code
- **Conclusion:** Never populated or used
- **Safe to drop:** YES

### 4. `updated_at` - NOT USED ✅
- **Search:** `grep -r "updated_at" --include="*.ts"`
- **Result:** ZERO references in actual code
- **Conclusion:** Only `created_at` is used, no update tracking
- **Safe to drop:** YES

---

## What Needs to Happen

The `user_plans` table needs to be **completely recreated** with the correct schema.

### Current Table (Wrong - ~11 columns)
```
id, user_id (nullable), duration_days, activated_at, expires_at, 
status, created_at, updated_at, order_id, plan_type, plan_name
```

### New Table (Correct - 16 columns)
```
id, user_id (NOT NULL), order_id (NOT NULL), network (NOT NULL), 
plan_name (NOT NULL), plan_type (NOT NULL), duration (NOT NULL), 
app_type (NOT NULL), device_id (NOT NULL), phone (NOT NULL), 
speed, expiry_date (NOT NULL), status, config_url, file_extension, 
created_at (NOT NULL)
```

---

## How to Fix

### Step 1: Execute SQL Migration in Supabase

Go to **Supabase Dashboard → SQL Editor** and run this:

```sql
-- Drop the mismatched table
DROP TABLE IF EXISTS user_plans CASCADE;

-- Recreate with correct schema
CREATE TABLE user_plans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_profiles(id),
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

-- Create indices
CREATE INDEX idx_user_plans_order_id ON user_plans(order_id);
CREATE INDEX idx_user_plans_status ON user_plans(status);
CREATE INDEX idx_user_plans_user_id ON user_plans(user_id);
```

**Or use the pre-made file:**
- File: `/SUPABASE_FIX.sql` in this project

### Step 2: Verify the Schema

Run this in Supabase SQL Editor to confirm:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_plans' 
ORDER BY ordinal_position;
```

**You should see exactly these 16 columns:**
1. id (TEXT, NOT NULL)
2. user_id (TEXT, NOT NULL)
3. order_id (TEXT, NOT NULL)
4. network (TEXT, NOT NULL)
5. plan_name (TEXT, NOT NULL)
6. plan_type (TEXT, NOT NULL)
7. duration (TEXT, NOT NULL)
8. app_type (TEXT, NOT NULL)
9. device_id (TEXT, NOT NULL)
10. phone (TEXT, NOT NULL)
11. speed (TEXT, nullable)
12. expiry_date (TIMESTAMP, NOT NULL)
13. status (TEXT, NOT NULL)
14. config_url (TEXT, nullable)
15. file_extension (TEXT, nullable)
16. created_at (TIMESTAMP, NOT NULL)

### Step 3: Restart API Server

The API server will auto-reconnect to the database.

### Step 4: Test Fulfillment

Try the fulfill flow again:
1. Admin panel → Fulfill Order
2. Select a config server
3. Click "Deliver Config"
4. Should succeed without "null value" errors

---

## Why This Works

1. ✅ **Drizzle schema is already correct** - No code changes needed
2. ✅ **All routes already send correct fields** - admin-orders.ts, payment.ts
3. ✅ **Table is empty** - No data loss by dropping and recreating
4. ✅ **All legacy columns are unused** - Safe to remove them
5. ✅ **Matches production expectations** - Already defined in Drizzle ORM

---

## No Code Changes Required

The code (from previous fixes) is already correct:
- ✅ `userId: order.userId` is already being sent
- ✅ `duration`, `expiry_date`, `network`, etc. are all correct
- ✅ Transaction safety is already in place

This is purely a **database schema reconciliation** issue.

---

## Files Reference

- **Audit Report:** `CRITICAL_SCHEMA_AUDIT.md`
- **SQL Migration:** `SUPABASE_FIX.sql`
- **Drizzle Schema:** `lib/db/src/schema/user_plans.ts`
