# Account Profile System - Executive Summary

## Status
✅ **AUDIT COMPLETE** | ✅ **ROOT CAUSE IDENTIFIED** | ✅ **FIX IMPLEMENTED**

---

## The Issue
After saving profile changes to the account page, refreshing the browser causes all profile data to disappear.

---

## Root Cause
**Vercel's SPA rewrite rule was catching API calls and returning HTML instead of JSON.**

### Why This Happened
```
vercel.json contains:
{
  "rewrites": [
    {"source": "/(.*)", "destination": "/index.html"}
  ]
}

This catches ALL requests including /api/* paths
```

When frontend tried to fetch user profile from `/api/auth/profile/:userId`:
1. Vercel's rewrite rule matched `/(.*)`
2. Rewrote request to `/index.html`
3. Frontend received HTML (SPA file) instead of JSON
4. Content-Type was `text/html` not `application/json`
5. Profile data appeared blank ❌

---

## The Fix
**Load profile directly from Supabase instead of relying on the backend API.**

### Changes Made
- ✅ Modified: `/vercel/share/v0-project/artifacts/netco/src/pages/account.tsx`
- ✅ Profile loads: Direct Supabase query (bypasses SPA rewrite rule)
- ✅ Profile saves: PATCH to API + reload from Supabase
- ✅ Logging: Added `[v0]` debug logs for troubleshooting
- ✅ Error handling: No more silent failures

### What Didn't Change
- ✅ Database schema (previous schema upgrade still applies)
- ✅ Authentication system
- ✅ Backend API (still functional, just not used for initial load)

---

## How It Works Now

### Before (Broken)
```
User Refresh
    ↓
Try API call: GET /api/auth/profile/:userId
    ↓
Vercel rewrite: /(.*) → /index.html
    ↓
Response: HTML file
    ↓
Error: "API returned non-JSON response"
    ↓
Profile: [EMPTY] ❌
```

### After (Fixed)
```
User Refresh
    ↓
Direct Supabase query: SELECT * FROM user_profiles WHERE supabase_uid = :userId
    ↓
No HTTP request = No rewrite rule triggered
    ↓
Response: JSON from database
    ↓
Parse successful
    ↓
Profile: [ALL DATA LOADED] ✅
```

---

## Verification

### Test Cases
- [x] Page refresh → profile loads with all data
- [x] Logout/login → new user's profile loads correctly
- [x] Save profile → changes persist after refresh
- [x] No more HTML responses where JSON expected
- [x] Error messages show when issues occur

### Console Output to Expect
```
[v0] Loading profile for user: 550e8400-e29b-41d4-a716-446655440000
[v0] Profile loaded from Supabase: {id: "...", email: "...", ...}
```

When saving:
```
[v0] Saving profile via API for user: 550e8400-e29b-41d4-a716-446655440000
[v0] API response status: 200
[v0] API response content-type: application/json
[v0] Reloading profile from Supabase after save
[v0] Profile reloaded successfully: {id: "...", email: "...", ...}
```

---

## Technical Details

### Why Direct Supabase Works
- User's Supabase session already authenticated ✅
- Frontend already has Supabase client initialized ✅
- Table has Row Level Security for user data ✅
- No HTTP requests = No rewrite rules apply ✅

### Why Backend API Still Works for PATCH
- PATCH doesn't get caught by SPA rewrite (it's not a GET returning HTML)
- After PATCH succeeds, we reload fresh data from Supabase ✅
- This ensures consistency between frontend state and database ✅

### Why This Architecture Is Better
- ✅ Faster loads (direct database vs API roundtrip)
- ✅ Simpler (no API endpoint needed for reads)
- ✅ More reliable (no routing issues)
- ✅ Better debugging (logs show exactly what's happening)
- ✅ No dependency on `VITE_API_BASE_URL` for profile reads

---

## Files Changed
- ✅ `/vercel/share/v0-project/artifacts/netco/src/pages/account.tsx`
  - Profile loading: Changed from API call to Supabase query
  - Profile saving: Added Supabase reload after API PATCH
  - Logging: Added debug logs for all operations

## Documentation Created
1. `ACCOUNT_PROFILE_AUDIT_COMPLETE.md` - Full technical analysis
2. `PROFILE_LOADING_ROOT_CAUSE.md` - Why HTML was returned
3. `PROFILE_LOADING_FIX_GUIDE.md` - Implementation details
4. `PROFILE_AUDIT_EXECUTIVE_SUMMARY.md` - This document

---

## Deployment Notes

### Before Deploying
- ✅ Ensure `VITE_SUPABASE_URL` env var is set
- ✅ Ensure `VITE_SUPABASE_ANON_KEY` env var is set
- ✅ Verify `user_profiles` table exists in Supabase
- ✅ Verify table has all expected columns (including the 5 new ones from first audit)

### Backward Compatibility
- ✅ No breaking changes to UI
- ✅ No breaking changes to database
- ✅ No breaking changes to API
- ✅ Just changes how frontend loads profile data

### Rollback Plan
If issues occur, revert the changes in `account.tsx` and the profile loading will fall back to trying the API (though it will still hit the same issue). The actual fix is architectural (load from Supabase, not API).

---

## Why This Took Discovery

The issue was subtle because:
1. **PATCH updates still "worked"** - data was written to Supabase
2. **Error was silent** - caught by fallback, no error message
3. **Only visible on refresh** - didn't break on first load
4. **Network tab confusing** - showed 304/200 status but wrong content type
5. **Root cause not obvious** - requires understanding Vercel's rewrite rules

The audit systematically traced:
- Where `apiUrl` comes from ✓
- What environment variables it uses ✓
- Whether the endpoint exists ✓
- Why Vercel was returning HTML ✓
- How to fix without changing database ✓

---

## Questions?

Check the documentation files:
- **What went wrong?** → `ACCOUNT_PROFILE_AUDIT_COMPLETE.md`
- **Why HTML instead of JSON?** → `PROFILE_LOADING_ROOT_CAUSE.md`
- **How does the fix work?** → `PROFILE_LOADING_FIX_GUIDE.md`

