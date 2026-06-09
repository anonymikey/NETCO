-- NETCO Platform Complete Supabase Schema
-- Run this SQL in your Supabase SQL Editor

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT PRIMARY KEY,
  supabase_uid TEXT NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  username VARCHAR(50) UNIQUE,
  phone VARCHAR(20),
  country VARCHAR(100),
  timezone VARCHAR(100),
  bio TEXT,
  avatar_url TEXT,
  is_email_verified BOOLEAN NOT NULL DEFAULT false,
  is_phone_verified BOOLEAN NOT NULL DEFAULT false,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  newsletter_subscribed BOOLEAN NOT NULL DEFAULT true,
  preferred_theme VARCHAR(20) DEFAULT 'system',
  preferred_language VARCHAR(10) DEFAULT 'en',
  notification_preferences JSONB DEFAULT '{"email": true, "orders": true, "payments": true, "promotional": false, "securityAlerts": true}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on supabase_uid for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_supabase_uid ON user_profiles(supabase_uid);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  package_id TEXT NOT NULL,
  supabase_uid TEXT NOT NULL REFERENCES user_profiles(supabase_uid) ON DELETE CASCADE,
  network VARCHAR(50) NOT NULL,
  duration VARCHAR(50) NOT NULL,
  app_type VARCHAR(50) NOT NULL,
  device_id TEXT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  payment_reference VARCHAR(255),
  config_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_orders_supabase_uid ON orders(supabase_uid);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- User Plans Table
CREATE TABLE IF NOT EXISTS user_plans (
  id TEXT PRIMARY KEY,
  supabase_uid TEXT NOT NULL REFERENCES user_profiles(supabase_uid) ON DELETE CASCADE,
  order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
  network VARCHAR(50) NOT NULL,
  plan_name VARCHAR(255),
  plan_type VARCHAR(50),
  duration VARCHAR(50) NOT NULL,
  app_type VARCHAR(50) NOT NULL,
  device_id TEXT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  config_url TEXT,
  file_extension VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_user_plans_supabase_uid ON user_plans(supabase_uid);
CREATE INDEX IF NOT EXISTS idx_user_plans_status ON user_plans(status);
CREATE INDEX IF NOT EXISTS idx_user_plans_expiry_date ON user_plans(expiry_date);

-- Config Servers Table
CREATE TABLE IF NOT EXISTS config_servers (
  id TEXT PRIMARY KEY,
  server_name VARCHAR(255) NOT NULL,
  network VARCHAR(50) NOT NULL,
  app_type VARCHAR(50) NOT NULL,
  duration VARCHAR(50) NOT NULL,
  plan_type VARCHAR(50),
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_size BIGINT,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_config_servers_network ON config_servers(network);
CREATE INDEX IF NOT EXISTS idx_config_servers_status ON config_servers(status);

-- Contact Messages Table
CREATE TABLE IF NOT EXISTS contact_messages (
  id TEXT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON contact_messages(email);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES user_profiles(supabase_uid) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  icon VARCHAR(20),
  is_read BOOLEAN DEFAULT false,
  action_url VARCHAR(255),
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at);

-- Broadcast Notifications Table
CREATE TABLE IF NOT EXISTS broadcast_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  target_audience VARCHAR(50) NOT NULL,
  delivery_method VARCHAR(50) NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  read_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_broadcast_scheduled ON broadcast_notifications(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_broadcast_created ON broadcast_notifications(created_at);

-- Devices Table (for device management)
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES user_profiles(supabase_uid) ON DELETE CASCADE,
  device_name VARCHAR(255) NOT NULL,
  device_type VARCHAR(50) NOT NULL,
  browser VARCHAR(100),
  os VARCHAR(100),
  ip_address INET,
  user_agent TEXT,
  is_trusted BOOLEAN DEFAULT false,
  last_active TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_last_active ON devices(last_active);

-- Login History Table (for security audit logs)
CREATE TABLE IF NOT EXISTS login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES user_profiles(supabase_uid) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  browser VARCHAR(100),
  os VARCHAR(100),
  status VARCHAR(50) NOT NULL,
  failure_reason VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_created_at ON login_history(created_at);
CREATE INDEX IF NOT EXISTS idx_login_history_user_created ON login_history(user_id, created_at);

-- Add missing columns to existing tables if they don't have them
-- This won't fail if columns already exist in PostgreSQL
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS timezone VARCHAR(100);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS preferred_theme VARCHAR(20) DEFAULT 'system';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'en';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "orders": true, "payments": true, "promotional": false, "securityAlerts": true}';

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can read their own profile" ON user_profiles
  FOR SELECT USING (auth.uid()::text = supabase_uid);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid()::text = supabase_uid);

-- RLS Policies for orders
CREATE POLICY "Users can read their own orders" ON orders
  FOR SELECT USING (auth.uid()::text = supabase_uid);

-- RLS Policies for notifications
CREATE POLICY "Users can read their own notifications" ON notifications
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid()::text = user_id);

-- RLS Policies for devices
CREATE POLICY "Users can read their own devices" ON devices
  FOR SELECT USING (auth.uid()::text = user_id);

-- RLS Policies for login_history
CREATE POLICY "Users can read their own login history" ON login_history
  FOR SELECT USING (auth.uid()::text = user_id);
