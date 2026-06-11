# Admin Stats Route Analysis & Database Schema Reference
**Date:** 2026-06-10

---

## PART 1: Current `/api/admin-stats` Route Implementation

**File:** `artifacts/api-server/src/routes/stats.ts` (Lines 54-80)

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
      { month: "Feb", revenue: 310000, orders: 580 },
      { month: "Mar", revenue: 355000, orders: 650 },
      { month: "Apr", revenue: 390000, orders: 720 },
      { month: "May", revenue: 420000, orders: 790 },
      { month: "Jun", revenue: 445000, orders: 840 },
      { month: "Jul", revenue: 410000, orders: 760 },
      { month: "Aug", revenue: 475000, orders: 890 },
      { month: "Sep", revenue: 490000, orders: 910 },
      { month: "Oct", revenue: 510000, orders: 950 },
      { month: "Nov", revenue: 530000, orders: 980 },
      { month: "Dec", revenue: 636600, orders: 1042 },
    ],
  });
});
```

**Issues:**
- ❌ No database imports
- ❌ No async function
- ❌ No database queries
- ❌ No error handling
- ❌ No parameters (_req unused)
- ❌ Hardcoded values returned every time

---

## PART 2: Complete Database Schema

### Overview Table

| Table | Rows | Purpose | Key Fields |
|-------|------|---------|-----------|
| `orders` | Order transactions | Core business metric | id, network, amount, status, created_at |
| `user_plans` | Active subscriptions | Track active plans | id, status, network, created_at, expiry_date |
| `user_profiles` | User accounts | Count active users | id, email, created_at, newsletter_subscribed |
| `config_servers` | VPN configurations | Server inventory | id, network, status, is_free |
| `contact_messages` | Customer messages | Contact form data | id, email, created_at |

---

## TABLE 1: `orders`

**Schema File:** `lib/db/src/schema/orders.ts`

**Drizzle Definition:**
```typescript
export const ordersTable = pgTable("orders", {
  id: text("id").primaryKey(),
  packageId: text("package_id").notNull(),
  network: text("network").notNull(),              // ← GROUP BY for metrics
  duration: text("duration").notNull(),
  appType: text("app_type").notNull(),
  deviceId: text("device_id").notNull(),
  phone: text("phone").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),  // ← SUM for revenue
  status: text("status").notNull().default("pending"),  // ← FILTER: 'completed'
  paymentReference: text("payment_reference"),
  configUrl: text("config_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),  // ← GROUP BY for monthly
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
```

**SQL Schema:**
```sql
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  package_id TEXT NOT NULL,
  network TEXT NOT NULL,
  duration TEXT NOT NULL,
  app_type TEXT NOT NULL,
  device_id TEXT NOT NULL,
  phone TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_reference TEXT,
  config_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_device_id ON orders(device_id);
```

**Available Metrics from This Table:**
- ✅ `totalOrders` = COUNT(*) WHERE status='completed'
- ✅ `totalRevenue` = SUM(amount) WHERE status='completed'
- ✅ `revenueByNetwork` = GROUP BY network, SUM(amount)
- ✅ `revenueByMonth` = GROUP BY month(created_at), SUM(amount)
- ✅ `ordersByDuration` = GROUP BY duration, COUNT(*)
- ✅ `ordersByAppType` = GROUP BY app_type, COUNT(*)

---

## TABLE 2: `user_plans`

**Schema File:** `lib/db/src/schema/user_plans.ts`

**Drizzle Definition:**
```typescript
export const userPlansTable = pgTable("user_plans", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull(),
  network: text("network").notNull(),
  planName: text("plan_name").notNull(),
  planType: text("plan_type").notNull(),
  duration: text("duration").notNull(),
  appType: text("app_type").notNull(),
  deviceId: text("device_id").notNull(),
  phone: text("phone").notNull(),
  speed: text("speed"),
  expiryDate: timestamp("expiry_date", { withTimezone: true }).notNull(),
  status: text("status").notNull().default("active"),  // ← FILTER: 'active'
  configUrl: text("config_url"),
  fileExtension: text("file_extension"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

**SQL Schema:**
```sql
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

**Available Metrics from This Table:**
- ✅ `activePlans` = COUNT(*) WHERE status='active'
- ✅ `activeByNetwork` = GROUP BY network, COUNT(*) WHERE status='active'
- ✅ `expiredPlans` = COUNT(*) WHERE status='expired' OR expiry_date < NOW()
- ✅ `plansByType` = GROUP BY plan_type, COUNT(*)

---

## TABLE 3: `user_profiles`

**Schema File:** `lib/db/src/schema/user_profiles.ts`

**Drizzle Definition:**
```typescript
export const userProfilesTable = pgTable("user_profiles", {
  id: text("id").primaryKey(),
  supabaseUid: text("supabase_uid").notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  fullName: varchar("full_name", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  isEmailVerified: boolean("is_email_verified").notNull().default(false),
  isPhoneVerified: boolean("is_phone_verified").notNull().default(false),
  newsletterSubscribed: boolean("newsletter_subscribed").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
```

**SQL Schema:**
```sql
CREATE TABLE user_profiles (
  id TEXT PRIMARY KEY,
  supabase_uid TEXT NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  phone VARCHAR(20),
  bio TEXT,
  avatar_url TEXT,
  is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  newsletter_subscribed BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_user_profiles_supabase_uid ON user_profiles(supabase_uid);
CREATE UNIQUE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE TRIGGER user_profiles_updated_at BEFORE UPDATE ON user_profiles...
```

**Available Metrics from This Table:**
- ✅ `activeUsers` = COUNT(*) WHERE created_at > NOW() - INTERVAL '30 days'
- ✅ `totalUsers` = COUNT(*)
- ✅ `verifiedUsers` = COUNT(*) WHERE is_email_verified=true
- ✅ `newsletterSubscribers` = COUNT(*) WHERE newsletter_subscribed=true
- ✅ `usersByMonth` = GROUP BY month(created_at), COUNT(*)

---

## TABLE 4: `config_servers`

**Schema File:** `lib/db/src/schema/config_servers.ts`

**Drizzle Definition:**
```typescript
export const configServersTable = pgTable("config_servers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  serverName: text("server_name").notNull(),
  network: text("network").notNull(),
  appType: text("app_type").notNull(),
  planType: text("plan_type").notNull(),
  duration: text("duration").notNull(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  fileSize: integer("file_size"),
  fileUrl: text("file_url"),
  status: text("status").notNull().default("active"),  // ← FILTER: 'active'
  isFree: boolean("is_free").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
```

**SQL Schema:**
```sql
CREATE TABLE config_servers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  server_name TEXT NOT NULL,
  network TEXT NOT NULL,
  app_type TEXT NOT NULL,
  plan_type TEXT NOT NULL,
  duration TEXT NOT NULL,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_size INTEGER,
  file_url TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  is_free BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_config_servers_status ON config_servers(status);
CREATE INDEX idx_config_servers_network ON config_servers(network);
```

**Available Metrics from This Table:**
- ✅ `activeServers` = COUNT(*) WHERE status='active'
- ✅ `freeServers` = COUNT(*) WHERE is_free=true
- ✅ `serversByNetwork` = GROUP BY network, COUNT(*) WHERE status='active'

---

## TABLE 5: `contact_messages`

**Schema File:** `lib/db/src/schema/contact_messages.ts`

**Drizzle Definition:**
```typescript
export const contactMessagesTable = pgTable("contact_messages", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  subject: text("subject"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

**SQL Schema:**
```sql
CREATE TABLE contact_messages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contact_messages_email ON contact_messages(email);
```

**Available Metrics from This Table:**
- ✅ `totalMessages` = COUNT(*)
- ✅ `messagesByDay` = GROUP BY date(created_at), COUNT(*)

---

## PART 3: Metric-to-Table Mapping

### Metric: `totalOrders` (Currently: 8432)

**Real Source:** `orders` table

| Query Type | Implementation |
|-----------|-----------------|
| **Drizzle** | `db.select({ count: sql`COUNT(*)` }).from(ordersTable).where(eq(ordersTable.status, 'completed'))` |
| **SQL** | `SELECT COUNT(*) FROM orders WHERE status='completed';` |
| **Raw SQL (psql)** | `psql -h localhost -U user -d dbname -c "SELECT COUNT(*) FROM orders WHERE status='completed';"` |

**Filters:**
- Only count orders with `status='completed'`
- Include all networks (Safaricom, Airtel, Telkom)
- Include all durations/app types

---

### Metric: `totalRevenue` (Currently: 4251600)

**Real Source:** `orders` table

| Query Type | Implementation |
|-----------|-----------------|
| **Drizzle** | `db.select({ revenue: sql`SUM(amount)` }).from(ordersTable).where(eq(ordersTable.status, 'completed'))` |
| **SQL** | `SELECT SUM(amount) FROM orders WHERE status='completed';` |
| **Raw SQL (psql)** | `psql -h localhost -U user -d dbname -c "SELECT SUM(amount) FROM orders WHERE status='completed';"` |

**Notes:**
- Sum the `amount` column (NUMERIC(10,2))
- Only sum completed orders
- Result in Kenyan Shillings (Ksh)

---

### Metric: `activeUsers` (Currently: 12450)

**Real Source:** `user_profiles` table

| Query Type | Implementation |
|-----------|-----------------|
| **Drizzle** | `db.select({ count: sql`COUNT(*)` }).from(userProfilesTable).where(gte(userProfilesTable.createdAt, sql`NOW() - INTERVAL '30 days'`))` |
| **SQL** | `SELECT COUNT(*) FROM user_profiles WHERE created_at > NOW() - INTERVAL '30 days';` |
| **Alternative (All Users)** | `SELECT COUNT(*) FROM user_profiles;` |

**Definition Options:**
1. Users created in last 30 days (active this month)
2. Total registered users
3. Users with at least one order
4. Users with active plans

**Current:** Likely "total registered" or "30-day active"

---

### Metric: `activePlans` (Currently: 9870)

**Real Source:** `user_plans` table

| Query Type | Implementation |
|-----------|-----------------|
| **Drizzle** | `db.select({ count: sql`COUNT(*)` }).from(userPlansTable).where(eq(userPlansTable.status, 'active'))` |
| **SQL** | `SELECT COUNT(*) FROM user_plans WHERE status='active';` |
| **With Expiry Check** | `SELECT COUNT(*) FROM user_plans WHERE status='active' AND expiry_date > NOW();` |

**Note:** Plans can be marked 'active' but expired. Better to check expiry_date.

---

### Metric: `revenueByNetwork` (Currently: Hardcoded 3 items)

**Real Source:** `orders` table (GROUP BY network)

**Expected Result:**
```json
[
  { network: "Safaricom", revenue: ACTUAL_SUM, orders: ACTUAL_COUNT },
  { network: "Airtel", revenue: ACTUAL_SUM, orders: ACTUAL_COUNT },
  { network: "Telkom", revenue: ACTUAL_SUM, orders: ACTUAL_COUNT }
]
```

| Query Type | Implementation |
|-----------|-----------------|
| **Drizzle** | `db.select({ network: ordersTable.network, revenue: sql`SUM(amount)`, orders: sql`COUNT(*)` }).from(ordersTable).where(eq(ordersTable.status, 'completed')).groupBy(ordersTable.network).orderBy(desc(sql`SUM(amount)`))` |
| **SQL** | `SELECT network, SUM(amount) as revenue, COUNT(*) as orders FROM orders WHERE status='completed' GROUP BY network ORDER BY SUM(amount) DESC;` |

---

### Metric: `revenueByMonth` (Currently: Hardcoded 12 items)

**Real Source:** `orders` table (GROUP BY month)

**Expected Result:**
```json
[
  { month: "Jan", revenue: ACTUAL_SUM, orders: ACTUAL_COUNT },
  { month: "Feb", revenue: ACTUAL_SUM, orders: ACTUAL_COUNT },
  ...
  { month: "Dec", revenue: ACTUAL_SUM, orders: ACTUAL_COUNT }
]
```

| Query Type | Implementation |
|-----------|-----------------|
| **Drizzle** | `db.select({ month: sql`DATE_TRUNC('month', created_at)::date`, revenue: sql`SUM(amount)`, orders: sql`COUNT(*)` }).from(ordersTable).where(eq(ordersTable.status, 'completed')).groupBy(sql`DATE_TRUNC('month', created_at)`).orderBy(sql`DATE_TRUNC('month', created_at)`)` |
| **SQL** | `SELECT DATE_TRUNC('month', created_at)::date as month, SUM(amount) as revenue, COUNT(*) as orders FROM orders WHERE status='completed' GROUP BY DATE_TRUNC('month', created_at) ORDER BY month;` |
| **With Year Filter** | `SELECT DATE_TRUNC('month', created_at)::date as month, SUM(amount) as revenue, COUNT(*) as orders FROM orders WHERE status='completed' AND created_at >= NOW() - INTERVAL '1 year' GROUP BY DATE_TRUNC('month', created_at) ORDER BY month;` |

**Note:** Current implementation hardcodes January-December. Real query should return actual months with data.

---

## PART 4: SQL Query Testing

To verify current database state, run these queries:

```sql
-- Test 1: How many completed orders exist?
SELECT COUNT(*) as total_orders FROM orders WHERE status='completed';
-- Expected: Varies (currently returns 8432 from mocked API)

-- Test 2: What's the total revenue?
SELECT SUM(amount) as total_revenue FROM orders WHERE status='completed';
-- Expected: Varies (currently returns 4251600 from mocked API)

-- Test 3: How many user profiles?
SELECT COUNT(*) as total_users FROM user_profiles;
-- Expected: Varies (currently returns 12450 from mocked API)

-- Test 4: How many active plans?
SELECT COUNT(*) as active_plans FROM user_plans WHERE status='active';
-- Expected: Varies (currently returns 9870 from mocked API)

-- Test 5: Revenue breakdown by network
SELECT 
  network,
  COUNT(*) as order_count,
  SUM(amount) as total_revenue
FROM orders 
WHERE status='completed'
GROUP BY network
ORDER BY SUM(amount) DESC;

-- Test 6: Last 12 months revenue
SELECT 
  DATE_TRUNC('month', created_at)::date as month,
  COUNT(*) as order_count,
  SUM(amount) as total_revenue
FROM orders
WHERE status='completed'
  AND created_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month;

-- Test 7: Verify indices exist
SELECT * FROM pg_indexes WHERE tablename IN ('orders', 'user_plans', 'user_profiles');
```

---

## PART 5: Additional Metrics Possible from Schema

Beyond the 6 mocked metrics, you could calculate:

| Metric | Source | SQL |
|--------|--------|-----|
| Orders by Status | orders | `GROUP BY status, COUNT(*)` |
| Orders by Duration | orders | `GROUP BY duration, COUNT(*)` |
| Orders by App Type | orders | `GROUP BY app_type, COUNT(*)` |
| Users by Signup Month | user_profiles | `GROUP BY month(created_at), COUNT(*)` |
| Verified Email Rate | user_profiles | `SUM(CASE WHEN is_email_verified THEN 1 ELSE 0 END) / COUNT(*)` |
| Newsletter Subscription Rate | user_profiles | `SUM(CASE WHEN newsletter_subscribed THEN 1 ELSE 0 END) / COUNT(*)` |
| Plans by Network | user_plans | `GROUP BY network, COUNT(*)` |
| Plans by Plan Type | user_plans | `GROUP BY plan_type, COUNT(*)` |
| Config Servers by Network | config_servers | `GROUP BY network, COUNT(*) WHERE status='active'` |
| Free vs Paid Offers | config_servers | `GROUP BY is_free, COUNT(*)` |
| Average Order Value | orders | `AVG(amount) WHERE status='completed'` |
| Contact Messages | contact_messages | `COUNT(*) or GROUP BY month(created_at)` |

---

## Summary

**Available Tables:** 5  
**Metrics Currently Real:** 0/6  
**Metrics That Can Be Real:** 6/6  
**Query Complexity:** Low (simple COUNT/SUM/GROUP BY)  
**Performance Impact:** Minimal (with indexes)  
**Migration Required:** None (all tables exist)  

**Recommendation:** Replace hardcoded `/api/admin-stats` with database queries using `ordersTable`, `userPlansTable`, and `userProfilesTable`.
