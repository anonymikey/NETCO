# User Plans Schema Audit Report

## Executive Summary
**Finding:** Critical schema mismatch between Drizzle ORM definition and actual Supabase database.
- Drizzle schema: 15 columns
- Actual database: 11 columns
- Missing columns: `network`, `app_type`, `device_id`, `phone`, `config_url`, `file_extension`
- Extra columns in DB: `user_id`, `duration_days`, `activated_at`, `expires_at`, `updated_at`

**Root Cause:** Migration 0001_init.sql defines the correct 15-column schema, but Supabase has a different 11-column schema (likely from a previous version or incomplete migration).

---

## Drizzle Schema Definition (Source of Truth for Code)

**File:** `lib/db/src/schema/user_plans.ts` (15 columns)

```typescript
id (TEXT, PK)
order_id (TEXT, NOT NULL)
network (TEXT, NOT NULL)         ← Actual DB missing
plan_name (TEXT, NOT NULL)
plan_type (TEXT, NOT NULL)
duration (TEXT, NOT NULL)
app_type (TEXT, NOT NULL)        ← Actual DB missing
device_id (TEXT, NOT NULL)       ← Actual DB missing
phone (TEXT, NOT NULL)           ← Actual DB missing
speed (TEXT, nullable)
expiry_date (TIMESTAMP)
status (TEXT, NOT NULL, default='active')
config_url (TEXT, nullable)      ← Actual DB missing
file_extension (TEXT, nullable)  ← Actual DB missing
created_at (TIMESTAMP, default=NOW())
```

---

## Actual Supabase Schema

**11 columns only:**

```
id (TEXT, PK)
user_id (TEXT)                   ← Extra in DB (not in Drizzle)
plan_type (TEXT)
plan_name (TEXT)
duration_days (TEXT)             ← Different name than Drizzle (expects `duration`)
status (TEXT)
activated_at (TIMESTAMP)         ← Extra in DB (not in Drizzle)
expires_at (TIMESTAMP)           ← Different name than Drizzle (expects `expiry_date`)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)           ← Extra in DB (not in Drizzle)
order_id (TEXT)
```

---

## Migration Analysis

**0001_init.sql** (lines 26-38): Defines correct 15-column schema
- Includes: network, app_type, device_id, phone, config_url, file_extension
- Does NOT include: user_id, duration_days, activated_at, expires_at, updated_at

**Status:** Migration 0001 is marked as executed, but actual database doesn't match the schema it defines.

---

## All Routes That Read/Write user_plans

### 1. **admin-orders.ts** - Fulfillment INSERT
**Lines 109-123:** Creates user_plans record after admin delivers config

Columns being WRITTEN:
- ✅ id
- ✅ orderId
- ✅ network ← **DATABASE DOESN'T HAVE THIS**
- ✅ planName
- ✅ planType
- ✅ duration
- ✅ appType ← **DATABASE DOESN'T HAVE THIS**
- ✅ deviceId ← **DATABASE DOESN'T HAVE THIS**
- ✅ phone ← **DATABASE DOESN'T HAVE THIS**
- ✅ expiryDate
- ✅ status
- ✅ configUrl ← **DATABASE DOESN'T HAVE THIS**
- ✅ fileExtension ← **DATABASE DOESN'T HAVE THIS**

**Result:** INSERT would fail with "column does not exist" error for `network`, `app_type`, etc.

### 2. **payment.ts** - Auto-fulfill INSERT
**Line 85-101:** Creates user_plans during automatic payment fulfillment

Same columns as admin-orders.ts - **also fails**

### 3. **plans.ts** - GET /api/plans
**Lines 20-35:** Queries user_plans and selects all columns

Columns being READ:
- ✅ id
- ❌ orderId (not selected, used in WHERE but mapped to order_id)
- ❌ network ← **DOESN'T EXIST - CAUSES THE ERROR**
- ❌ planName
- ❌ planType
- ❌ duration
- ❌ appType
- ❌ deviceId
- ❌ phone
- ❌ speed
- ❌ expiryDate
- ❌ status
- ❌ configUrl
- ❌ fileExtension
- ✅ createdAt

**Result:** Every SELECT query fails with "column 'network' does not exist"

---

## Determination: Authoritative Schema

**Answer:** The actual Supabase database is the current production schema.

**Evidence:**
1. App is running with 11-column schema in production (errors confirm columns don't exist)
2. No errors about extra columns (user_id, duration_days, etc.) - these exist in DB
3. Drizzle schema is aspirational/over-designed and never properly deployed
4. Migration journal shows 0001 "executed" but database doesn't match

---

## Recommendation: Correct Approach

**Option A:** Update Drizzle schema to match actual database (RECOMMENDED)
- Simpler, matches production reality
- No destructive migrations needed
- Preserve existing data

**Option B:** Recreate database to match Drizzle schema
- Requires migration that drops/recreates table
- Data loss risk
- More complex

---

## Required Action

**Update Drizzle schema** at `lib/db/src/schema/user_plans.ts` to match the actual 11-column database:

```typescript
export const userPlansTable = pgTable("user_plans", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  planType: text("plan_type"),
  planName: text("plan_name"),
  durationDays: text("duration_days"),
  status: text("status"),
  activatedAt: timestamp("activated_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  orderId: text("order_id"),
});
```

This aligns code with database reality and eliminates all "column does not exist" errors.
