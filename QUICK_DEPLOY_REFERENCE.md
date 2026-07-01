# Quick Deploy Reference - Account Management System

## What's New
- ✅ Fixed 413 error (avatar uploads)
- ✅ 5 account management tabs
- ✅ Resend email integration
- ✅ Session management
- ✅ Notification preferences

## Essential Steps

### 1. Database (MUST DO FIRST)
Copy-paste SQL from `ACCOUNT_SYSTEM_DEPLOYMENT_GUIDE.md` into your database console. 4 migrations required.

### 2. Supabase Storage
Create public bucket named `user-avatars`

### 3. Deploy Backend (Render)
```bash
git push  # Render auto-deploys
```
New endpoints available at: `https://netco.onrender.com/api/auth/...`

### 4. Deploy Frontend (Vercel)
```bash
git push  # Vercel auto-deploys
```
Test at: `https://netco.anonymiketech.online/account`

## Files Changed Summary

### Backend (4 files)
- `notification-preferences.ts` - Save/load user notification settings
- `active-sessions.ts` - List/delete user devices  
- `email-logs.ts` - Track email delivery
- `admin-email-notifications.ts` - Send emails via Resend

### Frontend (5 files)
- `AccountInformationTab.tsx` - Profile + avatar
- `PreferencesTab.tsx` - Theme/language/timezone
- `NotificationPreferencesTab.tsx` - Email/push/SMS
- `SecurityTab.tsx` - Password + 2FA
- `ActiveSessionsTab.tsx` - Device management

### Database Schema (3 tables)
- `notification_preferences` - User notification channel preferences
- `active_sessions` - Track devices signed in
- `email_logs` - Track Resend email delivery

### Updated
- `user_profiles` - Added 2FA fields
- `account.tsx` - Fixed avatar upload (uses Supabase storage)

## Testing the Fix

### Before (BROKE)
```
1. Upload avatar as base64
2. Include in PATCH body
3. → 413 Content Too Large error
```

### After (WORKS)
```
1. Upload avatar to Supabase storage
2. Get public URL
3. Include only URL in PATCH body
4. → Saves successfully
```

## Key Features

### Email Notifications (Admin)
```bash
POST /api/admin/email-notifications/send

{
  "subject": "50% Off Today!",
  "emailType": "offer",
  "htmlContent": "<h1>Limited Time</h1>...",
  "recipientFilter": "offers_subscribers"
}
```
- Filters by user notification preferences
- Resend sends with unsubscribe link
- Tracks in `email_logs` table

### Notification Preferences (User)
Users can control:
- Email: Offers, Features, Products, System, Weekly Digest
- Push: Offers, Orders, Account
- SMS: Optional, Offers, Orders
- Unsubscribe from all

### Sessions (User)
Users can:
- See all connected devices
- Device info: browser, OS, IP, location
- Logout individual devices
- Logout all other devices

## Critical SQL Migrations

See full SQL in deployment guide. Essential tables:

```sql
-- notification_preferences
CREATE TABLE notification_preferences (
  id, user_id, email_offers_and_deals, email_new_features, ...
)

-- active_sessions  
CREATE TABLE active_sessions (
  id, user_id, device_name, device_type, ip_address, ...
)

-- email_logs
CREATE TABLE email_logs (
  id, user_id, recipient_email, email_type, resend_status, ...
)
```

## Env Vars Needed
- ✅ RESEND_API_KEY (already set)
- ✅ Database credentials (already set)

No new env vars needed!

## Common Issues & Fixes

**Still getting 413 error?**
- Clear browser cache
- Check avatar upload is using `supabase.storage.from("user-avatars").upload()`

**Notification preferences not saving?**
- Check network tab - API call status
- Verify userId is correct
- Confirm endpoint is registered in routes/index.ts

**Emails not sending?**
- Check RESEND_API_KEY in Render env
- Check email_logs table for error messages
- Verify user has notification_preferences record

**Can't upload avatar?**
- Make sure Supabase bucket `user-avatars` exists
- Make sure bucket is set to public
- Check browser console for detailed error

## Documentation
- `ACCOUNT_SYSTEM_DEPLOYMENT_GUIDE.md` - Full deployment steps
- `ACCOUNT_MANAGEMENT_SUMMARY.md` - Feature overview
- `QUICK_DEPLOY_REFERENCE.md` - This file

## Deploy & Test Checklist
- [ ] Run SQL migrations
- [ ] Create Supabase bucket
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Avatar upload test
- [ ] Preference save test
- [ ] Resend email test

Everything is ready to go!
