# NETCO Config Download - Executive Summary

## Status: 🔴 CRITICAL - BROKEN IN PRODUCTION

The config download flow will **fail when API and frontend are on different domains** (which is the production setup).

---

## The Problem in 30 Seconds

**Current behavior**:
- API stores config URLs as relative paths: `/api/orders/123/download`
- Frontend is on: `https://netco.app`
- Browser tries to download from: `https://netco.app/api/orders/123/download` ❌
- API is actually at: `https://api.netco.app/api/orders/123/download` ❌
- Result: **404 Download Fails**

**After fix**:
- API stores config URLs as absolute paths: `https://api.netco.app/api/orders/123/download`
- Browser downloads from: `https://api.netco.app/api/orders/123/download` ✅
- Result: **Download Works**

---

## What Needs to be Fixed

### 1️⃣ API Server - Three Routes Need Updates

| File | Issue | Fix |
|------|-------|-----|
| `artifacts/api-server/src/routes/orders.ts` | Line 120: Stores relative URL | Change to absolute URL using `API_BASE_URL` |
| `artifacts/api-server/src/routes/payment.ts` | Line 78: Stores relative URL | Change to absolute URL using `API_BASE_URL` |
| `artifacts/api-server/src/routes/admin-orders.ts` | Line 100: Stores relative URL | Change to absolute URL using `API_BASE_URL` |

### 2️⃣ Environment Variables

Add to API server:
```env
API_BASE_URL=https://api.netco.app
```

Add to frontend:
```env
VITE_API_BASE_URL=https://api.netco.app
```

### 3️⃣ Download Endpoint

**Current headers**: ✅ **Already correct** - No changes needed
- `Content-Disposition: attachment; filename="config.hc"`
- `Content-Type: application/octet-stream`
- File returned is actual `.hc` binary (not HTML)

### 4️⃣ Frontend Component

**Already correct** - No changes needed
- Uses `apiUrl()` function which prepends API base URL
- Handles both absolute and relative URLs

---

## Quick Implementation Guide

### Step 1: Update `orders.ts` (Line 120)

```diff
- const configUrl = `/api/orders/${orderId}/download`;
+ const configUrl = `${API_BASE_URL}/api/orders/${orderId}/download`;
```

Add this to the top of the file:
```typescript
const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3001";
```

### Step 2: Update `payment.ts` (Line 78)

```diff
- const configUrl = `/api/orders/${orderId}/download`;
+ const configUrl = `${API_BASE_URL}/api/orders/${orderId}/download`;
```

Add this to the top of the file:
```typescript
const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3001";
```

### Step 3: Update `admin-orders.ts` (Line 100)

```diff
- const configUrl = `/api/orders/${order.id}/download`;
+ const configUrl = `${API_BASE_URL}/api/orders/${order.id}/download`;
```

Add this to the top of the file:
```typescript
const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3001";
```

### Step 4: Set Environment Variables

**Deployment platform (Render, Railway, etc.):**
```env
API_BASE_URL=https://api.netco.app
```

**Vercel frontend:**
```env
VITE_API_BASE_URL=https://api.netco.app
```

### Step 5: Deploy

1. Deploy API changes first
2. Deploy frontend changes
3. Test: Create order → Download config → Verify .hc file received

---

## Why This Matters

### Current Architecture
```
Frontend: https://netco.app
API: https://api.netco.app ← Different domain!
```

When API and frontend are on **different domains**:
- Relative URLs don't work (frontend domain ≠ API domain)
- Must use absolute URLs with full domain
- This is **standard production setup**

### What's Currently Stored in Database
```json
{
  "id": "order-123",
  "configUrl": "/api/orders/order-123/download",
  "status": "completed"
}
```

### What Should be Stored
```json
{
  "id": "order-123",
  "configUrl": "https://api.netco.app/api/orders/order-123/download",
  "status": "completed"
}
```

---

## Files Affected

### Required Changes
- ✅ `artifacts/api-server/src/routes/orders.ts` — Add 1 const, modify 1 line
- ✅ `artifacts/api-server/src/routes/payment.ts` — Add 1 const, modify 1 line
- ✅ `artifacts/api-server/src/routes/admin-orders.ts` — Add 1 const, modify 1 line

### No Changes Needed
- ✅ `artifacts/netco/src/components/free-config-download-modal.tsx` — Already handles correctly
- ✅ `artifacts/api-server/src/routes/orders.ts` (download endpoint) — Headers already correct
- ✅ Frontend `apiUrl()` function — Already backward compatible

---

## Backward Compatibility

✅ **Fully backward compatible** with frontend

The frontend's `apiUrl()` function intelligently handles:

```typescript
// Absolute URL (after fix)
apiUrl("https://api.netco.app/api/orders/123/download")
→ Returns as-is ✅

// Relative URL (legacy data or fallback)
apiUrl("/api/orders/123/download")
→ Prepends API_BASE_URL ✅

// No URL
apiUrl("")
→ Returns "" ✅
```

This means:
- Old orders with relative URLs still work ✅
- New orders get absolute URLs ✅
- Can deploy frontend changes without API downtime ✅

---

## Testing Checklist

After deployment, verify:

```
□ Create new free order → get configUrl back
  Expected: "https://api.netco.app/api/orders/abc123/download"
  Not: "/api/orders/abc123/download"

□ Create paid order via payment flow → auto-fulfill
  Expected: Order database has absolute configUrl
  Not: Relative path

□ Manual admin order fulfillment
  Expected: Order database has absolute configUrl
  Not: Relative path

□ Download config from dashboard
  Expected: .hc binary file downloads
  Not: HTML error page

□ Download config from order status page
  Expected: .hc binary file downloads
  Not: HTML error page

□ Browser dev tools check headers
  Expected: 
    Content-Disposition: attachment; filename="..."
    Content-Type: application/octet-stream
  Not: HTML content-type

□ File verification
  Expected: Downloaded file is binary .hc format
  Not: HTML or JSON error response
```

---

## Deployment Instructions

### Prerequisites
- Access to API server environment variables (Render, Railway, etc.)
- Access to Vercel project settings
- Git access to repository

### Deployment Steps

1. **Create a feature branch**
   ```bash
   git checkout -b fix/config-download-absolute-urls
   ```

2. **Make code changes** (as detailed in CONFIG_DOWNLOAD_FIXES.md)
   - Update orders.ts (line 120)
   - Update payment.ts (line 78)
   - Update admin-orders.ts (line 100)

3. **Commit changes**
   ```bash
   git commit -m "fix: use absolute URLs for config downloads

   - Store full API URLs instead of relative paths
   - Fixes downloads when API and frontend on different domains
   - Backward compatible with frontend apiUrl() function"
   ```

4. **Push and create PR**
   ```bash
   git push origin fix/config-download-absolute-urls
   ```

5. **Set environment variables**
   
   For **API Server** (Render/Railway dashboard):
   ```
   API_BASE_URL = https://api.netco.app
   ```
   
   For **Frontend** (Vercel Project Settings > Environment Variables):
   ```
   VITE_API_BASE_URL = https://api.netco.app
   ```

6. **Merge and deploy API first**
   - Reviews complete
   - All tests pass
   - Merge to main
   - Deploy API server

7. **Wait for API deployment** (5-10 minutes)
   - Verify API is running
   - Check API logs for no errors

8. **Deploy frontend**
   - If using Vercel: Automatically redeploys after env vars updated
   - If manual deployment: Deploy after confirming API is up

9. **Test end-to-end**
   - Create test order
   - Click download button
   - Verify .hc file downloads
   - Check browser console for no errors

10. **Monitor**
    - Watch API logs for download requests
    - Watch error tracking for file download issues
    - Verify production users can download

---

## Risk Assessment

### Risk Level: 🟡 LOW-MEDIUM

**Positive**:
- Changes only affect config URL storage format
- Download endpoint remains unchanged
- Frontend already handles both formats
- Can't break existing orders (backward compatible)
- Environment variables are safe defaults

**Negative**:
- Affects all new orders after deployment
- Must set environment variables or downloads break
- Need to redeploy both API and frontend

**Mitigation**:
- Set environment variables BEFORE deploying API code
- Test in staging environment first
- Have rollback plan ready (revert code changes)
- Monitor error logs during first hour after deployment

---

## Rollback Plan

If issues occur:

1. **Revert API code changes**
   ```bash
   git revert <commit-hash>
   git push
   ```

2. **Redeploy API server**
   - Back to relative URLs
   - Already deployed frontend still works via apiUrl()

3. **No frontend rollback needed**
   - Frontend continues working with both URL formats
   - Backward compatible

---

## Questions & Answers

**Q: Will this break existing orders?**
A: No. The frontend's `apiUrl()` function handles both absolute and relative URLs. Existing orders with relative URLs still work via `VITE_API_BASE_URL` prepending.

**Q: Do I need to update the database?**
A: No. Only new orders going forward will have absolute URLs. Old orders stay as-is and work via the frontend helper function.

**Q: What if I forget to set the environment variables?**
A: Downloads will fail because:
- API will use default `http://localhost:3001` (production API won't be there)
- Set them before deploying code changes

**Q: Can I deploy frontend first?**
A: Yes, but downloads will fail until API is deployed with the fix. Better to deploy API first to avoid user confusion.

**Q: What about CORS issues?**
A: Not relevant - these are direct download URLs, not API calls. No CORS headers needed.

**Q: Is this a security issue?**
A: No. The download endpoint already validates:
- Order exists
- Order is completed
- Matching server exists
- File exists in storage

Absolute URLs don't change security posture.

---

## Summary

| Item | Details |
|------|---------|
| **Problem** | Relative config URLs fail when API and frontend on different domains |
| **Impact** | Config downloads break in production |
| **Scope** | 3 API route files, 2 environment variables |
| **Effort** | ~15 minutes to implement |
| **Risk** | Low (backward compatible, easy rollback) |
| **Testing** | 10 verification steps |
| **Deployment** | API first, then frontend |
| **Documentation** | CONFIG_DOWNLOAD_FIXES.md for exact code changes |

---

## Related Files

- 📄 **CONFIG_DOWNLOAD_AUDIT.md** - Detailed audit findings
- 📄 **CONFIG_DOWNLOAD_FIXES.md** - Exact code changes line-by-line
- 📄 **CONFIG_DOWNLOAD_DIAGRAM.md** - Visual diagrams and architecture
- 📄 **CONFIG_DOWNLOAD_SUMMARY.md** - This file

---

**Created**: June 22, 2026
**Version**: 1.0
**Status**: Ready for Implementation
