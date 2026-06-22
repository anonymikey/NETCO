# NETCO Config Download Fix - Render Implementation Guide

**Your Setup**:
- API: Hosted on Render at `https://netco.onrender.com`
- Frontend: Hosted on Vercel at `https://netco.app`
- Repository: `anonymikey/NETCO` on GitHub

---

## Quick Start (10 Minutes)

### 1. Set Environment Variables

**In Render Dashboard:**

1. Go to: https://dashboard.render.com/web/srv-d8dklb6rnols739f0okg
2. Click **Environment** tab
3. Add new environment variable:
   - Key: `API_BASE_URL`
   - Value: `https://netco.onrender.com`
4. Click **Save**
5. Wait 1-2 minutes for redeploy

**In Vercel Dashboard:**

1. Go to: Your NETCO project → Settings → Environment Variables
2. Add new environment variable:
   - Name: `VITE_API_BASE_URL`
   - Value: `https://netco.onrender.com`
3. Select environments: **Production, Preview, Development**
4. Click **Save**
5. Vercel will redeploy automatically

### 2. Make Code Changes

Clone your repository and create a new branch:

```bash
git clone https://github.com/anonymikey/NETCO.git
cd NETCO
git checkout -b fix/config-download-urls
```

**Change 1: `artifacts/api-server/src/routes/orders.ts`**

Find line 120 with:
```typescript
const configUrl = `/api/orders/${orderId}/download`;
```

Add this constant after the imports (around line 1-10):
```typescript
const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3001";
```

Change line 120 to:
```typescript
const configUrl = `${API_BASE_URL}/api/orders/${orderId}/download`;
```

**Change 2: `artifacts/api-server/src/routes/payment.ts`**

Find line 78 with:
```typescript
const configUrl = `/api/orders/${orderId}/download`;
```

Add this constant after the imports:
```typescript
const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3001";
```

Change line 78 to:
```typescript
const configUrl = `${API_BASE_URL}/api/orders/${orderId}/download`;
```

**Change 3: `artifacts/api-server/src/routes/admin-orders.ts`**

Find line 100 with:
```typescript
const configUrl = `/api/orders/${order.id}/download`;
```

Add this constant after the imports:
```typescript
const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3001";
```

Change line 100 to:
```typescript
const configUrl = `${API_BASE_URL}/api/orders/${order.id}/download`;
```

### 3. Commit and Push

```bash
git add artifacts/api-server/src/routes/orders.ts
git add artifacts/api-server/src/routes/payment.ts
git add artifacts/api-server/src/routes/admin-orders.ts

git commit -m "fix: use absolute URLs for config downloads

- Store full API URLs instead of relative paths
- Fixes downloads when API and frontend on different domains
- Backward compatible with frontend apiUrl() function"

git push origin fix/config-download-urls
```

### 4. Create Pull Request (Optional)

1. Go to: https://github.com/anonymikey/NETCO
2. Click **Pull Requests**
3. Click **New Pull Request**
4. Select `fix/config-download-urls` → `main`
5. Add description and create PR
6. Get reviews (if needed)
7. Merge to main

### 5. Deploy

Render auto-deploys from `main`:

1. Go to: https://dashboard.render.com/web/srv-d8dklb6rnols739f0okg
2. Refresh page
3. You should see the deploy in progress
4. Wait for green checkmark (usually 5-10 minutes)
5. Check Events tab to verify success

Frontend will auto-redeploy when env vars are saved in Vercel.

### 6. Verify

1. Open `https://netco.app`
2. Create a test order (free tier)
3. Check the order status
4. Click download button
5. Verify `.hc` file downloads (not HTML error)

Done! ✅

---

## Detailed Step-by-Step (30 Minutes)

### Step 1: Set Render Environment Variable

#### 1.1 Open Render Dashboard

Go to: https://dashboard.render.com

You should already be logged in. You'll see your workspace with the NETCO service.

#### 1.2 Navigate to Environment

1. Click on **NETCO** (your web service)
2. Look for tabs at the top: **Settings**, **Events**, **Environment**, **Logs**, **Health**
3. Click **Environment**

#### 1.3 Add Environment Variable

You'll see a form to add environment variables.

1. In the **Key** field, type: `API_BASE_URL`
2. In the **Value** field, type: `https://netco.onrender.com`
3. Click **Save**
4. Render will show a confirmation
5. Your service will redeploy automatically (you'll see it in Events)

#### 1.4 Wait for Redeploy

1. Click **Events** tab
2. Watch for a new deployment entry
3. Wait until you see the green checkmark ✅
4. This usually takes 5-10 minutes

#### 1.5 Verify Environment Variable is Set

1. Click **Environment** tab again
2. Verify you see `API_BASE_URL=https://netco.onrender.com`

### Step 2: Set Vercel Environment Variable

#### 2.1 Open Vercel Dashboard

Go to: https://vercel.com

Log in to your account.

#### 2.2 Navigate to NETCO Project

1. Click on **NETCO** project
2. Or go to: https://vercel.com/anonymikey/netco

#### 2.3 Open Project Settings

1. Click **Settings** (top navigation)
2. Look for **Environment Variables** in the left sidebar
3. Click **Environment Variables**

#### 2.4 Add Environment Variable

1. Click **Add New**
2. In **Name** field: `VITE_API_BASE_URL`
3. In **Value** field: `https://netco.onrender.com`
4. Check boxes for: **Production**, **Preview**, **Development**
5. Click **Save**

#### 2.5 Verify Deployment Started

1. Go to **Deployments** tab
2. You should see a new deployment starting
3. Wait for it to complete (usually 3-5 minutes)

### Step 3: Update Code

#### 3.1 Clone Repository

Open terminal/command line:

```bash
git clone https://github.com/anonymikey/NETCO.git
cd NETCO
```

#### 3.2 Create Feature Branch

```bash
git checkout -b fix/config-download-urls
```

#### 3.3 Open First File

Open: `artifacts/api-server/src/routes/orders.ts`

Find the line that says:
```typescript
const configUrl = `/api/orders/${orderId}/download`;
```

This should be around **line 120**.

#### 3.4 Add Constant to First File

Add this line near the top of the file (after imports, around line 1-10):

```typescript
const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3001";
```

#### 3.5 Replace Line in First File

Replace line 120:
```typescript
- const configUrl = `/api/orders/${orderId}/download`;
+ const configUrl = `${API_BASE_URL}/api/orders/${orderId}/download`;
```

#### 3.6 Open Second File

Open: `artifacts/api-server/src/routes/payment.ts`

Find the line around **line 78** that says:
```typescript
const configUrl = `/api/orders/${orderId}/download`;
```

#### 3.7 Repeat for Second File

Add the constant (if not already there):
```typescript
const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3001";
```

Replace the configUrl line:
```typescript
- const configUrl = `/api/orders/${orderId}/download`;
+ const configUrl = `${API_BASE_URL}/api/orders/${orderId}/download`;
```

#### 3.8 Open Third File

Open: `artifacts/api-server/src/routes/admin-orders.ts`

Find the line around **line 100** that says:
```typescript
const configUrl = `/api/orders/${order.id}/download`;
```

#### 3.9 Repeat for Third File

Add the constant:
```typescript
const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3001";
```

Replace the line:
```typescript
- const configUrl = `/api/orders/${order.id}/download`;
+ const configUrl = `${API_BASE_URL}/api/orders/${order.id}/download`;
```

### Step 4: Commit Changes

In terminal:

```bash
git add artifacts/api-server/src/routes/orders.ts
git add artifacts/api-server/src/routes/payment.ts
git add artifacts/api-server/src/routes/admin-orders.ts

git commit -m "fix: use absolute URLs for config downloads"

git push origin fix/config-download-urls
```

### Step 5: Merge to Main

Option A (Using GitHub UI):

1. Go to: https://github.com/anonymikey/NETCO
2. Click **Pull Requests**
3. Click **Compare & pull request** (or **New Pull Request**)
4. Select base: `main`, compare: `fix/config-download-urls`
5. Click **Create pull request**
6. Click **Merge pull request**
7. Confirm merge

Option B (Using Git):

```bash
git checkout main
git pull origin main
git merge fix/config-download-urls
git push origin main
```

### Step 6: Watch Render Auto-Deploy

1. Go to: https://dashboard.render.com/web/srv-d8dklb6rnols739f0okg
2. Click **Events** tab
3. Watch for a new deploy event (should appear within 1-2 minutes)
4. Wait for green checkmark

### Step 7: Test the Fix

1. Open `https://netco.app` in browser
2. Create a test order:
   - Click "Free Plan"
   - Sign in or create account
   - Complete the flow
3. Check the order page
4. Click the download button
5. Verify that a `.hc` file downloads

---

## Verification Commands

Open terminal and run these commands to verify:

```bash
# Verify git commits
git log --oneline | head -3

# Should show your commit with "config-download" in message
```

Check in Render:
```bash
# Verify environment variable is set (from Render dashboard)
curl https://netco.onrender.com/api/orders/health

# Should respond with 200 or 404 (meaning API is running)
```

Check in database (if you have access):
```bash
# Query recent orders to see configUrl format
# Log into Supabase and run:
SELECT id, configUrl FROM orders ORDER BY created_at DESC LIMIT 5;

# Should show configUrl like:
# https://netco.onrender.com/api/orders/uuid/download
# NOT like:
# /api/orders/uuid/download
```

---

## Troubleshooting

### Problem: Render Redeploy Didn't Start

**Solution**:
1. Go to Render dashboard
2. Click **Manual Deploy** button (top right)
3. Select **Redeploy latest commit**

### Problem: Download Still Returns 404

**Cause**: Environment variable might not be set correctly

**Solution**:
1. In Render dashboard, go to **Environment**
2. Verify `API_BASE_URL=https://netco.onrender.com` is exactly correct
3. Check that you didn't add trailing slash: `netco.onrender.com/` ❌
4. Redeploy the service

### Problem: configUrl Still Shows `/api/orders/...`

**Cause**: Code changes didn't merge or deploy

**Solution**:
1. Verify code is pushed to `main` branch:
   ```bash
   git log --oneline -5
   # Should show your commit at top
   ```

2. Force Render to redeploy:
   - Go to Render dashboard
   - Click **Manual Deploy**
   - Select **Redeploy latest commit**

3. Check if variable is needed:
   - The constant must be defined for each file
   - Each file must import any required dependencies

### Problem: Vercel Deployment Failed

**Cause**: VITE_ environment variable issue

**Solution**:
1. Go to Vercel dashboard
2. Click **Settings** → **Environment Variables**
3. Check `VITE_API_BASE_URL=https://netco.onrender.com`
4. Delete and re-add if unsure
5. Trigger new deployment:
   - Click **Deployments** tab
   - Click **Redeploy** on latest failed deployment

### Problem: Old Orders Still Don't Download

**This is normal**. Old orders have relative URLs. The fix makes new orders have absolute URLs.

**Verify this is working**:
1. Create a brand new order
2. Try downloading that new order
3. Check database for the new order's configUrl (should be absolute)

---

## Success Checklist

After completing all steps:

```
Setup Complete
✅ API_BASE_URL set in Render
✅ VITE_API_BASE_URL set in Vercel
✅ Code changes committed to main
✅ Render redeploy completed
✅ Vercel redeploy completed

Testing Complete
✅ Can create new order
✅ Download button works
✅ .hc file downloads (not HTML)
✅ No 404 errors in logs
✅ Database shows absolute configUrl

Ready for Production
✅ Monitor for 24 hours
✅ No error spikes
✅ Users reporting successful downloads
✅ Old orders still work (backward compatible)
```

---

## Rollback Instructions

If something goes wrong and you need to undo the changes:

```bash
# Revert the changes
git revert <commit-hash>

# Push to main
git push origin main

# Render will auto-redeploy without the changes
# Frontend will continue working (backward compatible)
```

---

## Support

If you have issues:

1. **Check Render Logs**:
   - Dashboard → Events tab
   - Look for error messages

2. **Check Vercel Logs**:
   - Project → Deployments
   - Click on failed deployment
   - View logs

3. **Check Database**:
   - Log into Supabase
   - Run: `SELECT * FROM orders ORDER BY created_at DESC LIMIT 1;`
   - Check `configUrl` format

4. **Check Browser Console**:
   - Open `https://netco.app`
   - Press F12 for DevTools
   - Look for error messages in Console tab
   - Check Network tab for failed requests

---

## Timeline Summary

| Step | Time | Status |
|------|------|--------|
| 1. Set Render env var | 5 min | |
| 2. Set Vercel env var | 5 min | |
| 3. Update code files | 10 min | |
| 4. Commit & push | 5 min | |
| 5. Merge to main | 2 min | |
| 6. Wait for deploys | 15 min | |
| 7. Test | 5 min | |
| **Total** | **~45 min** | |

---

## One-Sentence Summary

Replace 3 relative URLs with absolute URLs using environment variable, set 2 env vars in Render and Vercel, test downloads.

---

**Created**: June 22, 2026  
**For**: anonymikey/NETCO on Render  
**Status**: Ready to Follow
