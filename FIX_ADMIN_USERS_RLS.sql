-- Fix: Allow admins to view all user profiles
-- The user_profiles table needs a policy that allows admins (is_admin = true) to select all users

-- First, check if user_profiles has is_admin column
-- If not, we need to add it or use a junction table for admin roles

-- Drop existing problematic policies if any
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Create new policies
-- 1. Allow users to view their own profile
CREATE POLICY "Users can view own profile"
ON user_profiles
FOR SELECT
USING (auth.uid()::text = supabase_uid);

-- 2. Allow admins to view all profiles
-- Assumes there's an is_admin column in user_profiles
CREATE POLICY "Admins can view all profiles"
ON user_profiles
FOR SELECT
USING (
  -- Either viewing own profile
  auth.uid()::text = supabase_uid OR
  -- Or user is admin
  (SELECT is_admin FROM user_profiles WHERE supabase_uid = auth.uid()::text LIMIT 1) = true
);

-- 3. Allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
ON user_profiles
FOR INSERT
WITH CHECK (auth.uid()::text = supabase_uid);

-- 4. Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON user_profiles
FOR UPDATE
USING (auth.uid()::text = supabase_uid)
WITH CHECK (auth.uid()::text = supabase_uid);

-- 5. Allow admins to update any profile
CREATE POLICY "Admins can update any profile"
ON user_profiles
FOR UPDATE
USING ((SELECT is_admin FROM user_profiles WHERE supabase_uid = auth.uid()::text LIMIT 1) = true)
WITH CHECK ((SELECT is_admin FROM user_profiles WHERE supabase_uid = auth.uid()::text LIMIT 1) = true);
