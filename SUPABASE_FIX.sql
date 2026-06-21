-- CRITICAL: Execute this SQL in Supabase to fix user_plans schema mismatch
-- This reconciles the database schema with what the application code expects
-- The current Supabase table has wrong columns, this recreates it correctly

-- Step 1: Drop the mismatched table
DROP TABLE IF EXISTS user_plans CASCADE;

-- Step 2: Recreate user_plans with correct schema matching Drizzle ORM definition
CREATE TABLE user_plans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_profiles(id),
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

-- Step 3: Create performance indices
CREATE INDEX idx_user_plans_order_id ON user_plans(order_id);
CREATE INDEX idx_user_plans_status ON user_plans(status);
CREATE INDEX idx_user_plans_user_id ON user_plans(user_id);

-- Verification query (run this after to confirm schema)
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns 
-- WHERE table_name = 'user_plans' ORDER BY ordinal_position;
