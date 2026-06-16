-- Remove plan_name column from orders table
-- This column should only exist in user_plans, not orders
-- Schema drift fix: the orders table was created without this column in 0001_init.sql
ALTER TABLE orders
DROP COLUMN IF EXISTS plan_name;
