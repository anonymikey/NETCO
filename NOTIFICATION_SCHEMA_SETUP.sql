-- NETCO Notification System Schema Setup
-- Run these SQL queries in your Supabase SQL Editor

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(supabase_uid) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('server_added', 'upgrade', 'maintenance', 'alert', 'promotion')),
  icon VARCHAR(20), -- e.g., 'server', 'zap', 'alert', 'gift'
  is_read BOOLEAN DEFAULT FALSE,
  action_url VARCHAR(255), -- Optional: Link to navigate to
  data JSONB, -- Additional metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- 3. Create a view for unread notifications count (optional but useful)
CREATE OR REPLACE VIEW unread_notifications_count AS
SELECT user_id, COUNT(*) as unread_count
FROM notifications
WHERE is_read = FALSE
GROUP BY user_id;

-- 4. Enable Row Level Security (RLS) for user data isolation
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies
-- Allow users to read only their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- Allow authenticated users (admin) to insert notifications
CREATE POLICY "Authenticated users can insert notifications" ON notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update only their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow users to delete only their own notifications
CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE USING (user_id = auth.uid());

-- 6. Create a function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID, user_id UUID)
RETURNS notifications AS $$
BEGIN
  UPDATE notifications
  SET is_read = TRUE, updated_at = NOW()
  WHERE id = notification_id AND user_id = user_id;
  
  RETURN (SELECT * FROM notifications WHERE id = notification_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create a function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM notifications WHERE user_id = user_id AND is_read = FALSE);
END;
$$ LANGUAGE plpgsql;

-- 8. Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_notifications_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notifications_update_timestamp
BEFORE UPDATE ON notifications
FOR EACH ROW
EXECUTE FUNCTION update_notifications_timestamp();

-- ============ USAGE EXAMPLES ============

-- Insert a new server added notification for a user
-- INSERT INTO notifications (user_id, title, message, type, icon, action_url, data)
-- VALUES (
--   'user-uuid-here',
--   'New Server Available',
--   'A new high-speed server has been added for Safaricom network',
--   'server_added',
--   'server',
--   '/dashboard',
--   jsonb_build_object('server_name', 'Safaricom Premium', 'network', 'safaricom')
-- );

-- Insert a maintenance notification
-- INSERT INTO notifications (user_id, title, message, type, icon)
-- VALUES (
--   'user-uuid-here',
--   'Scheduled Maintenance',
--   'Services will be temporarily unavailable on Sunday 2:00 AM - 3:00 AM EAT for server upgrades',
--   'maintenance',
--   'alert'
-- );

-- Insert a system upgrade notification
-- INSERT INTO notifications (user_id, title, message, type, icon)
-- VALUES (
--   'user-uuid-here',
--   'Platform Upgraded',
--   'NETCO has been upgraded with faster speeds and improved stability',
--   'upgrade',
--   'zap'
-- );

-- Get all unread notifications for a user
-- SELECT * FROM notifications WHERE user_id = 'user-uuid' AND is_read = FALSE ORDER BY created_at DESC;

-- Mark a specific notification as read
-- SELECT mark_notification_read('notification-uuid', 'user-uuid');

-- Get unread count for a user
-- SELECT get_unread_notification_count('user-uuid');
