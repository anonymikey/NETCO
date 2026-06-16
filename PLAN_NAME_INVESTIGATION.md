# Investigation: `plan_name` NOT NULL Constraint Violation in Orders Table

## Problem Statement
When creating a paid order via `POST /api/orders`, the database throws:
```
null value in column "plan_name" of relation "orders" violates not-null constraint
```

## Root Cause Analysis

### The Schema Drift
The `orders` table in the Supabase database has a `plan_name` column that is NOT NULL, but:

1. **Original Migration (`0001_init.sql`)**: Defines `orders` table WITHOUT a `plan_name` column
2. **Drizzle Schema (`lib/db/src/schema/orders.ts`)**: Does NOT define `planName` field
3. **Actual Database**: HAS a `plan_name` column marked NOT NULL (schema drift)

### Why It's Wrong
- `plan_name` should ONLY exist in the `user_plans` table (where it belongs - tracks the server/plan name for a user's subscription)
- `plan_name` has no place in the `orders` table (which only tracks transaction details like phone, amount, device, etc.)
- The orders route never intended to set `planName` when creating an order

### Data Flow
```
User creates order → POST /api/orders
  ↓
INSERT into orders table with: userId, packageId, network, duration, appType, deviceId, phone, amount, status
  ↓
Database error: plan_name is NOT NULL but no value provided
  ↓
Request fails
```

### Where `plan_name` Should Come From
`plan_name` is derived from the config server's `serverName` and is created AFTER payment completion:

1. **Free orders** (`POST /api/orders/free`): ✅ Correctly inserts into `user_plans` with `planName: freeServer.serverName`
2. **Paid orders** (payment webhook → `POST /api/payment/status/:reference`): 
   - Calls `autoFulfillOrder()` which inserts into `user_plans` with `planName: server.serverName`
   - Never touches the `orders` table `planName` (because it doesn't exist in schema)

## Solution

### Remove the Phantom Column
The `plan_name` column was added to the `orders` table by mistake (likely through a manual Supabase migration or UI operation that didn't sync with the codebase).

**Fix:** Drop the column from orders table via migration 0005.

### Why This is Correct
- ✅ `orders` table stays clean with only transaction metadata
- ✅ `user_plans` table retains `plan_name` (the only place it belongs)
- ✅ Drizzle schema and database will be in sync
- ✅ No code changes needed - routes already work correctly

### Migration File
`lib/db/migrations/0005_remove_plan_name_from_orders.sql`:
```sql
ALTER TABLE orders
DROP COLUMN IF EXISTS plan_name;
```

## Files Reference

| File | Role | Status |
|------|------|--------|
| `lib/db/migrations/0001_init.sql` | Creates orders without plan_name | ✅ Correct |
| `lib/db/migrations/0005_remove_plan_name_from_orders.sql` | Removes the drift | 🆕 Created |
| `lib/db/src/schema/orders.ts` | Drizzle schema (no planName field) | ✅ Correct |
| `artifacts/api-server/src/routes/orders.ts` | POST /api/orders route (doesn't set planName) | ✅ Correct |
| `artifacts/api-server/src/routes/payment.ts` | Payment webhook (inserts into user_plans with planName) | ✅ Correct |
| `lib/db/src/schema/user_plans.ts` | Has planName field | ✅ Correct |

## Next Steps
1. Run migration 0005 in Supabase to drop the column
2. Test POST /api/orders again - should succeed
3. Verify paid order flow still works correctly
