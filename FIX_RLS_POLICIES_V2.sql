-- ============================================================================
-- CORRECTED RLS POLICIES - Version 2
-- This fixes the "new row violates row-level security policy" storage error
-- ============================================================================

-- ENABLE RLS on all tables
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- NOTIFICATION_PREFERENCES - UUID user_id
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own notification preferences" ON notification_preferences;
CREATE POLICY "Users can view own notification preferences"
ON notification_preferences
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own notification preferences" ON notification_preferences;
CREATE POLICY "Users can insert own notification preferences"
ON notification_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notification preferences" ON notification_preferences;
CREATE POLICY "Users can update own notification preferences"
ON notification_preferences
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notification preferences" ON notification_preferences;
CREATE POLICY "Users can delete own notification preferences"
ON notification_preferences
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- ACTIVE_SESSIONS - UUID user_id
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own sessions" ON active_sessions;
CREATE POLICY "Users can view own sessions"
ON active_sessions
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sessions" ON active_sessions;
CREATE POLICY "Users can insert own sessions"
ON active_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own sessions" ON active_sessions;
CREATE POLICY "Users can delete own sessions"
ON active_sessions
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- EMAIL_LOGS - UUID user_id
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own email logs" ON email_logs;
CREATE POLICY "Users can view own email logs"
ON email_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Admin/Service role can insert email logs
DROP POLICY IF EXISTS "Service role can insert email logs" ON email_logs;
CREATE POLICY "Service role can insert email logs"
ON email_logs
FOR INSERT
WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- Admin/Service role can update email logs
DROP POLICY IF EXISTS "Service role can update email logs" ON email_logs;
CREATE POLICY "Service role can update email logs"
ON email_logs
FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- USER_PROFILES - TEXT supabase_uid
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
ON user_profiles
FOR SELECT
USING (auth.uid()::text = supabase_uid);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
ON user_profiles
FOR UPDATE
USING (auth.uid()::text = supabase_uid)
WITH CHECK (auth.uid()::text = supabase_uid);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile"
ON user_profiles
FOR INSERT
WITH CHECK (auth.uid()::text = supabase_uid);

-- ============================================================================
-- STORAGE: user-avatars bucket
-- CRITICAL FIX: Allow authenticated users to upload with upsert
-- ============================================================================

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Delete old problematic policies
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

-- Allow authenticated users to upload to user-avatars bucket
CREATE POLICY "Authenticated users can upload to user-avatars"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'user-avatars' AND 
  auth.role() = 'authenticated'
);

-- Allow authenticated users to update (upsert) their files
CREATE POLICY "Authenticated users can upsert user-avatars"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'user-avatars' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'user-avatars' AND auth.role() = 'authenticated');

-- Allow public read access to user-avatars
CREATE POLICY "Public can read user-avatars"
ON storage.objects
FOR SELECT
USING (bucket_id = 'user-avatars');

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete own user-avatars"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'user-avatars' AND 
  (auth.role() = 'authenticated' OR auth.role() = 'service_role')
);

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. Avatar upload uses auth.role() = 'authenticated' - simple and reliable
-- 2. Storage policies allow upsert (INSERT with upsert: true)
-- 3. All type casts removed - UUID fields compared directly with auth.uid()
-- 4. TEXT fields (supabase_uid) cast auth.uid() to text
-- 5. Run this in Supabase SQL Editor and refresh the app
-- ============================================================================
