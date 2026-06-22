# NETCO Config Download Flow - Corrected Audit Report

**Date**: June 22, 2026  
**Status**: Complete & Verified  
**Your Deployment**: Render (netco.onrender.com)

---

## Executive Summary

The config download system has a **critical bug** affecting production. When your API and frontend are on different domains (which is your current setup), config downloads fail with 404 errors.

**Your Setup**:
- Frontend: `https://netco.app` (Vercel)
- API: `https://netco.onrender.com` (Render)
- Problem: Relative URLs stored in database don't work across different domains

---

## Problem Statement

### Current Flow (BROKEN)

1. User completes purchase on `https://netco.app`
2. Order is created with config URL: `/api/orders/123/download` (relative)
3. This URL is stored in Supabase database
4. User receives email with download link
5. User clicks link in email
6. Browser tries to download from: `https://netco.app/api/orders/123/download`
7. But API is at: `https://netco.onrender.com/api/orders/123/download`
8. Result: **404 Not Found** ❌

### Fixed Flow (WORKING)

1. User completes purchase on `https://netco.app`
2. Order is created with config URL: `https://netco.onrender.com/api/orders/123/download` (absolute)
3. This URL is stored in Supabase database
4. User receives email with download link
5. User clicks link in email
6. Browser downloads from: `https://netco.onrender.com/api/orders/123/download`
7. API returns `.hc` file
8. Result: **Download Works** ✅

---

## Root Cause Analysis

### Where Relative URLs Are Created

| File | Line | Code | Status |
|------|------|------|--------|
| `artifacts/api-server/src/routes/orders.ts` | 120 | `const configUrl = `/api/orders/${orderId}/download`;` | 🔴 BROKEN |
| `artifacts/api-server/src/routes/payment.ts` | 78 | `const configUrl = `/api/orders/${orderId}/download`;` | 🔴 BROKEN |
| `artifacts/api-server/src/routes/admin-orders.ts` | 100 | `const configUrl = `/api/orders/${order.id}/download`;` | 🔴 BROKEN |

### Why This Is Broken

Relative URLs like `/api/orders/123/download` are **domain-relative**. They work on the domain where they're accessed from:

```
Frontend Domain: netco.app
Relative URL: /api/orders/123/download
Browser resolves to: https://netco.app/api/orders/123/download ❌

But API is at: https://netco.onrender.com/api/orders/123/download ❌
```

---

## The Fix

### Step 1: Add API_BASE_URL Constant

Add to the top of each file (after imports):

```typescript
const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3001";
```

This:
- Reads the environment variable
- Removes trailing slashes
- Falls back to localhost for development

### Step 2: Update the Three Files

#### File 1: `artifacts/api-server/src/routes/orders.ts` (Line 120)

**Before:**
```typescript
const configUrl = `/api/orders/${orderId}/download`;
```

**After:**
```typescript
const configUrl = `${API_BASE_URL}/api/orders/${orderId}/download`;
```

#### File 2: `artifacts/api-server/src/routes/payment.ts` (Line 78)

**Before:**
```typescript
const configUrl = `/api/orders/${orderId}/download`;
```

**After:**
```typescript
const configUrl = `${API_BASE_URL}/api/orders/${orderId}/download`;
```

#### File 3: `artifacts/api-server/src/routes/admin-orders.ts` (Line 100)

**Before:**
```typescript
const configUrl = `/api/orders/${order.id}/download`;
```

**After:**
```typescript
const configUrl = `${API_BASE_URL}/api/orders/${order.id}/download`;
```

### Step 3: Set Environment Variables

#### In Render Dashboard

Navigate to: Dashboard → NETCO (web service) → Environment

Add:
```
API_BASE_URL=https://netco.onrender.com
```

#### In Vercel Dashboard

Navigate to: Settings → Environment Variables

Add:
```
VITE_API_BASE_URL=https://netco.onrender.com
```

---

## Implementation Checklist

### Pre-Deployment
- [ ] Read this document completely
- [ ] Have access to Render dashboard
- [ ] Have access to Vercel project settings
- [ ] Have git access to repository
- [ ] Have tested changes in development (optional but recommended)

### Code Changes
- [ ] Update `artifacts/api-server/src/routes/orders.ts` line 120
- [ ] Update `artifacts/api-server/src/routes/payment.ts` line 78
- [ ] Update `artifacts/api-server/src/routes/admin-orders.ts` line 100
- [ ] Commit with message: "fix: use absolute URLs for config downloads"
- [ ] Push to `main` or create PR

### Environment Variables
- [ ] Set `API_BASE_URL=https://netco.onrender.com` in Render
- [ ] Set `VITE_API_BASE_URL=https://netco.onrender.com` in Vercel
- [ ] Wait 5 minutes for variables to propagate

### Deployment
- [ ] Deploy API server (Render will auto-deploy from `main`)
- [ ] Wait for deployment to complete (usually 5-10 minutes)
- [ ] Verify API is running in Render logs
- [ ] Frontend will auto-redeploy in Vercel (if env vars changed)
- [ ] Wait for frontend deployment to complete

### Testing
- [ ] Create test order (free tier)
- [ ] Check database that `configUrl` is absolute
- [ ] Download config file
- [ ] Verify `.hc` file downloads (not HTML)
- [ ] Check DevTools Network tab for correct headers
- [ ] Test from order status page
- [ ] Test from admin dashboard

### Post-Deployment Monitoring
- [ ] Check Render logs for errors
- [ ] Monitor error tracking service
- [ ] Watch for user reports
- [ ] Check analytics for download rate (should be normal or higher)

---

## Verification Steps

### Verify Code Changes

```bash
# Check that constant is added
grep -n "const API_BASE_URL" artifacts/api-server/src/routes/orders.ts
grep -n "const API_BASE_URL" artifacts/api-server/src/routes/payment.ts
grep -n "const API_BASE_URL" artifacts/api-server/src/routes/admin-orders.ts
# All three should show the constant definition

# Check that URLs use the constant
grep -n "\${API_BASE_URL}" artifacts/api-server/src/routes/orders.ts
grep -n "\${API_BASE_URL}" artifacts/api-server/src/routes/payment.ts
grep -n "\${API_BASE_URL}" artifacts/api-server/src/routes/admin-orders.ts
# All three should show configUrl using the constant
```

### Verify Environment Variables

**Render**:
1. Go to Dashboard → NETCO web service
2. Click "Environment"
3. Verify `API_BASE_URL=https://netco.onrender.com` is present

**Vercel**:
1. Go to Project Settings → Environment Variables
2. Verify `VITE_API_BASE_URL=https://netco.onrender.com` is present

### Verify API is Running

```bash
# Check that API responds
curl -I https://netco.onrender.com/api/orders/health

# Should return 200 or 404 (doesn't matter, just checking it responds)
```

### Verify Database

After creating a test order:

```bash
# Using psql or database client
SELECT id, configUrl FROM orders WHERE created_at > NOW() - INTERVAL 1 HOUR LIMIT 1;

# Should show:
# id: some-uuid
# configUrl: https://netco.onrender.com/api/orders/some-uuid/download
# (NOT: /api/orders/some-uuid/download)
```

### Verify Download Works

1. Create a test order
2. Copy the `configUrl` from database
3. Open in browser directly
4. Verify:
   - File downloads (not HTML error page)
   - File is `.hc` format (binary, not text)
   - Response headers are correct

### Verify Response Headers

```bash
curl -I "https://netco.onrender.com/api/orders/test-id/download"

# Should show:
# HTTP/1.1 200 OK
# Content-Type: application/octet-stream
# Content-Disposition: attachment; filename="config.hc"
# (NOT: Content-Type: text/html)
```

---

## Backward Compatibility

### Will This Break Old Orders?

**No.** The frontend's `apiUrl()` function is backward compatible:

```typescript
// Old database entry (relative URL)
const configUrl = "/api/orders/123/download";
apiUrl(configUrl);
// → Returns: https://netco.onrender.com/api/orders/123/download ✅

// New database entry (absolute URL)
const configUrl = "https://netco.onrender.com/api/orders/123/download";
apiUrl(configUrl);
// → Returns as-is: https://netco.onrender.com/api/orders/123/download ✅
```

Both formats work seamlessly.

---

## Risk Assessment

### Risk Level: 🟡 LOW-MEDIUM

**Why it's low risk**:
- ✅ Changes only affect config URL format
- ✅ Download endpoint logic unchanged
- ✅ Frontend handles both URL formats
- ✅ Easy to rollback (revert code changes)
- ✅ Existing orders still work

**Why it's not zero risk**:
- 🟡 If env variables not set, downloads will fail
- 🟡 Must redeploy both API and frontend
- 🟡 New orders depend on new code paths

**Mitigation**:
- Set environment variables BEFORE deploying code
- Test in staging first if possible
- Have rollback plan ready
- Monitor error logs first hour after deploy

### Rollback Plan

If something goes wrong:

```bash
# Revert code changes
git revert <commit-hash>
git push

# Redeploy API from Render dashboard
# Frontend will continue working (backward compatible)
```

---

## Files Affected

### Code Changes Required
1. ✅ `artifacts/api-server/src/routes/orders.ts`
2. ✅ `artifacts/api-server/src/routes/payment.ts`
3. ✅ `artifacts/api-server/src/routes/admin-orders.ts`

### No Changes Needed
- ✅ `artifacts/api-server/src/routes/orders.ts` (download endpoint) - headers already correct
- ✅ `artifacts/netco/src/components/free-config-download-modal.tsx` - already handles both URL formats
- ✅ `artifacts/netco/src/lib/api.ts` - already correct
- ✅ Supabase schema - no changes needed
- ✅ Any frontend components - no changes needed

---

## Key Implementation Details

### API_BASE_URL Constant

```typescript
const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3001";
```

This is safe because:
- **For production**: Uses `https://netco.onrender.com` from env var
- **For development**: Falls back to `http://localhost:3001`
- **Removes trailing slashes**: Ensures clean URLs (no `//api`)

### Why Not Just Hardcode?

```typescript
// ❌ BAD - hardcoded, not flexible
const configUrl = `https://netco.onrender.com/api/orders/${orderId}/download`;

// ✅ GOOD - uses env var, flexible for dev/staging/production
const configUrl = `${API_BASE_URL}/api/orders/${orderId}/download`;
```

---

## Timeline

| Phase | Time | Status |
|-------|------|--------|
| Read docs | 10 min | |
| Set env vars | 5 min | |
| Make code changes | 10 min | |
| Commit & push | 5 min | |
| Deploy API | 5-10 min | |
| Deploy frontend | 3-5 min | |
| Test | 15-20 min | |
| **Total** | **~60 min** | |

---

## Testing Checklist

After deployment, verify:

```
Core Functionality
□ Create free order → get configUrl back
  Expected: "https://netco.onrender.com/api/orders/abc123/download"
  Not: "/api/orders/abc123/download"

□ Create paid order via payment flow → auto-fulfill
  Expected: configUrl is absolute with netco.onrender.com
  Not: Relative path

□ Admin manual order fulfillment
  Expected: configUrl is absolute with netco.onrender.com
  Not: Relative path

Download Functionality
□ Download from dashboard
  Expected: .hc file downloads
  Not: HTML error page

□ Download from order status email
  Expected: .hc file downloads
  Not: 404 error

□ Download from admin panel
  Expected: .hc file downloads
  Not: HTML error page

Response Verification
□ Check download headers
  Expected: Content-Disposition: attachment; filename="config.hc"
  Expected: Content-Type: application/octet-stream
  Not: text/html

□ Check downloaded file
  Expected: Binary .hc format (can decompress with tar/gzip)
  Not: HTML or JSON

Database Verification
□ Check order in Supabase
  Expected: configUrl = "https://netco.onrender.com/..."
  Not: "/api/..."

Error Handling
□ Try to download non-existent order
  Expected: 404 with proper error message
  Not: HTML 404 page

□ Try to download with invalid ID
  Expected: 400 or 404
  Not: Server error
```

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Downloads return 404 | `API_BASE_URL` not set | Set in Render environment variables |
| HTML file downloads | Wrong Content-Type header | Code change didn't apply, re-deploy |
| configUrl still relative | Code changes didn't deploy | Check Render logs, redeploy API |
| Frontend shows error | `VITE_API_BASE_URL` not set | Set in Vercel environment variables |
| Old orders broken | Didn't check backward compat | They still work via apiUrl() function |
| Download too slow | Render free tier spinning up | Upgrade Render plan or use caching |

---

## Contact & Support

If you need help:
1. Check Render logs: Dashboard → Events
2. Check Vercel logs: Project → Deployments
3. Check browser DevTools: Network tab for failed requests
4. Check database: Verify configUrl format in Supabase

---

## Summary

| Item | Details |
|------|---------|
| **Issue** | Relative config URLs fail across different domains |
| **Impact** | Config downloads broken in production |
| **Locations** | 3 API route files (orders, payment, admin-orders) |
| **Changes** | Add 1 constant, modify 1 URL in each file |
| **Environment** | 2 variables (API_BASE_URL, VITE_API_BASE_URL) |
| **Effort** | ~60 minutes total |
| **Risk** | Low (backward compatible, easy rollback) |
| **Backward Compat** | Yes - old orders still work |
| **Testing** | 15+ verification steps provided |

---

## Next Steps

1. **Read** this document
2. **Set environment variables** in Render and Vercel
3. **Update** the three API route files
4. **Test** in development (optional)
5. **Commit and push** changes
6. **Deploy** API first, then frontend
7. **Verify** using the testing checklist
8. **Monitor** logs for errors

---

**Status**: Ready to Implement  
**Version**: 1.0 (Corrected - Using Your Render URLs)  
**Created**: June 22, 2026
