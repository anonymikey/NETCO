# PATCH 405 Method Not Allowed - Fix Guide

## Problem
When saving profile on account page, PATCH request returns **405 Method Not Allowed** with HTML response instead of JSON.

**Root Cause:** Vercel's SPA rewrite rule `/(.*) → /index.html` was catching ALL requests including API calls and returning HTML, which caused PATCH to fail.

```
Request: PATCH https://netco.anonymiketech.online/api/auth/profile/:userId
Response: 405 Method Not Allowed (HTML)
```

## Solution
Updated both `vercel.json` files to explicitly route API calls to the Render backend BEFORE applying the SPA rewrite rule.

### What Changed

**File 1:** `/vercel/share/v0-project/artifacts/netco/vercel.json`
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://netco.onrender.com/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**File 2:** `/vercel/share/v0-project/vercel.json` (root)
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://netco.onrender.com/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## How It Works
1. Request comes to Vercel: `PATCH /api/auth/profile/:userId`
2. First rewrite rule matches `/api/:path*`
3. Request is proxied to Render: `PATCH https://netco.onrender.com/api/auth/profile/:userId`
4. Render API processes the request and returns JSON
5. Vercel returns the JSON response to client

5. If request doesn't match `/api/*` (e.g., `/account`), it falls through to second rule
6. SPA rewrite applies: request is served `/index.html` for client-side routing

## Deployment Steps

### Step 1: Push Changes
```bash
git add .
git commit -m "fix: resolve PATCH 405 by adding API proxy rewrite in vercel.json"
git push
```

### Step 2: Redeploy on Vercel
1. Go to https://vercel.com/dashboard
2. Select NETCO project
3. Either:
   - Push to main branch (auto-deploy), OR
   - Click "Redeploy" on latest deployment
4. Wait for deployment to complete (status: Ready)

### Step 3: Test
1. Go to https://netco.anonymiketech.online/account
2. Edit profile (change name, country, etc.)
3. Click "Save Profile"
4. Check console:
   - `[v0] Saving profile via API for user:` should log
   - `[v0] API response status: 200` should show (no 405!)
   - Profile should update successfully

## Verification
- GET `/api/auth/profile/:userId` → 200 OK (was already working)
- PATCH `/api/auth/profile/:userId` → 200 OK (now fixed)
- POST, DELETE on `/api/*` → properly proxied to Render

## Why This Works
- Vercel's rewrite rules are evaluated top-to-bottom
- First matching rule wins
- By putting `/api/:path*` first, ALL API requests bypass the SPA rewrite
- Only true page routes (no file extension, not /api) get SPA rewrite

## Rollback (if needed)
If you need to revert, remove the API proxy rewrite:
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

---

**Status:** READY FOR DEPLOYMENT
**Files Changed:** 2
- `/vercel/share/v0-project/artifacts/netco/vercel.json`
- `/vercel/share/v0-project/vercel.json`
