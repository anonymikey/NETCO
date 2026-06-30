# Profile Loading Bug - Root Cause Analysis

## The Problem
After PATCH update saves to Supabase, refreshing the Account page causes all profile values to disappear. Browser fetch to `/api/auth/profile/:supabaseUid` returns `index.html` instead of JSON.

## Root Cause: SPA Rewrite Catching API Calls

### The Issue
**vercel.json contains an aggressive rewrite rule:**
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This rule catches **ALL** requests (including API calls) and rewrites them to `/index.html`.

### Why This Happens
1. Frontend app built in `artifacts/netco/dist`
2. `VITE_API_BASE_URL` is not set in production
3. `apiUrl()` function falls back to relative paths like `/api/auth/profile/:supabaseUid`
4. These relative paths get caught by the SPA rewrite rule → returns index.html
5. Content-Type is `text/html` instead of `application/json`
6. Page detects non-JSON response, uses fallback (empty profile)
7. All profile data appears to vanish on refresh

### Why Backend API Updates Still Work
- PATCH requests use `apiUrl()` with same relative path
- Vercel rewrite catches the response before it leaves the server
- But response body is HTML (the SPA), not JSON
- This actually silently fails too, but the update persisted before the request failed

## The Solution

### Architecture Decision
**The frontend should load user profile directly from Supabase, not from the backend API.**

Why:
- User data already exists in Supabase (`user_profiles` table)
- Frontend already has Supabase client initialized
- Eliminates dependency on backend API for read operations
- Avoids SPA rewrite routing issues
- Faster data loading
- No need for VITE_API_BASE_URL environment variable

### What Needs to Change

1. **Profile Loading** (GET): Load directly from Supabase `user_profiles` table
   - No API call needed
   - User's Supabase session provides authentication
   - Direct access to user_profiles with RLS

2. **Profile Saving** (PATCH): Keep backend API for security
   - Backend validates data before writing to database
   - Backend handles any business logic
   - API path will still work when deployed properly with API routing

3. **Remove All Fallback Logic**
   - Stop silently replacing API failures with empty data
   - Add proper error handling that doesn't mask issues
   - Always verify data before updating state

## Files to Change
- `/vercel/share/v0-project/artifacts/netco/src/pages/account.tsx` - Load profile from Supabase
- Keep `/vercel/share/v0-project/artifacts/api-server/src/routes/auth-profile.ts` as-is for PATCH

## Expected Behavior After Fix
1. Page refresh → Profile loads from Supabase immediately
2. Logout/login → Profile loads correctly with new user's data
3. PATCH save → Updates via API, then reloads from Supabase to verify
4. No more HTML responses where JSON is expected
5. No more empty profile after refresh

