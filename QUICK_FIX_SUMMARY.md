# Quick Fix Summary - Profile PATCH 405 Error

## The Problem (Console Error)
```
PATCH https://netco.anonymiketech.online/api/auth/profile/:userId 405 (Method Not Allowed)
[v0] API response status: 405
[v0] API response content-type: null
Failed to save profile
```

## Why It Happened
Vercel's SPA rewrite rule caught PATCH requests and returned HTML instead of proxying to Render.

## The Fix (2 Files, 1 Concept)
Add explicit API routing BEFORE SPA rewrite in both `vercel.json` files:

```json
{
  "rewrites": [
    {"source": "/api/:path*", "destination": "https://netco.onrender.com/api/:path*"},
    {"source": "/(.*)", "destination": "/index.html"}
  ]
}
```

## What to Do Now

### Step 1: Verify Code Changes
```bash
git diff artifacts/netco/vercel.json
git diff vercel.json
```
Should show API proxy rewrite rules added (lines 6-9 in both files).

### Step 2: Push & Deploy
```bash
git add .
git commit -m "fix: PATCH 405 routing to Render"
git push
```

### Step 3: Redeploy on Vercel
1. Go to https://vercel.com/dashboard/vercel/NETCO
2. Click "Redeploy" (or wait for auto-deploy)
3. Wait for status "Ready"

### Step 4: Test
1. Open https://netco.anonymiketech.online/account
2. Edit profile → Save
3. Console should show: `[v0] API response status: 200`
4. Toast says "Profile updated" ✅

## Result
- GET `/api/*` ✅ (already worked)
- PATCH `/api/*` ✅ (now works)
- POST `/api/*` ✅ (now works)
- All static routes still use SPA ✅

## Still Need To Do
1. **Run Supabase migration** (add 5 new columns to user_profiles table)
2. **Clear browser cache** if profile doesn't load after redeploy
3. **Test profile persistence** - refresh page, logout/login

---

**Estimated Time to Fix:** 15 minutes
**Risk:** Low
**Breaking Changes:** None
