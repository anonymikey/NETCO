# NETCO Platform - Error Fixes Summary

## Issues Fixed

### 1. Vercel Build Error: Missing Export
**Error:** 
```
No matching export in "../../lib/db/src/schema/user_profiles.ts" for import "userProfiles"
```

**Root Cause:** 
- The notifications schema was importing `userProfiles` but the actual export name is `userProfilesTable`

**Fix Applied:**
- Updated `/lib/db/src/schema/notifications.ts` line 2:
  - Changed: `import { userProfiles } from "./user_profiles";`
  - To: `import { userProfilesTable } from "./user_profiles";`
- Updated the foreign key reference:
  - Changed: `.references(() => userProfiles.supabaseUid, ...)`
  - To: `.references(() => userProfilesTable.supabaseUid, ...)`

**Status:** ✅ Fixed

---

### 2. Supabase SQL Error: Type Mismatch
**Error:**
```
Foreign key constraint "notifications_user_id_fkey" cannot be implemented
Key columns "user_id" and "supabase_uid" are of incompatible types: uuid and text.
```

**Root Cause:**
- The notifications schema was defining `user_id` as UUID type
- But `supabase_uid` in `user_profiles` table is TEXT type
- Foreign key constraints require matching types

**Fixes Applied:**

1. **Updated Drizzle Schema** (`/lib/db/src/schema/notifications.ts`):
   - Changed: `userId: uuid("user_id")`
   - To: `userId: text("user_id")`

2. **Updated SQL Setup** (`/NOTIFICATION_SCHEMA_SETUP.sql`):
   - Changed: `user_id UUID NOT NULL REFERENCES user_profiles(supabase_uid)`
   - To: `user_id TEXT NOT NULL REFERENCES user_profiles(supabase_uid)`

3. **Fixed RLS Policies** (with type casting):
   ```sql
   -- Before: user_id = auth.uid()
   -- After: user_id = auth.uid()::text
   ```

4. **Updated Function Signature**:
   - Changed: `FUNCTION mark_notification_read(notification_id UUID, user_id UUID)`
   - To: `FUNCTION mark_notification_read(notification_id UUID, user_id TEXT)`

**Status:** ✅ Fixed

---

## Next Steps

### 1. Deploy Code Changes
Run the build again - it should now pass:
```bash
pnpm install && pnpm -r run build
```

### 2. Run Updated SQL in Supabase
1. Go to your Supabase project → SQL Editor
2. Copy the entire content from `/NOTIFICATION_SCHEMA_SETUP.sql`
3. Paste into the SQL Editor
4. Click "Run" to execute

The notifications system is now ready to use!

---

## Verification Checklist

- [ ] Vercel build completes successfully
- [ ] Supabase SQL queries execute without errors
- [ ] NotificationBell component appears in navbar for logged-in users
- [ ] Can view notifications from the bell dropdown
- [ ] Notifications appear when admin sends them via API
- [ ] RLS policies work (users only see their own notifications)
