-- Add name column to config_servers table (maps to 'name' database column)
-- This ensures both 'name' and 'server_name' columns are populated for data consistency
ALTER TABLE config_servers
ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';

-- Update existing records to populate name column from server_name
UPDATE config_servers
SET name = server_name
WHERE name = '' OR name IS NULL;

-- Remove the default so future inserts must explicitly provide the value
ALTER TABLE config_servers
ALTER COLUMN name DROP DEFAULT;
