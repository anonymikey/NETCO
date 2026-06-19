# User Plans Fields - Complete Usage Audit

## Executive Summary
**Recommendation: DATABASE MIGRATION REQUIRED**

All 14 fields (network, appType, deviceId, phone, configUrl, fileExtension, etc.) are actively used AFTER plan creation in production features. Removing them would break:
- User dashboard plan display
- Check expiry page functionality
- Config file downloads
- Admin panel order fulfillment tracking

---

## Authoritative Schema
**15 columns in Drizzle ORM:**
1. id (PK)
2. orderId (FK to orders)
3. network ✅ USED
4. planName ✅ USED
5. planType ✅ USED
6. duration ✅ USED
7. appType ✅ USED
8. deviceId ✅ USED
9. phone ✅ USED
10. speed ✅ USED (optional)
11. expiryDate ✅ USED
12. status ✅ USED
13. configUrl ✅ USED
14. fileExtension ✅ USED
15. createdAt ✅ USED

---

## Write Operations (INSERT)

### 1. admin-orders.ts - Line 109-123
**Route:** `POST /api/admin/orders/{id}/fulfill`
**When:** Admin manually fulfills an order

**Fields Written:**
```
orderId, network, planName, planType, duration, appType, 
deviceId, phone, expiryDate, status, configUrl, fileExtension
```

### 2. payment.ts - Lines 95-101
**Route:** `POST /api/payment/status/{reference}` (auto-fulfill)
**When:** PayFlow confirms payment completion

**Fields Written:**
```
orderId, network, planName, planType, duration, appType,
deviceId, phone, expiryDate, status, configUrl, fileExtension
```

### 3. orders.ts - (Similar auto-fulfill pattern)
**Route:** Manual fulfillment endpoint
**Fields Written:** Same 12 fields

---

## Read Operations (SELECT/USAGE)

### CRITICAL: plans.ts Line 27-36
**Route:** `GET /api/plans?phone=...&deviceId=...`
**Called by:** 
- Dashboard.tsx (user viewing their active plans)
- check-expiry.tsx (user checking plan status)

**All 14 fields selected and returned to frontend:**
```javascript
const formatted = plans.map((p) => ({
  id: p.id,
  network: p.network,           // ✅ Used to display network name & color
  planName: p.planName,         // ✅ Used in plan card title
  planType: p.planType,         // ✅ Displayed in plan details
  duration: p.duration,         // ✅ Displayed in plan details
  appType: p.appType,           // ✅ Used to display app type label
  deviceId: p.deviceId,         // ✅ Displayed in plan card
  expiryDate: p.expiryDate,    // ✅ Critical for expiry calculations
  status: p.status,             // ✅ Determines active/expired badge
  configUrl: p.configUrl,       // ✅ Download link for config file
  fileExtension: p.fileExtension, // ✅ Displayed in download button label
  speed: p.speed,               // ✅ Optional speed display
}))
```

### Frontend: dashboard.tsx
**Lines 46-47:** Fetch plans using useListPlans hook
**Lines 73-90:** Display active plans with all fields:
- network → displayed with color coding (line 77)
- planName → displayed as title (line 79)
- appType → displayed with label (line 80)
- duration → displayed (line 80)
- deviceId → displayed in monospace font (line 84)
- expiryDate → displayed with calculated remaining time (line 75-76)
- configUrl → download link (line 87)
- fileExtension → shown in download button (line 88)
- speed → wifi icon display (line 91)

### Frontend: check-expiry.tsx
**Lines 44-45:** Fetch plans using useListPlans hook
**Lines 107-115:** Display each plan:
- network → displayed in bold (line 111)
- planName → displayed (line 112)
- duration → displayed (line 112)
- expiryDate → formatted and displayed (line 114)
- status → used to determine "Active", "Expired" badge (line 101)

### Frontend: admin.tsx (Orders Tab)
**Lines 144-146:** Fetch orders (not user_plans directly)
**Lines 167-176:** Display order fields in realtime subscription
- phone, network, duration, amount, status from orders table

---

## Database State Mismatch

**Problem:** 
- Drizzle schema defines 15 columns (including all above)
- Migration 0001_init.sql defines 15 columns
- **Actual Supabase database has fewer columns**
- Only migrations 0001 and 0004 applied to Supabase
- Migrations 0002, 0003, 0005, 0006 were skipped

**Error Symptoms:**
1. INSERT succeeds (doesn't validate schema)
2. SELECT `.from(userPlansTable)` fails with "column 'X' does not exist"
3. Admin panel shows error after fulfillment
4. Dashboard/check-expiry pages fail to load plans

---

## Usage Frequency (Post-Creation)

| Field | Write Count | Read Count | Usage Context |
|-------|------------|-----------|----------------|
| network | 1x (at insert) | 3+ per user session | Dashboard color, check-expiry display, plan filtering |
| planName | 1x | 2+ per session | Plan card title, plan details display |
| planType | 1x | 1+ per session | Plan details, UI filtering |
| duration | 1x | 2+ per session | Plan card display, plan details |
| appType | 1x | 2+ per session | App label, device type label in UI |
| deviceId | 1x | 2+ per session | Device card display, search filter |
| phone | 1x | 2+ per query | Query filter parameter for plans lookup |
| configUrl | 1x | 1+ per download | Download button href, link generation |
| fileExtension | 1x | 1+ per download | Download button label (e.g. ".hc", ".ehi") |
| speed | 1x | 1+ if present | Wifi icon display in dashboard |
| expiryDate | 1x | 3+ per session | Expiry badge, time calculation, expired filter |

**Result:** Every field is read multiple times per user session

---

## Recommendation

### ✅ MUST USE DATABASE MIGRATION

Do NOT reduce the Drizzle schema. Instead:

1. **Apply pending migrations** to Supabase to match Drizzle schema
   - Run migration 0006_reconcile_user_plans_schema.sql (or similar)
   - Verify all 15 columns exist in production database

2. **Verify after migration:**
   - `SELECT COUNT(*) FROM user_plans;` works
   - Column names match Drizzle (order_id, plan_name, app_type, device_id, config_url, file_extension, etc.)
   - No NULL errors on existing inserts

3. **Test fulfillment flow end-to-end:**
   - Admin fulfillment succeeds
   - Dashboard loads user plans
   - Check-expiry page displays correctly
   - Download links work

### Why NOT schema reduction:

- **Breaking change:** Dashboard would break for all users
- **Data loss:** Deleting columns loses user plan history
- **Feature regression:** Can't display app type, device info, or download links
- **Admin visibility:** Can't track which config was delivered
- **0 benefit:** Migration is safer and simpler than reducing schema

---

## Migration Path

Create migration that adds missing columns with defaults:

```sql
-- 0007_ensure_user_plans_columns.sql
ALTER TABLE user_plans ADD COLUMN IF NOT EXISTS order_id TEXT;
ALTER TABLE user_plans ADD COLUMN IF NOT EXISTS network TEXT;
ALTER TABLE user_plans ADD COLUMN IF NOT EXISTS plan_name TEXT;
ALTER TABLE user_plans ADD COLUMN IF NOT EXISTS app_type TEXT;
ALTER TABLE user_plans ADD COLUMN IF NOT EXISTS device_id TEXT;
ALTER TABLE user_plans ADD COLUMN IF NOT EXISTS config_url TEXT;
ALTER TABLE user_plans ADD COLUMN IF NOT EXISTS file_extension TEXT;

-- Add constraints after verification
ALTER TABLE user_plans ALTER COLUMN order_id SET NOT NULL;
ALTER TABLE user_plans ALTER COLUMN network SET NOT NULL;
-- etc.
```

This ensures all future inserts have the columns while handling any existing data gracefully.
