# Database Schema Fix - UUID Type Mismatch

## Problem
The Supabase deployment failed with error:
```
ERROR: 42804: foreign key constraint "notification_preferences_user_id_fkey" cannot be implemented
DETAIL: Key columns "user_id" and "id" are of incompatible types: text and uuid.
```

## Root Cause
The new schema files (`notification_preferences.ts`, `active_sessions.ts`, `email_logs.ts`) defined:
- Primary key `id` as TEXT type
- Foreign key `user_id` as TEXT type

However, the actual `user_profiles` table in Supabase has:
- Primary key `id` as UUID type (not TEXT)
- Therefore, all foreign keys referencing it must also be UUID type

## Solution Applied
Changed all three schema files to use UUID types:

**Before:**
```typescript
id: text("id").primaryKey(),
userId: text("user_id").notNull().references(() => userProfilesTable.id)
```

**After:**
```typescript
id: uuid("id").primaryKey().defaultRandom(),
userId: uuid("user_id").notNull().references(() => userProfilesTable.id)
```

## Schema Files Updated
1. `/lib/db/src/schema/notification_preferences.ts` - UUID id and user_id
2. `/lib/db/src/schema/active_sessions.ts` - UUID id and user_id  
3. `/lib/db/src/schema/email_logs.ts` - UUID id and user_id

## New SQL Migration
File: `CORRECTED_DATABASE_MIGRATIONS.sql`

Run this corrected migration in Supabase SQL editor to create all three tables with proper UUID types. The migration includes:
- 3 new tables with UUID primary and foreign keys
- 7 new security columns added to user_profiles
- Proper indexes on all foreign key columns
- Cascade delete rules for referential integrity

## Next Steps
1. Delete the failed migration queries from Supabase
2. Run `CORRECTED_DATABASE_MIGRATIONS.sql` in Supabase SQL editor
3. Rebuild and redeploy both frontend and backend
4. The UUID type now matches across all tables
