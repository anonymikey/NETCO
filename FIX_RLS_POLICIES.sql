-- Fix Row-Level Security (RLS) policies for all account management tables
-- Run this SQL in Supabase SQL Editor to enable users to manage their own records

-- ============================================================================
-- 1. Enable RLS on new tables (if not already enabled)
-- ============================================================================

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. Notification Preferences Policies
-- ============================================================================

-- Allow users to view their own notification preferences
CREATE POLICY "Users can view own notification preferences"
ON notification_preferences
FOR SELECT
USING (auth.uid()::text = user_id::text);

-- Allow users to insert their own notification preferences
CREATE POLICY "Users can insert own notification preferences"
ON notification_preferences
FOR INSERT
WITH CHECK (auth.uid()::text = user_id::text);

-- Allow users to update their own notification preferences
CREATE POLICY "Users can update own notification preferences"
ON notification_preferences
FOR UPDATE
USING (auth.uid()::text = user_id::text)
WITH CHECK (auth.uid()::text = user_id::text);

-- Allow users to delete their own notification preferences
CREATE POLICY "Users can delete own notification preferences"
ON notification_preferences
FOR DELETE
USING (auth.uid()::text = user_id::text);

-- ============================================================================
-- 3. Active Sessions Policies
-- ============================================================================

-- Allow users to view their own sessions
CREATE POLICY "Users can view own sessions"
ON active_sessions
FOR SELECT
USING (auth.uid()::text = user_id::text);

-- Allow users to insert their own sessions
CREATE POLICY "Users can insert own sessions"
ON active_sessions
FOR INSERT
WITH CHECK (auth.uid()::text = user_id::text);

-- Allow users to delete their own sessions
CREATE POLICY "Users can delete own sessions"
ON active_sessions
FOR DELETE
USING (auth.uid()::text = user_id::text);

-- ============================================================================
-- 4. Email Logs Policies
-- ============================================================================

-- Allow users to view their own email logs
CREATE POLICY "Users can view own email logs"
ON email_logs
FOR SELECT
USING (auth.uid()::text = user_id::text);

-- Allow service role to insert email logs (admin email sending)
CREATE POLICY "Service role can insert email logs"
ON email_logs
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Allow service role to update email logs (tracking delivery status)
CREATE POLICY "Service role can update email logs"
ON email_logs
FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 5. User Profiles Policy (ensure avatar updates work)
-- ============================================================================

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON user_profiles
FOR UPDATE
USING (auth.uid()::text = supabase_uid)
WITH CHECK (auth.uid()::text = supabase_uid);

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
ON user_profiles
FOR SELECT
USING (auth.uid()::text = supabase_uid);

-- ============================================================================
-- 6. Create Supabase Storage bucket policy for user avatars
-- ============================================================================

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow users to upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'user-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to avatars
CREATE POLICY "Public can read avatars"
ON storage.objects
FOR SELECT
USING (bucket_id = 'user-avatars');

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'user-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================================
-- Notes:
-- - All policies compare auth.uid() (which is UUID) with user_id/supabase_uid (which are now UUID)
-- - Service role has elevated permissions for admin email sending
-- - Storage bucket allows users to upload to their own folder
-- ============================================================================
