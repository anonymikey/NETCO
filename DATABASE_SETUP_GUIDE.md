# NETCO Platform - Database Setup Guide

## Summary

The NETCO platform has been fully updated with:
- Enhanced Drizzle ORM schemas aligned with Supabase PostgreSQL
- Updated API routes using correct column names (`id` UUID instead of `supabaseUid`)
- Complete user account management, notifications, and admin dashboard features
- Proper Row Level Security (RLS) policies for data protection

## Database Schema Summary

The final schema uses these key tables:

### user_profiles
- `id` (UUID, PK) - References auth.users(id)
- `email`, `full_name`, `username`, `phone`, `country`, `timezone`
- `bio`, `avatar_url`
- `is_email_verified`, `is_phone_verified`, `two_factor_enabled`, `newsletter_subscribed`
- `preferred_theme`, `preferred_language`
- `notification_preferences` (JSONB)
- `created_at`, `updated_at`

### orders
- `id` (UUID, PK)
- `user_id` (UUID, FK → user_profiles(id))
- `plan_name`, `amount`, `currency`, `status`
- `payment_method`, `transaction_id`, `notes`, `expires_at`
- `created_at`, `updated_at`

### user_plans
- `id` (UUID, PK)
- `user_id` (UUID, FK → user_profiles(id))
- `plan_type`, `plan_name`, `duration_days`
- `status`, `activated_at`, `expires_at`
- `created_at`, `updated_at`

### notifications
- `id` (UUID, PK)
- `user_id` (UUID, FK → user_profiles(id))
- `title`, `message`, `type`, `category`, `icon`
- `is_read`, `action_url`, `data` (JSONB)
- `created_at`, `updated_at`

### Other Tables
- `config_servers` - Public VPN server configurations
- `broadcast_notifications` - Admin-sent announcements
- `devices` - User's connected devices
- `login_history` - User login audit log
- `contact_messages` - Contact form submissions

## Setup Instructions

### Step 1: Run the Corrected SQL Schema in Supabase

1. Go to your Supabase Dashboard → **SQL Editor**
2. Click **"New Query"**
3. Open `/SUPABASE_SCHEMA_CORRECTED_FINAL.sql` from this project
4. Copy the **entire** contents
5. Paste into the SQL Editor
6. Click **"Run"**
7. Verify "Success. No rows returned" appears

### Step 2: Verify Tables and RLS

After running the schema, verify everything was created:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### Step 3: Application Configuration

The application is already configured with:

- **Drizzle ORM schemas** in `/lib/db/src/schema/` - All use correct column names
- **API routes** in `/artifacts/api-server/src/routes/` - All use `id` (UUID) field
- **Frontend components** in `/artifacts/netco/src/` - Account, notifications, admin dashboard

### Step 4: Environment Variables

Make sure your `.env` files include:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# API Server
DATABASE_URL=postgresql://...your-supabase-connection-string
```

## Key Changes Made

### Schema Fixes
✅ Changed `user_profiles.id` from TEXT to UUID (references auth.users(id))
✅ Removed non-existent `supabase_uid` column
✅ Updated all foreign key references to use `user_id` (UUID)
✅ Fixed all RLS policies to reference correct columns

### API Updates
✅ Updated `auth-profile.ts` route to use `id` instead of `supabaseUid`
✅ Updated CreateProfileBody schema validation
✅ Fixed all database queries to use correct column names
✅ Added formatProfile() helper for consistent response structure

### Drizzle Schemas Updated
✅ `user_profiles.ts` - Uses `uuid("id")` as PK
✅ `notifications.ts` - Uses `uuid("user_id")` referencing `user_profiles.id`
✅ `user_plans.ts` - Uses `uuid("user_id")` referencing `user_profiles.id`
✅ `orders.ts` - Uses `uuid("user_id")` referencing `user_profiles.id`
✅ `devices.ts` - Uses `uuid("user_id")` referencing `user_profiles.id`
✅ `login_history.ts` - Uses `uuid("user_id")` referencing `user_profiles.id`

## Testing the Setup

### 1. Test Profile API
```bash
# Create profile (POST)
curl -X POST http://localhost:3000/api/auth-profile/create \
  -H "Content-Type: application/json" \
  -d '{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "fullName": "John Doe",
    "phone": "+254712345678"
  }'

# Get profile (GET)
curl http://localhost:3000/api/auth-profile/550e8400-e29b-41d4-a716-446655440000

# Update profile (PATCH)
curl -X PATCH http://localhost:3000/api/auth-profile/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "country": "Kenya",
    "timezone": "Africa/Nairobi",
    "preferredTheme": "dark"
  }'
```

### 2. Test Frontend
- Navigate to `/account` - View/edit profile with all new fields
- Navigate to `/notifications` - View notifications
- Navigate to `/plans` - View available VPN plans
- Admin pages at `/admin/*` - Dashboard with stats and analytics

## Troubleshooting

### "Column does not exist" errors
- Ensure you ran the complete `SUPABASE_SCHEMA_CORRECTED_FINAL.sql`
- Check table names use underscores: `user_profiles`, `user_id`, not `userProfiles`, `userId`

### RLS Policy errors
- RLS policies are created AFTER all tables
- Service role (API) bypasses RLS
- Individual users can only access their own data

### Build errors
- Run `pnpm install` in root
- Run `pnpm -r run build` to build all packages

### 404 errors on admin/account pages
- Verify all tables created in Supabase
- Check API server is running on correct port
- Verify environment variables are set correctly

## Support

All features are now implemented and tested:
- ✅ User account management with profile settings
- ✅ Notification system with real-time updates
- ✅ Separate admin dashboard and navigation
- ✅ Plans/pricing page
- ✅ Login history and device tracking
- ✅ Row-level security for data protection
