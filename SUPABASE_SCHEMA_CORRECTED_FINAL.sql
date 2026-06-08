-- ============================================================
-- NETCO Platform Database Schema for Supabase (CORRECTED FINAL)
-- Fixes column naming inconsistencies
-- ============================================================

-- Drop all tables to start fresh
DROP TABLE IF EXISTS public.contact_messages CASCADE;
DROP TABLE IF EXISTS public.login_history CASCADE;
DROP TABLE IF EXISTS public.devices CASCADE;
DROP TABLE IF EXISTS public.broadcast_notifications CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.user_plans CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.config_servers CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1) USER PROFILES TABLE
-- ============================================================
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
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

CREATE INDEX idx_user_profiles_id ON public.user_profiles(id);
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_username ON public.user_profiles(username);

-- ============================================================
-- 2) ORDERS TABLE
-- ============================================================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,

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

CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at);
CREATE INDEX idx_orders_user_id_created ON public.orders(user_id, created_at);

-- ============================================================
-- 3) USER PLANS TABLE
-- ============================================================
CREATE TABLE public.user_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,

  plan_type VARCHAR(50) NOT NULL,
  plan_name VARCHAR(100) NOT NULL,
  duration_days INTEGER NOT NULL,

  status VARCHAR(50) NOT NULL DEFAULT 'active',
  activated_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_plans_user_id ON public.user_plans(user_id);
CREATE INDEX idx_user_plans_status ON public.user_plans(status);
CREATE INDEX idx_user_plans_expires_at ON public.user_plans(expires_at);

-- ============================================================
-- 4) CONFIG SERVERS TABLE (public data)
-- ============================================================
CREATE TABLE public.config_servers (
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

CREATE INDEX idx_config_servers_network ON public.config_servers(network);
CREATE INDEX idx_config_servers_app_type ON public.config_servers(app_type);
CREATE INDEX idx_config_servers_is_available ON public.config_servers(is_available);

-- ============================================================
-- 5) NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,

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

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX idx_notifications_user_id_created ON public.notifications(user_id, created_at);

-- ============================================================
-- 6) BROADCAST NOTIFICATIONS TABLE (public data)
-- ============================================================
CREATE TABLE public.broadcast_notifications (
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

CREATE INDEX idx_broadcast_notifications_scheduled_at ON public.broadcast_notifications(scheduled_at);
CREATE INDEX idx_broadcast_notifications_created_at ON public.broadcast_notifications(created_at);

-- ============================================================
-- 7) DEVICES TABLE
-- ============================================================
CREATE TABLE public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,

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

CREATE INDEX idx_devices_user_id ON public.devices(user_id);
CREATE INDEX idx_devices_is_active ON public.devices(is_active);

-- ============================================================
-- 8) LOGIN HISTORY TABLE
-- ============================================================
CREATE TABLE public.login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,

  ip_address VARCHAR(45),
  browser VARCHAR(100),
  os VARCHAR(100),
  device_type VARCHAR(50),

  login_status VARCHAR(20) NOT NULL,
  login_method VARCHAR(50),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_login_history_user_id ON public.login_history(user_id);
CREATE INDEX idx_login_history_created_at ON public.login_history(created_at);
CREATE INDEX idx_login_history_user_id_created ON public.login_history(user_id, created_at);

-- ============================================================
-- 9) CONTACT MESSAGES TABLE
-- ============================================================
CREATE TABLE public.contact_messages (
  id TEXT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,

  status VARCHAR(50) NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contact_messages_status ON public.contact_messages(status);
CREATE INDEX idx_contact_messages_created_at ON public.contact_messages(created_at);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) - enable
-- ============================================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.config_servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policies
-- ============================================================

-- user_profiles
CREATE POLICY "Users can read their own profile"
ON public.user_profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.user_profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Service role can do everything on user_profiles"
ON public.user_profiles
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- orders
CREATE POLICY "Users can read their own orders"
ON public.orders
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can do everything on orders"
ON public.orders
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- user_plans
CREATE POLICY "Users can read their own user plans"
ON public.user_plans
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can do everything on user_plans"
ON public.user_plans
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- notifications
CREATE POLICY "Users can read their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Service role can do everything on notifications"
ON public.notifications
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- devices
CREATE POLICY "Users can read their own devices"
ON public.devices
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own devices"
ON public.devices
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Service role can do everything on devices"
ON public.devices
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- login_history
CREATE POLICY "Users can read their own login history"
ON public.login_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can do everything on login_history"
ON public.login_history
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- config_servers (public read)
CREATE POLICY "Everyone can read config servers"
ON public.config_servers
FOR SELECT
USING (TRUE);

CREATE POLICY "Service role can do everything on config_servers"
ON public.config_servers
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- broadcast_notifications (public read)
CREATE POLICY "Everyone can read broadcast notifications"
ON public.broadcast_notifications
FOR SELECT
USING (TRUE);

CREATE POLICY "Service role can do everything on broadcast_notifications"
ON public.broadcast_notifications
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- contact_messages (admin only)
CREATE POLICY "Service role can do everything on contact_messages"
ON public.contact_messages
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
