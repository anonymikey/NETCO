-- Complete reconciliation of user_plans table schema
-- The current Supabase table has incorrect columns and is missing critical fields
-- Since the table is empty, we drop and recreate it to match the Drizzle schema exactly

-- Drop the existing user_plans table
DROP TABLE IF EXISTS user_plans CASCADE;

-- Recreate user_plans table with correct schema matching Drizzle ORM definition
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

-- Create indices for query performance (matching 0001_init.sql)
CREATE INDEX idx_user_plans_order_id ON user_plans(order_id);
CREATE INDEX idx_user_plans_status ON user_plans(status);
