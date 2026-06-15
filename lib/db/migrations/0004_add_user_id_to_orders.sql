-- Link orders to the authenticated user profile (required for paid checkout)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES user_profiles(id);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
