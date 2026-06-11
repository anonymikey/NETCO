# Complete Schema Audit Report
**Date:** 2026-06-10  
**Scope:** Comprehensive audit of 7 critical tables against Drizzle schemas and API routes

---

## Executive Summary

**CRITICAL ISSUES FOUND:** 4 major problems identified

| Issue | Severity | Impact | Tables |
|-------|----------|--------|--------|
| Missing table definitions | CRITICAL | 4 tables exist in code but not in schema | notifications, broadcast_notifications, devices, login_history |
| User profiles missing from migrations | CRITICAL | Table defined in Drizzle but never created in DB | user_profiles |
| Column mismatch in config_servers | HIGH | Name/server_name sync issues | config_servers |
| API using non-existent user_profiles table | CRITICAL | Auth routes will fail at runtime | user_profiles |

---

## Table-by-Table Audit

### 1. NOTIFICATIONS
**Status:** ❌ NOT DEFINED

#### Actual PostgreSQL Columns
```
NOT CREATED - No migration found
```

#### Drizzle Schema Columns
```
NOT DEFINED - No schema file exists
```

#### Missing Columns
- N/A (table not defined)

#### Extra Columns
- N/A (table not defined)

#### Nullable Mismatches
- N/A

#### Type Mismatches
- N/A

#### API Routes Using Table
None found - but referenced in naming (admin-announcements is actually sending email)

#### Frontend Pages Using API
None found

#### Risk Assessment
🔴 **CRITICAL:** No table definition exists. If notifications feature is planned, implementation will be needed from scratch.

---

### 2. BROADCAST_NOTIFICATIONS
**Status:** ❌ NOT DEFINED

#### Actual PostgreSQL Columns
```
NOT CREATED - No migration found
```

#### Drizzle Schema Columns
```
NOT DEFINED - No schema file exists
```

#### Missing Columns
- N/A

#### Extra Columns
- N/A

#### Nullable Mismatches
- N/A

#### Type Mismatches
- N/A

#### API Routes Using Table
None found

#### Frontend Pages Using API
None found

#### Risk Assessment
🔴 **CRITICAL:** No table definition exists. This appears to be unused - clarify if this feature is needed.

---

### 3. USER_PROFILES
**Status:** ⚠️ SCHEMA EXISTS BUT NOT IN MIGRATIONS

#### Actual PostgreSQL Columns
```
NOT CREATED IN MIGRATIONS
Expected columns from Drizzle schema:
- id (TEXT, PRIMARY KEY) ✓
- supabase_uid (TEXT, UNIQUE, NOT NULL) ✓
- email (VARCHAR(255), UNIQUE, NOT NULL) ✓
- full_name (VARCHAR(255), nullable) ✓
- phone (VARCHAR(20), nullable) ✓
- bio (TEXT, nullable) ✓
- avatar_url (TEXT, nullable) ✓
- is_email_verified (BOOLEAN, NOT NULL, DEFAULT false) ✓
- is_phone_verified (BOOLEAN, NOT NULL, DEFAULT false) ✓
- newsletter_subscribed (BOOLEAN, NOT NULL, DEFAULT true) ✓
- created_at (TIMESTAMPTZ, NOT NULL, DEFAULT NOW()) ✓
- updated_at (TIMESTAMPTZ, NOT NULL, DEFAULT NOW()) ✓
```

#### Drizzle Schema Columns
```typescript
id: text("id").primaryKey()
supabaseUid: text("supabase_uid").notNull().unique()
email: varchar("email", { length: 255 }).notNull().unique()
fullName: varchar("full_name", { length: 255 })
phone: varchar("phone", { length: 20 })
bio: text("bio")
avatarUrl: text("avatar_url")
isEmailVerified: boolean("is_email_verified").notNull().default(false)
isPhoneVerified: boolean("is_phone_verified").notNull().default(false)
newsletterSubscribed: boolean("newsletter_subscribed").notNull().default(true)
createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
```

#### Missing Columns
None - schema matches

#### Extra Columns
None - schema matches

#### Nullable Mismatches
None

#### Type Mismatches
None

#### API Routes Using Table
1. **POST /auth/profile/create** - Creates user profile after signup
2. **GET /auth/profile/:supabaseUid** - Fetches user profile
3. **PATCH /auth/profile/:supabaseUid** - Updates user profile
4. **POST /admin/announcements/send** - Queries profiles for bulk email targeting

#### Frontend Pages Using API
1. **signup.tsx** - Calls `/api/auth/profile/create` during user registration
2. **account.tsx** - Calls `GET /api/auth/profile/{user.id}` to load profile
3. **account.tsx** - Calls `PATCH /api/auth/profile/{user.id}` to update profile

#### Risk Assessment
🔴 **CRITICAL:** 
- Table is **completely missing from migrations** but is actively used by 4 API routes
- Frontend signup and account pages will fail at runtime when trying to create/fetch profiles
- **NO DATABASE TABLE WILL EXIST** until migration is added
- All auth-related features depend on this table
- Data loss risk: Zero persistence of user profiles

#### Operations That Will Fail
```javascript
// All of these will throw "relation "user_profiles" does not exist" error
await db.insert(userProfilesTable).values({...})  // signup
await db.select().from(userProfilesTable).where(...) // account page
await db.update(userProfilesTable).set({...})  // profile updates
await db.select().from(userProfilesTable).where(eq(userProfilesTable.newsletterSubscribed, true)) // admin announcements
```

---

### 4. USER_PLANS
**Status:** ✅ DEFINED AND IN MIGRATIONS (No issues)

#### Actual PostgreSQL Columns
```sql
id TEXT PRIMARY KEY
order_id TEXT NOT NULL
network TEXT NOT NULL
plan_name TEXT NOT NULL
plan_type TEXT NOT NULL
duration TEXT NOT NULL
app_type TEXT NOT NULL
device_id TEXT NOT NULL
phone TEXT NOT NULL
speed TEXT
expiry_date TIMESTAMP WITH TIME ZONE NOT NULL
status TEXT NOT NULL DEFAULT 'active'
config_url TEXT
file_extension TEXT
created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
```

#### Drizzle Schema Columns
```typescript
id: text("id").primaryKey()
orderId: text("order_id").notNull()
network: text("network").notNull()
planName: text("plan_name").notNull()
planType: text("plan_type").notNull()
duration: text("duration").notNull()
appType: text("app_type").notNull()
deviceId: text("device_id").notNull()
phone: text("phone").notNull()
speed: text("speed")
expiryDate: timestamp("expiry_date", { withTimezone: true }).notNull()
status: text("status").notNull().default("active")
configUrl: text("config_url")
fileExtension: text("file_extension")
createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
```

#### Missing Columns
None

#### Extra Columns
None

#### Nullable Mismatches
None

#### Type Mismatches
None

#### API Routes Using Table
1. **GET /plans** - Lists user plans by phone or deviceId
2. **POST /orders/free** - Creates user plan after free order
3. **POST /admin/orders/:id/fulfill** - Creates user plan when order is fulfilled
4. **POST /payment/** routes - Creates user plans on payment completion

#### Frontend Pages Using API
1. **dashboard.tsx** - Calls `/api/plans` to display active user plans
2. **check-expiry.tsx** - Uses plans data to check expiration status
3. **admin.tsx** - Indirectly uses plans via order fulfillment

#### Risk Assessment
🟢 **SAFE:** Table fully defined and migrated. No schema mismatches.

---

### 5. DEVICES
**Status:** ❌ NOT DEFINED

#### Actual PostgreSQL Columns
```
NOT CREATED - No migration found
```

#### Drizzle Schema Columns
```
NOT DEFINED - No schema file exists
```

#### Missing Columns
- N/A

#### Extra Columns
- N/A

#### API Routes Using Table
None found

#### Frontend Pages Using API
None found

#### Risk Assessment
🔴 **CRITICAL:** No table or schema defined. Referenced in user_plans (device_id field) but no dedicated devices table to manage device registration, naming, or properties. This represents incomplete feature implementation.

#### Potential Implications
- If device management features are needed, this table must be created
- Currently, devices are only tracked by device_id (UUID string) with no associated metadata
- No way to store device names, types, models, last-seen timestamps, or other properties

---

### 6. LOGIN_HISTORY
**Status:** ❌ NOT DEFINED

#### Actual PostgreSQL Columns
```
NOT CREATED - No migration found
```

#### Drizzle Schema Columns
```
NOT DEFINED - No schema file exists
```

#### Missing Columns
- N/A

#### Extra Columns
- N/A

#### API Routes Using Table
None found

#### Frontend Pages Using API
None found

#### Risk Assessment
🔴 **CRITICAL:** No table or schema defined. No audit trail of user login attempts, times, or IP addresses. This creates security and compliance concerns:
- No security audit trail
- Cannot detect suspicious login attempts
- No compliance tracking for access logs
- No way to invalidate sessions on demand

---

### 7. CONTACT_MESSAGES
**Status:** ✅ DEFINED AND IN MIGRATIONS (No issues)

#### Actual PostgreSQL Columns
```sql
id TEXT PRIMARY KEY
name TEXT NOT NULL
email TEXT NOT NULL
phone TEXT
subject TEXT
message TEXT NOT NULL
created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
```

#### Drizzle Schema Columns
```typescript
id: text("id").primaryKey()
name: text("name").notNull()
email: text("email").notNull()
phone: text("phone")
subject: text("subject")
message: text("message").notNull()
createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
```

#### Missing Columns
None

#### Extra Columns
None

#### Nullable Mismatches
None

#### Type Mismatches
None

#### API Routes Using Table
1. **POST /contact** - Submits contact messages from frontend form

#### Frontend Pages Using API
1. **contact.tsx** - Calls `POST /api/contact` to submit contact form

#### Risk Assessment
🟢 **SAFE:** Table fully defined and migrated. No schema mismatches.

---

## Critical Findings Summary

### 🔴 CRITICAL ISSUES (Blocking)

#### 1. User Profiles Table Missing from Migrations
**Problem:** The `user_profiles` table is defined in the Drizzle schema but **not created in any migration file**. This causes:
- ❌ Runtime errors when signing up (new users cannot be created)
- ❌ Runtime errors when loading account page
- ❌ Runtime errors when updating profiles
- ❌ Runtime errors when sending announcements to subscribers

**Evidence:**
```
Migration files scanned: 0001_init.sql, 0002_add_name_to_config_servers.sql
Result: user_profiles NOT FOUND in either file
```

**Current API Impact:**
```
POST   /auth/profile/create          → Will fail: table does not exist
GET    /auth/profile/:supabaseUid    → Will fail: table does not exist  
PATCH  /auth/profile/:supabaseUid    → Will fail: table does not exist
POST   /admin/announcements/send     → Will fail: table does not exist
```

**Current Frontend Impact:**
- signup.tsx - Cannot create new accounts
- account.tsx - Cannot load or update profiles
- Any auth-dependent feature will break

#### 2. Four Tables Referenced in Code But Not Defined
**Tables:** `notifications`, `broadcast_notifications`, `devices`, `login_history`

**Status:** No Drizzle schema files exist, no migrations created

**Risk:** If these features are planned:
- Complete implementation needed from database design through API routes
- No data model exists
- No migration path

---

## Column-Level Audit

### Config Servers - Name/Server_Name Duplication
**Issue:** Both `name` and `server_name` columns exist with redundant data

```sql
-- Migration 0002 adds name column
ALTER TABLE config_servers ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';
UPDATE config_servers SET name = server_name WHERE name = '' OR name IS NULL;
ALTER TABLE config_servers ALTER COLUMN name DROP DEFAULT;
```

**Current Drizzle Schema:**
```typescript
name: text("name").notNull(),
serverName: text("server_name").notNull(),
```

**Both values are populated identically:**
```typescript
// In admin-servers.ts
name: serverName,
serverName: serverName,
```

**Risk Level:** 🟡 **MEDIUM**
- Not a breaking issue but represents data redundancy
- Duplication increases data update complexity
- Future refactoring should consolidate to single field

---

## API Route Coverage Analysis

| Route | Table(s) | Status | Risk |
|-------|---------|--------|------|
| POST /auth/profile/create | user_profiles | ❌ NO TABLE | 🔴 CRITICAL |
| GET /auth/profile/:uid | user_profiles | ❌ NO TABLE | 🔴 CRITICAL |
| PATCH /auth/profile/:uid | user_profiles | ❌ NO TABLE | 🔴 CRITICAL |
| GET /plans | user_plans | ✅ OK | 🟢 SAFE |
| POST /orders | orders, config_servers, user_plans | ✅ OK | 🟢 SAFE |
| GET /orders/:id | orders | ✅ OK | 🟢 SAFE |
| POST /orders/free | orders, config_servers, user_plans | ✅ OK | 🟢 SAFE |
| GET /orders/:id/download | orders, config_servers | ✅ OK | 🟢 SAFE |
| POST /admin/orders | orders | ✅ OK | 🟢 SAFE |
| POST /admin/orders/:id/fulfill | orders, config_servers, user_plans | ✅ OK | 🟢 SAFE |
| PATCH /admin/orders/:id/status | orders | ✅ OK | 🟢 SAFE |
| GET /admin/servers | config_servers | ✅ OK | 🟢 SAFE |
| POST /admin/servers | config_servers | ✅ OK | 🟢 SAFE |
| POST /admin/servers/metadata | config_servers | ✅ OK | 🟢 SAFE |
| PATCH /admin/servers/:id | config_servers | ✅ OK | 🟢 SAFE |
| PUT /admin/servers/:id/file | config_servers | ✅ OK | 🟢 SAFE |
| DELETE /admin/servers/:id | config_servers | ✅ OK | 🟢 SAFE |
| GET /admin/servers/:id/download | config_servers | ✅ OK | 🟢 SAFE |
| POST /contact | contact_messages | ✅ OK | 🟢 SAFE |
| POST /admin/announcements/send | user_profiles | ❌ NO TABLE | 🔴 CRITICAL |
| POST /payment/initiate | orders | ✅ OK | 🟢 SAFE |
| GET /payment/status/:ref | orders, config_servers, user_plans | ✅ OK | 🟢 SAFE |

---

## Frontend Page Impact Analysis

| Page | API Routes Used | Tables Required | Status |
|------|-----------------|-----------------|--------|
| signup.tsx | POST /auth/profile/create | user_profiles | 🔴 BROKEN |
| account.tsx | GET/PATCH /auth/profile/:id | user_profiles | 🔴 BROKEN |
| dashboard.tsx | GET /plans, GET /orders | user_plans, orders | 🟢 OK |
| contact.tsx | POST /contact | contact_messages | 🟢 OK |
| admin.tsx | GET/POST/PATCH /admin/orders, /admin/servers | orders, config_servers | 🟢 OK |
| checkout.tsx | POST /orders, POST /payment/* | orders, config_servers, user_plans | 🟢 OK |
| order-status.tsx | GET /payment/status | orders | 🟢 OK |

---

## Recommendations

### IMMEDIATE ACTIONS REQUIRED (Before Production)

1. **Create user_profiles migration**
   - Add migration file: `lib/db/migrations/0003_create_user_profiles.sql`
   - Must include all 12 columns from Drizzle schema
   - Must run before any signup flow is enabled

2. **Clarify missing table requirements**
   - Confirm if `notifications` and `broadcast_notifications` are needed
   - Confirm if `devices` table is needed for device management features
   - Confirm if `login_history` is required for security/compliance

3. **Review config_servers duplication**
   - Decide: keep both `name` and `server_name` or consolidate to one
   - If consolidating, plan deprecation of unused column

### MEDIUM PRIORITY

4. Add schema validation tests to catch similar issues
5. Document expected table structure in schema files
6. Consider adding database initialization script for new deployments

---

## Appendix: Schema File Locations

**Defined Schemas:**
- `lib/db/src/schema/user_profiles.ts` ✅
- `lib/db/src/schema/user_plans.ts` ✅
- `lib/db/src/schema/config_servers.ts` ✅
- `lib/db/src/schema/contact_messages.ts` ✅
- `lib/db/src/schema/orders.ts` ✅

**Missing Schemas:**
- `lib/db/src/schema/notifications.ts` ❌
- `lib/db/src/schema/broadcast_notifications.ts` ❌
- `lib/db/src/schema/devices.ts` ❌
- `lib/db/src/schema/login_history.ts` ❌

**Migration Files:**
- `lib/db/migrations/0001_init.sql` - Creates: orders, user_plans, contact_messages, config_servers
- `lib/db/migrations/0002_add_name_to_config_servers.sql` - Adds name column to config_servers
- ❌ Missing: user_profiles migration

---

**Report Generated:** 2026-06-10
**Status:** Ready for review - NO MODIFICATIONS MADE
