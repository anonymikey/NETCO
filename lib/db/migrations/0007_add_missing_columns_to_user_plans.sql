-- Ensure user_plans table has all required columns from Drizzle schema
-- This migration adds any columns that may be missing due to schema drift

ALTER TABLE user_plans
ADD COLUMN IF NOT EXISTS order_id TEXT NOT NULL DEFAULT '';

-- Create index for order_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_user_plans_order_id ON user_plans(order_id);

-- If the table is now properly structured, data can be safely used
