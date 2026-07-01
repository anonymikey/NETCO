-- CORRECTED Database Migrations for NETCO Account Management
-- These use UUID types to match user_profiles.id which is UUID

-- Add new columns to user_profiles for 2FA and security features
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS two_factor_method VARCHAR(20);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS two_factor_secret TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS two_factor_backup_codes TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_password_change_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS failed_login_attempts VARCHAR(3) DEFAULT '0';

-- Create notification_preferences table (with UUID for user_id)
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Email preferences
  email_offers_and_deals BOOLEAN NOT NULL DEFAULT TRUE,
  email_new_features BOOLEAN NOT NULL DEFAULT TRUE,
  email_product_updates BOOLEAN NOT NULL DEFAULT TRUE,
  email_system_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  email_weekly_digest BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Push preferences
  push_offers_and_deals BOOLEAN NOT NULL DEFAULT TRUE,
  push_order_updates BOOLEAN NOT NULL DEFAULT TRUE,
  push_account_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- SMS preferences
  sms_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  sms_offers_and_deals BOOLEAN NOT NULL DEFAULT FALSE,
  sms_order_updates BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Marketing preferences
  unsubscribed_from_all BOOLEAN NOT NULL DEFAULT FALSE,
  unsubscribe_token TEXT UNIQUE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Create active_sessions table (with UUID for user_id)
CREATE TABLE IF NOT EXISTS active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Device info
  device_name VARCHAR(255) NOT NULL,
  device_type VARCHAR(50) NOT NULL,
  browser_name VARCHAR(100),
  os_name VARCHAR(100),
  
  -- IP and location
  ip_address VARCHAR(45) NOT NULL,
  country VARCHAR(100),
  city VARCHAR(100),
  
  -- Session data
  user_agent TEXT NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  is_current_session BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Timestamps
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  CONSTRAINT check_expires_at CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id ON active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_session_token ON active_sessions(session_token);

-- Create email_logs table (with UUID for user_id)
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Email details
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  email_type VARCHAR(50) NOT NULL,
  
  -- Resend integration
  resend_message_id TEXT,
  resend_status VARCHAR(50) NOT NULL DEFAULT 'queued',
  
  -- Delivery status
  is_delivered BOOLEAN NOT NULL DEFAULT FALSE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  
  -- Engagement tracking
  is_opened BOOLEAN NOT NULL DEFAULT FALSE,
  opened_at TIMESTAMP WITH TIME ZONE,
  is_clicked BOOLEAN NOT NULL DEFAULT FALSE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  
  -- Error tracking
  error_message TEXT,
  failure_reason TEXT,
  
  -- Campaign tracking
  campaign_id TEXT,
  sent_by_admin TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_resend_status ON email_logs(resend_status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);
