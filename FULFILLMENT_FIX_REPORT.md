# User Plans Fulfillment Flow - Complete Fix Report

**Date:** 2026-06-20  
**Status:** ✅ COMPLETE  
**Root Cause:** Missing `user_id` in fulfillment inserts + no transaction safety

---

## Executive Summary

The fulfillment flow had a critical data consistency issue: the `user_plans` table inserts were **not including `user_id`**, causing NOT NULL constraint violations in production. Additionally, order status was updated before user_plans insertion, creating orphaned "completed" orders if the plan insert failed.

**All issues are now fixed with:**
1. Schema updated to require `user_id` 
2. Both fulfillment routes now pass `order.userId`
3. Transaction safety ensures atomic operations

---

## Issues Identified

### Issue 1: Missing `user_id` Column in Schema
- **File:** `lib/db/src/schema/user_plans.ts`
- **Problem:** `userId` was optional (no `.notNull()`) and not required by schema validation
- **Impact:** Allows invalid inserts; production DB enforces NOT NULL, causing "null value in column user_id" errors

### Issue 2: Fulfillment Routes Don't Pass `user_id`
- **Files:** 
  - `artifacts/api-server/src/routes/admin-orders.ts` 
  - `artifacts/api-server/src/routes/payment.ts`
- **Problem:** Insert statements omitted `userId: order.userId`
- **Impact:** Runtime errors when order completion is triggered

### Issue 3: No Transaction Safety
- **Files:** Both routes
- **Problem:** Order status updated to "completed" BEFORE user_plans insert
- **Impact:** If user_plans insert fails → order appears completed with no plan (orphaned state)

---

## Changes Made

### A. Schema Fix - `lib/db/src/schema/user_plans.ts`

**Before:**
```typescript
userId: text("user_id").references(() => userProfilesTable.id),
```

**After:**
```typescript
userId: text("user_id").notNull().references(() => userProfilesTable.id),
```

**Change:** Added `.notNull()` to enforce the constraint at schema level, ensuring inserts always provide `user_id`.

---

### B. Admin Fulfillment Route - `artifacts/api-server/src/routes/admin-orders.ts`

**Line 103-127** - Wrapped fulfillment in transaction and added `userId`:

**Before:**
```typescript
const configUrl = `/api/orders/${order.id}/download`;
const ext = path.extname(server.originalName).toLowerCase();

await db.update(ordersTable)
  .set({ status: "completed", configUrl })
  .where(eq(ordersTable.id, order.id));

const existingPlan = await db.select().from(userPlansTable).where(eq(userPlansTable.orderId, order.id)).limit(1);
if (existingPlan.length === 0) {
  await db.insert(userPlansTable).values({
    id: randomUUID(),
    orderId: order.id,
    network: order.network,
    // ... missing userId
  });
}
```

**After:**
```typescript
const configUrl = `/api/orders/${order.id}/download`;
const ext = path.extname(server.originalName).toLowerCase();

await db.transaction(async (tx) => {
  await tx.update(ordersTable)
    .set({ status: "completed", configUrl })
    .where(eq(ordersTable.id, order.id));

  const existingPlan = await tx.select().from(userPlansTable).where(eq(userPlansTable.orderId, order.id)).limit(1);
  if (existingPlan.length === 0) {
    await tx.insert(userPlansTable).values({
      id: randomUUID(),
      userId: order.userId,  // ✅ ADDED
      orderId: order.id,
      network: order.network,
      planName: server.serverName,
      planType: server.planType,
      duration: order.duration,
      appType: order.appType,
      deviceId: order.deviceId,
      phone: order.phone,
      expiryDate: expiryFromDuration(order.duration),
      status: "active",
      configUrl,
      fileExtension: ext,
    });
  }
});
```

**Changes:**
- ✅ Wrapped in `db.transaction(async (tx) => { ... })`
- ✅ All DB operations use `tx` instead of `db`
- ✅ Added `userId: order.userId` to insert values

---

### C. Payment Auto-Fulfillment Route - `artifacts/api-server/src/routes/payment.ts`

**Line 81-105** - Wrapped fulfillment in transaction and added `userId`:

**Before:**
```typescript
const configUrl = `/api/orders/${orderId}/download`;
const ext = path.extname(server.originalName).toLowerCase();

await db.update(ordersTable)
  .set({ status: "completed", configUrl })
  .where(eq(ordersTable.id, orderId));

const existing = await db.select().from(userPlansTable).where(eq(userPlansTable.orderId, orderId)).limit(1);
if (existing.length === 0) {
  await db.insert(userPlansTable).values({
    id: randomUUID(),
    orderId,
    network: order.network,
    // ... missing userId
  });
}
```

**After:**
```typescript
const configUrl = `/api/orders/${orderId}/download`;
const ext = path.extname(server.originalName).toLowerCase();

await db.transaction(async (tx) => {
  await tx.update(ordersTable)
    .set({ status: "completed", configUrl })
    .where(eq(ordersTable.id, orderId));

  const existing = await tx.select().from(userPlansTable).where(eq(userPlansTable.orderId, orderId)).limit(1);
  if (existing.length === 0) {
    await tx.insert(userPlansTable).values({
      id: randomUUID(),
      userId: order.userId,  // ✅ ADDED
      orderId,
      network: order.network,
      planName: server.serverName,
      planType: server.planType,
      duration: order.duration,
      appType: order.appType,
      deviceId: order.deviceId,
      phone: order.phone,
      expiryDate: expiryFromDuration(order.duration),
      status: "active",
      configUrl,
      fileExtension: ext,
    });
  }
});
```

**Changes:**
- ✅ Wrapped in `db.transaction(async (tx) => { ... })`
- ✅ All DB operations use `tx` instead of `db`
- ✅ Added `userId: order.userId` to insert values

---

## Verification

### All insert(userPlansTable) Locations Found:
✅ `artifacts/api-server/src/routes/admin-orders.ts` - line ~112  
✅ `artifacts/api-server/src/routes/payment.ts` - line ~91  

**Both now include:**
- `userId: order.userId` ✅
- `orderId` ✅
- `network` ✅
- `planName` ✅
- `planType` ✅
- `duration` ✅
- `appType` ✅
- `deviceId` ✅
- `phone` ✅
- `expiryDate` ✅
- `status` ✅
- `configUrl` ✅
- `fileExtension` ✅

### Transaction Safety:
✅ Order status update moved INSIDE transaction  
✅ User plan insert is atomic with status update  
✅ If insert fails → entire transaction rolls back → order status remains unchanged  
✅ No orphaned "completed" orders possible  

### Supabase Schema Compatibility:
✅ Production DB already has `user_id` NOT NULL constraint  
✅ Schema now matches DB reality  
✅ All future inserts will include `user_id` from order data  

---

## Deployment Steps

1. **Push code changes** to main branch
2. **Run API server** - will auto-connect to Supabase with updated schema
3. **Test fulfillment paths:**
   - Admin fulfill endpoint: `/orders/{id}/fulfill` POST
   - Payment auto-fulfill on status check: `/status/{reference}` GET with `completed` status
4. **Monitor logs** for any transaction errors
5. **Verify** next orders complete without "null value in column user_id" errors

---

## Files Modified

| File | Change | Lines |
|------|--------|-------|
| `lib/db/src/schema/user_plans.ts` | Add `.notNull()` to userId | Line 8 |
| `artifacts/api-server/src/routes/admin-orders.ts` | Wrap in transaction + add userId | Lines 103-127 |
| `artifacts/api-server/src/routes/payment.ts` | Wrap in transaction + add userId | Lines 81-105 |

---

## Risk Assessment

**Risk Level:** 🟢 LOW

- ✅ Changes are isolated to fulfillment logic
- ✅ No changes to existing order or user data
- ✅ Transactions ensure no partial writes
- ✅ Backward compatible with existing orders
- ✅ userId is always available from order.userId (required field)

---

## Rollback Plan

If issues occur, revert the 3 files above. The production DB schema will accept NULLs temporarily, but new orders may still have issues. Recommend rolling back only if critical bugs are found, as the fix itself is low-risk.

