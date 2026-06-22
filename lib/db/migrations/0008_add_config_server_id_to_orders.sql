-- Add configServerId foreign key to orders table
-- This links each fulfilled order to the specific config server used

ALTER TABLE orders ADD COLUMN config_server_id TEXT;

-- Add foreign key constraint
ALTER TABLE orders ADD CONSTRAINT orders_config_server_id_fkey 
  FOREIGN KEY (config_server_id) REFERENCES config_servers(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX idx_orders_config_server_id ON orders(config_server_id);
