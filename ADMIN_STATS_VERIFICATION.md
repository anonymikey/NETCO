# Admin Stats Endpoint Analysis
**Date:** 2026-06-10  
**File:** artifacts/api-server/src/routes/stats.ts

---

## Summary

🔴 **CRITICAL:** The `/api/admin-stats` endpoint is **100% MOCKED** with hardcoded values.  
⚠️ The `/api/stats` endpoint is **PARTIALLY REAL** (1 of 5 metrics from database).  
🔴 The `/api/server-status` endpoint is **100% MOCKED** with fake node data.

---

## Endpoint 1: `/api/stats` (Public Stats)

**Location:** stats.ts:7-34

| Metric | Value | Source | Status |
|--------|-------|--------|--------|
| `activeUsers` | 12,450 | Hardcoded | ❌ MOCKED |
| `serversOnline` | Dynamic | Database query (configServersTable WHERE status='active') | ✅ REAL |
| `totalServers` | Dynamic | Same as serversOnline | ✅ REAL |
| `uptime` | 99.9 | Hardcoded | ❌ MOCKED |
| `supportHours` | "24/7" | Hardcoded | ❌ MOCKED |

**Code:**
```typescript
router.get("/stats", async (_req, res) => {
  try {
    const servers = await db
      .select()
      .from(configServersTable)
      .where(eq(configServersTable.status, "active"));
    
    const serversOnline = servers.length || 24;  // Real from DB, fallback to 24
    
    res.json({
      activeUsers: 12450,                        // ❌ MOCKED
      serversOnline,                             // ✅ REAL
      totalServers: serversOnline,               // ✅ REAL
      uptime: 99.9,                              // ❌ MOCKED
      supportHours: "24/7",                      // ❌ MOCKED
    });
  } catch (err) {
    // Fallback to all hardcoded if error
    res.json({
      activeUsers: 12450,                        // ❌ MOCKED
      serversOnline: 24,                         // ❌ FALLBACK (hardcoded)
      totalServers: 24,                          // ❌ FALLBACK (hardcoded)
      uptime: 99.9,                              // ❌ MOCKED
      supportHours: "24/7",                      // ❌ MOCKED
    });
  }
});
```

**Used By:**
- Frontend: home.tsx (displays "Active Users")
- Frontend: server-status.tsx (displays stats)

**Issue:** If database query fails, falls back to hardcoded 24 servers (misleading if real count is different).

---

## Endpoint 2: `/api/admin-stats` (CRITICAL - Admin Dashboard)

**Location:** stats.ts:54-80

### ⚠️ **ALL METRICS ARE 100% HARDCODED** ⚠️

| Metric | Value | Type | Status |
|--------|-------|------|--------|
| `totalOrders` | 8,432 | Hardcoded integer | ❌ MOCKED |
| `totalRevenue` | 4,251,600 | Hardcoded integer | ❌ MOCKED |
| `activeUsers` | 12,450 | Hardcoded integer | ❌ MOCKED |
| `activePlans` | 9,870 | Hardcoded integer | ❌ MOCKED |
| `revenueByNetwork[0]` | Safaricom: 2,450,000 revenue, 4,800 orders | Hardcoded array | ❌ MOCKED |
| `revenueByNetwork[1]` | Airtel: 1,200,000 revenue, 2,300 orders | Hardcoded array | ❌ MOCKED |
| `revenueByNetwork[2]` | Telkom: 601,600 revenue, 1,332 orders | Hardcoded array | ❌ MOCKED |
| `revenueByMonth[12]` | Jan-Dec with varying revenue/orders | Hardcoded array | ❌ MOCKED |

**Code:**
```typescript
router.get("/admin-stats", (_req, res) => {
  res.json({
    totalOrders: 8432,
    totalRevenue: 4251600,
    activeUsers: 12450,
    activePlans: 9870,
    revenueByNetwork: [
      { network: "Safaricom", revenue: 2450000, orders: 4800 },
      { network: "Airtel", revenue: 1200000, orders: 2300 },
      { network: "Telkom", revenue: 601600, orders: 1332 },
    ],
    revenueByMonth: [
      { month: "Jan", revenue: 280000, orders: 520 },
      // ... 11 more months ...
      { month: "Dec", revenue: 636600, orders: 1042 },
    ],
  });
});
```

**Used By:**
- Frontend: admin.tsx (line 114) - Displays all dashboard metrics and charts

**Problem Severity:** 🔴 CRITICAL
- Admin sees completely false data
- Business decisions made on fake metrics
- No error handling or fallback
- No indication that data is mocked

**Real Data Available in Database:**
- `totalOrders`: Can COUNT(*) FROM orders
- `totalRevenue`: Can SUM(amount) FROM orders
- `activeUsers`: Can COUNT(*) FROM user_profiles
- `activePlans`: Can COUNT(*) FROM user_plans WHERE status='active'
- `revenueByNetwork`: Can GROUP BY network on orders
- `revenueByMonth`: Can GROUP BY DATE_TRUNC('month', created_at) on orders

---

## Endpoint 3: `/api/server-status` (Public Server Status)

**Location:** stats.ts:36-51

### ⚠️ **ALL DATA IS 100% MOCKED** ⚠️

**Mock Data:**
- 13 hardcoded server nodes (5 Safaricom, 4 Airtel, 4 Telkom)
- Fake locations (Nairobi, Mombasa, Kisumu, Nakuru, Eldoret, Thika)
- Fake load percentages (15-73%)
- Fake ping times (18-45ms)
- Mixed statuses: "online", "offline", "maintenance"

**Code Sample:**
```typescript
router.get("/server-status", (_req, res) => {
  res.json([
    { id: "saf-1", name: "Safaricom Node 1", network: "Safaricom", 
      location: "Nairobi, KE", status: "online", load: 42, ping: 18 },
    // ... 12 more hardcoded nodes
    { id: "tel-3", name: "Telkom Node 3", network: "Telkom", 
      location: "Mombasa, KE", status: "offline", load: 0, ping: 0 },
  ]);
});
```

**Used By:**
- Frontend: server-status.tsx (displays server status table)

**Problem:** Users see fake server status with no real uptime data.

---

## Impact Assessment

### 🔴 CRITICAL ISSUES

#### Issue 1: Admin Dashboard Metrics Are Fake
- **Impact:** Admin makes business decisions on fabricated data
- **Severity:** CRITICAL
- **Data Shown as Real:** 
  - Total Orders: 8,432 (fake)
  - Total Revenue: Ksh 4,251,600 (fake)
  - Active Users: 12,450 (fake)
  - Active Plans: 9,870 (fake)
  - Revenue by Network chart (fake)
  - Revenue by Month chart (fake)
- **Affected Users:** All admin users
- **Business Risk:** Revenue/operational decisions on false data

#### Issue 2: No Error Handling
- No database query in `/api/admin-stats`
- No try/catch
- No fallback if data unavailable
- Always returns same fake numbers

#### Issue 3: No Indication Data is Mocked
- Frontend has no warning labels
- No "Demo Data" badge
- Treated as production metrics

### ⚠️ HIGH ISSUES

#### Issue 4: Server Status Page Shows Fake Data
- Users see hardcoded server nodes
- Fake load/ping metrics
- One node marked "offline" permanently (tel-3)
- No real uptime monitoring

#### Issue 5: Public Stats Fallback is Brittle
- If database error occurs, `serversOnline` falls back to hardcoded 24
- Doesn't match real active servers
- Could mislead users about availability

---

## Required Database Queries

To calculate real metrics, implement these SQL queries:

### Total Orders Count
```sql
SELECT COUNT(*) as totalOrders FROM orders;
-- Currently returns fake: 8432
```

### Total Revenue
```sql
SELECT SUM(amount) as totalRevenue FROM orders WHERE status = 'completed';
-- Currently returns fake: 4251600
```

### Active Users
```sql
SELECT COUNT(*) as activeUsers FROM user_profiles WHERE created_at > NOW() - INTERVAL '30 days';
-- Currently returns fake: 12450
```

### Active Plans
```sql
SELECT COUNT(*) as activePlans FROM user_plans WHERE status = 'active';
-- Currently returns fake: 9870
```

### Revenue by Network
```sql
SELECT 
  o.network,
  SUM(o.amount) as revenue,
  COUNT(*) as orders
FROM orders o
WHERE o.status = 'completed'
GROUP BY o.network
ORDER BY revenue DESC;
-- Currently returns fake data
```

### Revenue by Month
```sql
SELECT 
  DATE_TRUNC('month', o.created_at)::date as month,
  SUM(o.amount) as revenue,
  COUNT(*) as orders
FROM orders o
WHERE o.status = 'completed'
  AND o.created_at >= NOW() - INTERVAL '1 year'
GROUP BY DATE_TRUNC('month', o.created_at)
ORDER BY month ASC;
-- Currently returns fake data
```

---

## Verification Checklist

To verify if metrics are real or fake, check:

- [ ] `/api/admin-stats` returns same values every request? → **Fake** (should vary)
- [ ] `/api/admin-stats` response time < 50ms? → Suspect **Fake** (database queries take time)
- [ ] `/api/admin-stats` has try/catch? → **No** (hardcoded, never errors)
- [ ] Values match actual database counts? → Can be verified with queries above
- [ ] Admin dashboard metrics match /api/orders data? → **No** (orders are real, stats are fake)

**Actual Test:**
```bash
# Call the endpoint multiple times - values should change if real
curl http://localhost:3000/api/admin-stats
# If totalOrders is always 8432, it's mocked

# Compare with actual data
curl http://localhost:3000/api/admin/orders?limit=1000
# Count orders in response - if less than 8432, stats are fake
```

---

## Recommendation

**Action Required:** CRITICAL - Before production release

1. **Implement real metric calculations** in `/api/admin-stats` endpoint
2. **Add database queries** for all 5 metrics
3. **Add error handling** with meaningful responses
4. **Add caching** (e.g., cache metrics for 5 minutes to avoid N+1 queries)
5. **Implement real server status monitoring** (replacing hardcoded `/server-status`)
6. **Add loading states** in admin.tsx while fetching metrics
7. **Display warning** during development/staging that metrics are mocked

**Estimated Effort:** 4-6 hours (implementation + testing)

**Priority:** CRITICAL - This blocks production release

---

## Code Example: Real Implementation

```typescript
router.get("/admin-stats", async (_req, res) => {
  try {
    // Total Orders
    const [{ totalOrders }] = await db
      .select({ totalOrders: sql`COUNT(*)` })
      .from(ordersTable)
      .where(eq(ordersTable.status, 'completed'));

    // Total Revenue
    const [{ totalRevenue }] = await db
      .select({ totalRevenue: sql`SUM(amount)` })
      .from(ordersTable)
      .where(eq(ordersTable.status, 'completed'));

    // Active Users (last 30 days)
    const [{ activeUsers }] = await db
      .select({ activeUsers: sql`COUNT(*)` })
      .from(userProfilesTable)
      .where(gte(userProfilesTable.createdAt, sql`NOW() - INTERVAL '30 days'`));

    // Active Plans
    const [{ activePlans }] = await db
      .select({ activePlans: sql`COUNT(*)` })
      .from(userPlansTable)
      .where(eq(userPlansTable.status, 'active'));

    // Revenue by Network
    const revenueByNetwork = await db
      .select({
        network: ordersTable.network,
        revenue: sql`SUM(amount)`,
        orders: sql`COUNT(*)`,
      })
      .from(ordersTable)
      .where(eq(ordersTable.status, 'completed'))
      .groupBy(ordersTable.network)
      .orderBy(desc(sql`SUM(amount)`));

    // Revenue by Month
    const revenueByMonth = await db
      .select({
        month: sql`DATE_TRUNC('month', created_at)::date`,
        revenue: sql`SUM(amount)`,
        orders: sql`COUNT(*)`,
      })
      .from(ordersTable)
      .where(eq(ordersTable.status, 'completed'))
      .groupBy(sql`DATE_TRUNC('month', created_at)`)
      .orderBy(sql`DATE_TRUNC('month', created_at)`);

    res.json({
      totalOrders: Number(totalOrders),
      totalRevenue: Number(totalRevenue),
      activeUsers: Number(activeUsers),
      activePlans: Number(activePlans),
      revenueByNetwork,
      revenueByMonth,
    });
  } catch (err) {
    req.log.error({ err }, "Error calculating admin stats");
    res.status(500).json({ error: "Failed to calculate statistics" });
  }
});
```

---

**Status:** 🔴 BLOCKING PRODUCTION RELEASE

All admin dashboard metrics are mocked. This must be fixed before go-live.
