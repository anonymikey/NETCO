# Fix RLS 403 Error - Row-Level Security Policies

## Problem
When uploading profile picture or managing preferences, you get:
```json
{
  "statusCode": "403",
  "error": "Unauthorized", 
  "message": "new row violates row-level security policy"
}
```

## Root Cause
The new tables (`notification_preferences`, `active_sessions`, `email_logs`) and the `user_profiles` table have RLS enabled but **no policies** allow authenticated users to read/write their own records.

## Solution: Run RLS Policies SQL

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard/project/[your-project-id]/sql/new
2. Click **SQL Editor** → **New Query**

### Step 2: Copy and Run the Script
Copy the entire contents of `FIX_RLS_POLICIES.sql` and paste it into the SQL editor.

Click **Run** to execute all policies at once.

### Step 3: Verify Policies Created
Go to **Authentication** → **Policies** in Supabase dashboard and verify:
- ✅ `notification_preferences` has 4 policies (SELECT, INSERT, UPDATE, DELETE)
- ✅ `active_sessions` has 3 policies (SELECT, INSERT, DELETE)
- ✅ `email_logs` has 3 policies (SELECT, INSERT for service_role, UPDATE for service_role)
- ✅ `user_profiles` has 2 policies (SELECT, UPDATE)
- ✅ `storage.objects` has 3 policies (INSERT, SELECT, DELETE) for `user-avatars` bucket

### Step 4: Test Upload
1. Refresh the app: https://netco.anonymiketech.online/account
2. Try uploading a profile picture
3. Should now work without 403 error ✅

## What Each Policy Does

| Table | Policy | Purpose |
|-------|--------|---------|
| notification_preferences | Users can view own | SELECT own records |
| notification_preferences | Users can insert own | INSERT own records |
| notification_preferences | Users can update own | UPDATE own records |
| notification_preferences | Users can delete own | DELETE own records |
| active_sessions | Users can view own | SELECT own sessions |
| active_sessions | Users can insert own | INSERT session logs |
| active_sessions | Users can delete own | LOGOUT - DELETE own sessions |
| email_logs | Users can view own | SELECT own email logs |
| email_logs | Service role can insert | ADMIN - Send emails via Resend |
| email_logs | Service role can update | ADMIN - Update delivery status |
| user_profiles | Users can update own | UPDATE avatar & preferences |
| user_profiles | Users can view own | SELECT own profile |
| storage.objects | Users can upload avatar | Upload to `user-avatars` bucket |
| storage.objects | Public can read avatars | Display avatar images publicly |
| storage.objects | Users can delete avatar | Remove avatar file |

## If You See Duplicate Policy Errors

If you get "duplicate policy" errors when running the SQL, it means those policies already exist. This is fine - just skip those or use the safer version with `IF NOT EXISTS`:

```sql
-- Safe version (only creates if not exists)
DROP POLICY IF EXISTS "Users can view own notification preferences" ON notification_preferences;
CREATE POLICY "Users can view own notification preferences"...
```

## Troubleshooting

**Still getting 403 after running policies?**
1. Hard refresh the app (Ctrl+Shift+R)
2. Clear browser cache
3. Check user is logged in (auth.uid() must be set)
4. Verify policies show in Supabase dashboard

**Avatar upload still fails?**
1. Check `user-avatars` storage bucket exists and is public
2. Verify storage bucket policies are created (3 policies)
3. Check bucket has RLS enabled

**Email sending fails?**
1. Verify `RESEND_API_KEY` is set in Render environment
2. Verify `email_logs` table has service_role policy for INSERT/UPDATE
3. Check admin has permission to send emails

## Result
After running the script, all operations should work:
- ✅ Upload profile picture
- ✅ Save account information
- ✅ Update preferences
- ✅ Manage notification settings
- ✅ View active sessions
- ✅ Admin can send emails
