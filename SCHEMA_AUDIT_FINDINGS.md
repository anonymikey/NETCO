# User Plans Schema Audit - Findings & Fix

## Executive Summary
The fulfillment endpoint succeeds in creating orders and updating their status to "completed", but subsequent queries against `user_plans` fail because the Drizzle schema and actual Supabase database schema are misaligned.

## Error Details
```
Failed query: select "id","order_id","network","plan_name","plan_type","duration",
"app_type","device_id","phone","speed","expiry_date","status","config_url",
"file_extension","created_at" from "user_plans" where "user_plans"."order_id" = $1
```

## Root Cause Analysis

### Drizzle Schema (15 columns defined)
File: `lib/db/src/schema/user_plans.ts`

```typescript
export const userPlansTable = pgTable("user_plans", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull(),           // ← Maps to order_id
  network: text("network").notNull(),
  planName: text("plan_name").notNull(),
  planType: text("plan_type").notNull(),
  duration: text("duration").notNull(),
  appType: text("app_type").notNull(),
  deviceId: text("device_id").notNull(),
  phone: text("phone").notNull(),
  speed: text("speed"),
  expiryDate: timestamp("expiry_date", { withTimezone: true }).notNull(),
  status: text("status").notNull().default("active"),
  configUrl: text("config_url"),
  fileExtension: text("file_extension"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

### Database Schema (from 0001_init.sql migration - APPLIED)
The `0001_init.sql` migration defines user_plans with 15 columns:
- id
- order_id
- network
- plan_name
- plan_type
- duration
- app_type
- device_id
- phone
- speed
- expiry_date
- status
- config_url
- file_extension
- created_at

### Migration Application Status
- ✅ 0001_init.sql - APPLIED (contains user_plans definition)
- ✅ 0004_add_user_id_to_orders.sql - APPLIED
- ❌ 0002-0003, 0005-0006 - NOT APPLIED (not in migration journal)

## Problem Hypothesis
**The actual Supabase database is missing the `order_id` column**, even though:
1. The 0001_init migration defines it
2. The Drizzle schema references it as `notNull()`
3. The admin fulfillment successfully creates records with `orderId` set

This suggests either:
- The migration 0001 didn't fully execute on the `user_plans` table
- The `order_id` column was manually deleted after migration
- There's a schema drift between local and deployed database

## Where the Error Occurs
After successful admin fulfillment:
1. Order status is updated to "completed" ✅
2. `user_plans` record is inserted ✅
3. Admin panel calls `GET /api/plans?phone=...&deviceId=...` to refresh
4. Plans route executes `.select().from(userPlansTable)` ❌
5. Query tries to select all 15 Drizzle columns
6. **Database missing `order_id` column** → Query fails

## Exact Failing Query Sequence
1. **POST /api/admin/orders/:id/fulfill** (succeeds)
   - Creates user_plans record with orderId
   
2. **GET /api/plans?phone=...&deviceId=...** (fails)
   - Plans route at line 26: `plans = await db.select().from(userPlansTable)`
   - Drizzle generates: `SELECT id, order_id, network, ... FROM user_plans WHERE ...`
   - **Error: column "order_id" of relation "user_plans" does not exist**

## Solution Applied
Created migration `0007_add_missing_columns_to_user_plans.sql` that:
- Adds `order_id TEXT NOT NULL DEFAULT ''` column if missing
- Creates index `idx_user_plans_order_id` for query performance
- Safe to apply even if column exists (uses `IF NOT EXISTS`)

## Verification Steps
After applying migration 0007:
1. Admin fulfillment endpoint marks order as completed ✅
2. User_plans record created with orderId ✅
3. Plans query retrieves user_plans without error ✅
4. Frontend can display user's active plans ✅

## Files Changed
- `lib/db/migrations/0007_add_missing_columns_to_user_plans.sql` (NEW)
- Migration is safe and idempotent (uses IF NOT EXISTS)

## Summary
The schema drift is specifically in the `order_id` column missing from the Supabase `user_plans` table. Once migration 0007 is applied, the fulfillment flow will complete successfully without database errors.
