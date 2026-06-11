-- Create user_profiles table
-- Stores user profile information linked to Supabase auth
CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT PRIMARY KEY,
  supabase_uid TEXT NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  phone VARCHAR(20),
  bio TEXT,
  avatar_url TEXT,
  is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  newsletter_subscribed BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for unique constraints and query performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_supabase_uid ON user_profiles (supabase_uid);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles (email);

-- Create trigger to auto-update updated_at on row change
CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
