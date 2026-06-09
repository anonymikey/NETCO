-- ============================================================
-- NETCO Platform Database Schema for Supabase
-- This script creates all necessary tables for the NETCO VPN platform
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. USER PROFILES TABLE (Extended with new fields)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id TEXT PRIMARY KEY,
  supabase_uid TEXT NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  username VARCHAR(50) UNIQUE,
  phone VARCHAR(20),
  country VARCHAR(100),
  timezone VARCHAR(100),
  bio TEXT,
  avatar_url TEXT,
  is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  newsletter_subscribed BOOLEAN NOT NULL DEFAULT TRUE,
  preferred_theme VARCHAR(20) DEFAULT 'system',
  preferred_language VARCHAR(10) DEFAULT 'en',
  notification_preferences JSONB DEFAULT '{
    "email": true,
    "orders": true,
    "payments": true,
    "promotional": false,
    "securityAlerts": true
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for user_profiles
CREATE INDEX idx_user_profiles_supabase_uid ON public.user_profiles(supabase_uid);
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_username ON public.user_profiles(username);

-- ============================================================
-- 2. ORDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  supabase_uid TEXT NOT NULL REFERENCES public.user_profiles(supabase_uid) ON DELETE CASCADE,
  plan_name VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'KES',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(50),
  transaction_id TEXT,
  notes TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for orders
CREATE INDEX idx_orders_supabase_uid ON public.orders(supabase_uid);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at);
CREATE INDEX idx_orders_supabase_uid_created ON public.orders(supabase_uid, created_at);

-- ============================================================
-- 3. USER PLANS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_plans (
  id TEXT PRIMARY KEY,
  supabase_uid TEXT NOT NULL REFERENCES public.user_profiles(supabase_uid) ON DELETE CASCADE,
  plan_type VARCHAR(50) NOT NULL,
  plan_name VARCHAR(100) NOT NULL,
  duration_days INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  activated_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for user_plans
CREATE INDEX idx_user_plans_supabase_uid ON public.user_plans(supabase_uid);
CREATE INDEX idx_user_plans_status ON public.user_plans(status);
CREATE INDEX idx_user_plans_expires_at ON public.user_plans(expires_at);

-- ============================================================
-- 4. CONFIG SERVERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.config_servers (
  id TEXT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  network VARCHAR(50) NOT NULL,
  app_type VARCHAR(50) NOT NULL,
  file_path TEXT,
  file_size_kb INTEGER,
  version VARCHAR(20),
  is_available BOOLEAN DEFAULT TRUE,
  description TEXT,
  setup_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for config_servers
CREATE INDEX idx_config_servers_network ON public.config_servers(network);
CREATE INDEX idx_config_servers_app_type ON public.config_servers(app_type);
CREATE INDEX idx_config_servers_is_available ON public.config_servers(is_available);

-- ============================================================
-- 5. NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_uid TEXT NOT NULL REFERENCES public.user_profiles(supabase_uid) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  icon VARCHAR(20),
  is_read BOOLEAN DEFAULT FALSE,
  action_url VARCHAR(255),
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for notifications
CREATE INDEX idx_notifications_supabase_uid ON public.notifications(supabase_uid);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX idx_notifications_supabase_uid_created ON public.notifications(supabase_uid, created_at);

-- ============================================================
-- 6. BROADCAST NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.broadcast_notifications (
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

-- Create indexes for broadcast_notifications
CREATE INDEX idx_broadcast_notifications_scheduled_at ON public.broadcast_notifications(scheduled_at);
CREATE INDEX idx_broadcast_notifications_created_at ON public.broadcast_notifications(created_at);

-- ============================================================
-- 7. DEVICES TABLE (Device management for security)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_uid TEXT NOT NULL REFERENCES public.user_profiles(supabase_uid) ON DELETE CASCADE,
  device_name VARCHAR(100) NOT NULL,
  device_type VARCHAR(50) NOT NULL,
  browser VARCHAR(100),
  os VARCHAR(100),
  ip_address VARCHAR(45),
  is_active BOOLEAN DEFAULT TRUE,
  last_active_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for devices
CREATE INDEX idx_devices_supabase_uid ON public.devices(supabase_uid);
CREATE INDEX idx_devices_is_active ON public.devices(is_active);

-- ============================================================
-- 8. LOGIN HISTORY TABLE (Security audit trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_uid TEXT NOT NULL REFERENCES public.user_profiles(supabase_uid) ON DELETE CASCADE,
  ip_address VARCHAR(45),
  browser VARCHAR(100),
  os VARCHAR(100),
  device_type VARCHAR(50),
  login_status VARCHAR(20) NOT NULL,
  login_method VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for login_history
CREATE INDEX idx_login_history_supabase_uid ON public.login_history(supabase_uid);
CREATE INDEX idx_login_history_created_at ON public.login_history(created_at);
CREATE INDEX idx_login_history_supabase_uid_created ON public.login_history(supabase_uid, created_at);

-- ============================================================
-- 9. CONTACT MESSAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id TEXT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for contact_messages
CREATE INDEX idx_contact_messages_status ON public.contact_messages(status);
CREATE INDEX idx_contact_messages_created_at ON public.contact_messages(created_at);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

-- Allow read access to config_servers and broadcast_notifications (public data)
ALTER TABLE public.config_servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- USER PROFILES RLS POLICIES
-- ============================================================
-- Users can read their own profile
CREATE POLICY "Users can read their own profile" ON public.user_profiles
  FOR SELECT
  USING (auth.uid()::text = supabase_uid);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE
  USING (auth.uid()::text = supabase_uid);

-- Service role can do everything
CREATE POLICY "Service role can do everything" ON public.user_profiles
  USING (auth.role() = 'service_role');

-- ============================================================
-- ORDERS RLS POLICIES
-- ============================================================
-- Users can read their own orders
CREATE POLICY "Users can read their own orders" ON public.orders
  FOR SELECT
  USING (auth.uid()::text = supabase_uid);

-- Service role can do everything
CREATE POLICY "Service role can do everything on orders" ON public.orders
  USING (auth.role() = 'service_role');

-- ============================================================
-- USER PLANS RLS POLICIES
-- ============================================================
-- Users can read their own plans
CREATE POLICY "Users can read their own user plans" ON public.user_plans
  FOR SELECT
  USING (auth.uid()::text = supabase_uid);

-- Service role can do everything
CREATE POLICY "Service role can do everything on user plans" ON public.user_plans
  USING (auth.role() = 'service_role');

-- ============================================================
-- NOTIFICATIONS RLS POLICIES
-- ============================================================
-- Users can read their own notifications
CREATE POLICY "Users can read their own notifications" ON public.notifications
  FOR SELECT
  USING (auth.uid()::text = supabase_uid);

-- Users can update their own notifications
CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE
  USING (auth.uid()::text = supabase_uid);

-- Service role can do everything
CREATE POLICY "Service role can do everything on notifications" ON public.notifications
  USING (auth.role() = 'service_role');

-- ============================================================
-- DEVICES RLS POLICIES
-- ============================================================
-- Users can read their own devices
CREATE POLICY "Users can read their own devices" ON public.devices
  FOR SELECT
  USING (auth.uid()::text = supabase_uid);

-- Users can delete their own devices
CREATE POLICY "Users can delete their own devices" ON public.devices
  FOR DELETE
  USING (auth.uid()::text = supabase_uid);

-- Service role can do everything
CREATE POLICY "Service role can do everything on devices" ON public.devices
  USING (auth.role() = 'service_role');

-- ============================================================
-- LOGIN HISTORY RLS POLICIES
-- ============================================================
-- Users can read their own login history
CREATE POLICY "Users can read their own login history" ON public.login_history
  FOR SELECT
  USING (auth.uid()::text = supabase_uid);

-- Service role can do everything
CREATE POLICY "Service role can do everything on login history" ON public.login_history
  USING (auth.role() = 'service_role');

-- ============================================================
-- CONFIG SERVERS RLS POLICIES (Public data)
-- ============================================================
-- Everyone can read config servers
CREATE POLICY "Everyone can read config servers" ON public.config_servers
  FOR SELECT
  USING (TRUE);

-- Service role can do everything
CREATE POLICY "Service role can do everything on config servers" ON public.config_servers
  USING (auth.role() = 'service_role');

-- ============================================================
-- BROADCAST NOTIFICATIONS RLS POLICIES (Public data)
-- ============================================================
-- Everyone can read broadcast notifications
CREATE POLICY "Everyone can read broadcast notifications" ON public.broadcast_notifications
  FOR SELECT
  USING (TRUE);

-- Service role can do everything
CREATE POLICY "Service role can do everything on broadcast notifications" ON public.broadcast_notifications
  USING (auth.role() = 'service_role');

-- ============================================================
-- SCHEMA VERIFICATION
-- ============================================================
-- Run this query to verify all tables were created successfully:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- ORDER BY table_name;
