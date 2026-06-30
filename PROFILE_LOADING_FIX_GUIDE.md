# Profile Loading Fix - Implementation Guide

## Changes Made

### Problem
Frontend attempted to fetch profile from `/api/auth/profile/:userId` but Vercel's SPA rewrite rule caught the request and returned `index.html` instead of JSON, causing profile to disappear on page refresh.

### Solution
**Load profile directly from Supabase instead of relying on API for GET operations.**

## File Changes

### `/vercel/share/v0-project/artifacts/netco/src/pages/account.tsx`

#### Change 1: Profile Loading (Lines 81-155)
**Before:** Fetched from API endpoint `apiUrl('api/auth/profile/${user.id}')`
**After:** Directly queries Supabase `user_profiles` table

```typescript
// Now uses Supabase query:
const { data, error } = await supabase
  .from("user_profiles")
  .select("*")
  .eq("supabase_uid", user.id)
  .single();
```

**Why:** 
- Eliminates dependency on backend API for reads
- Avoids SPA rewrite routing issues
- Direct database access with user's Supabase session authentication
- Faster load times

**Logging Added:**
- `[v0] Loading profile for user: {user.id}`
- `[v0] Profile loaded from Supabase: {data}`
- `[v0] Failed to load profile from Supabase: {error}`

#### Change 2: Profile Save Handler (Lines 159-231)
**Before:** PATCH to API, then set profile from API response
**After:** PATCH to API, then reload fresh profile from Supabase

```typescript
// After PATCH succeeds, reload from Supabase:
const { data, error } = await supabase
  .from("user_profiles")
  .select("*")
  .eq("supabase_uid", user.id)
  .single();
```

**Why:**
- Ensures profile state is always consistent with database
- Catches any edge cases where API and database are out of sync
- Validates that PATCH actually persisted
- Provides confirmation that save succeeded

**Logging Added:**
- `[v0] Saving profile via API for user: {user.id}`
- `[v0] API response status: {status}`
- `[v0] API response content-type: {type}`
- `[v0] API error response: {text}` (if error)
- `[v0] Reloading profile from Supabase after save`
- `[v0] Profile reloaded successfully: {data}`

## How This Fixes the Issue

### Original Bug Scenario
1. User saves profile → PATCH to API succeeds → updates Supabase
2. User refreshes page → Frontend tries to fetch from `/api/auth/profile/:userId`
3. Vercel rewrite rule catches request → returns `index.html`
4. Content-Type is `text/html` not `application/json`
5. Page detects non-JSON → uses empty fallback
6. Profile appears empty/blank

### After Fix
1. User saves profile → PATCH to API → successful
2. After PATCH, reload from Supabase directly (no API needed)
3. Confirm data in memory is fresh
4. User refreshes page → Frontend queries Supabase directly
5. Supabase returns JSON from `user_profiles` table
6. Profile loads correctly with all data intact

## Error Handling

### Profile Loading Errors
- **Profile not found** (code PGRST116): Uses default empty profile
- **Other Supabase errors**: Logs error, uses default profile
- **Network errors**: Logs error, uses default profile

### Profile Save Errors
- **API errors**: Catches and shows toast error message
- **Supabase reload errors**: Shows toast, but keeps local state
- **No silent failures**: All errors are logged with `[v0]` prefix

## Database Schema Assumed
The code expects `user_profiles` table with these columns:
- `id` - primary key
- `supabase_uid` - unique reference to auth user
- `email` - user email
- `username` - optional
- `full_name` - optional
- `phone` - optional
- `country` - optional
- `bio` - optional
- `avatar_url` - optional
- `timezone` - optional
- `preferred_language` - optional
- `preferred_theme` - optional
- `is_phone_verified` - boolean
- `newsletter_subscribed` - boolean
- `created_at` - timestamp
- `updated_at` - timestamp

## Testing Checklist

- [ ] Page refresh → profile loads with all data
- [ ] Logout/login → new user's profile loads correctly
- [ ] Update profile → data persists after refresh
- [ ] Check browser console for all `[v0]` logs
- [ ] No HTML responses where JSON expected
- [ ] Error messages show if save fails
- [ ] Empty profile only on first-time users (no existing row)

## Environment Variables Still Needed

None additional - uses existing:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

The `VITE_API_BASE_URL` is still used for PATCH requests if needed, but reads no longer depend on it.

## API Endpoint Status

The backend API endpoint `/api/auth/profile/:supabaseUid` still works for:
- PATCH (update profile)
- GET (if called directly from code)

But it's no longer used for initial profile load, avoiding the SPA rewrite issue.

