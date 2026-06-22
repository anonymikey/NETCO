# NETCO Config Download Fix - Quick Reference Card

## TL;DR (30 seconds)

**Problem**: Downloads fail when API and frontend on different domains (production)  
**Cause**: Relative URLs stored in database instead of absolute URLs  
**Fix**: Add `API_BASE_URL` constant, use in 3 files, set 2 env vars  
**Time**: 50 minutes total  
**Risk**: Low (backward compatible)

---

## The Three Code Changes

### Change 1: `artifacts/api-server/src/routes/orders.ts`

```diff
+ const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3001";

- const configUrl = `/api/orders/${orderId}/download`;
+ const configUrl = `${API_BASE_URL}/api/orders/${orderId}/download`;
```

**Line**: Add after imports, modify line 120

### Change 2: `artifacts/api-server/src/routes/payment.ts`

```diff
+ const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3001";

- const configUrl = `/api/orders/${orderId}/download`;
+ const configUrl = `${API_BASE_URL}/api/orders/${orderId}/download`;
```

**Line**: Add after imports, modify line 78

### Change 3: `artifacts/api-server/src/routes/admin-orders.ts`

```diff
+ const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3001";

- const configUrl = `/api/orders/${order.id}/download`;
+ const configUrl = `${API_BASE_URL}/api/orders/${order.id}/download`;
```

**Line**: Add after imports, modify line 100

---

## The Two Environment Variables

### For API Server
```env
API_BASE_URL=https://netco.onrender.com
```
Set in: Render Environment tab

### For Frontend  
```env
VITE_API_BASE_URL=https://netco.onrender.com
```
Set in: Vercel Project Settings

---

## Verification

After applying patches, run:
```bash
grep -n "const API_BASE_URL" artifacts/api-server/src/routes/{orders,payment,admin-orders}.ts
# Should show 3 lines
grep -n "\${API_BASE_URL}" artifacts/api-server/src/routes/{orders,payment,admin-orders}.ts
# Should show 3 lines
```

---

## Testing

1. **Create order**: `POST /api/orders/free`
   - Expect: `configUrl: "https://api.netco.app/api/orders/..."`
   - Not: `configUrl: "/api/orders/..."`

2. **Check database**:
   - `SELECT configUrl FROM orders WHERE id='...'`
   - Expect: Absolute URL with domain

3. **Download**: Click download button
   - Expect: .hc file downloads
   - Not: HTML error page

4. **Headers**: Open DevTools Network tab
   - `Content-Type: application/octet-stream` ✅
   - `Content-Disposition: attachment` ✅

---

## Deployment Order

1. **Set environment variables** first (critical!)
2. **Deploy API server**
3. **Wait 5 minutes** for stability
4. **Deploy frontend**
5. **Test immediately**

---

## Rollback (if needed)

```bash
git revert <commit-hash>
git push
# Redeploy API
# Frontend continues working via apiUrl()
```

---

## Files to Reference

- **Need to understand?** → `CONFIG_DOWNLOAD_SUMMARY.md`
- **Need code details?** → `CONFIG_DOWNLOAD_FIXES.md`
- **Need exact lines?** → `CONFIG_DOWNLOAD_DIAGRAM.md`
- **Need to implement?** → `APPLY_CONFIG_DOWNLOAD_FIX.md`
- **Need to navigate?** → `CONFIG_DOWNLOAD_AUDIT_INDEX.md`

---

## What's Already Correct ✅

- ✅ Download endpoint headers
- ✅ File format validation
- ✅ Frontend apiUrl() function
- ✅ Supabase storage integration
- ✅ No database migration needed

---

## What's Broken 🔴

- ❌ orders.ts line 120 (relative URL)
- ❌ payment.ts line 78 (relative URL)
- ❌ admin-orders.ts line 100 (relative URL)
- ❌ Missing API_BASE_URL environment variable
- ❌ Missing VITE_API_BASE_URL environment variable

---

## Success Indicators

After fix is deployed:

```
✅ configUrl = "https://api.netco.app/api/orders/123/download"
✅ Download works from netco.app
✅ Browser downloads .hc file
✅ No 404 errors in logs
✅ No HTML error responses
```

---

## Common Issues

| Issue | Solution |
|-------|----------|
| `404 Not Found` on download | Check `API_BASE_URL` env var is set |
| HTML error page downloads | Check `Content-Type` header, file location |
| Downloads still not working | Verify API_BASE_URL has full domain |
| Frontend deployment failed | Ensure `VITE_API_BASE_URL` is set |
| Old orders broken | Use apiUrl() function - already in code |

---

## Who Does What

| Role | Action |
|------|--------|
| DevOps | Set 2 environment variables |
| Backend Dev | Apply 3 code patches |
| Frontend Dev | Deploy (no code changes needed) |
| QA | Run testing checklist |
| PM | Schedule & monitor |

---

## Timeline

| Phase | Time | Notes |
|-------|------|-------|
| Prep | 5 min | Read docs, set env vars |
| Code | 15 min | Apply 3 patches, commit |
| Deploy | 10 min | API first, then frontend |
| Test | 20 min | Create order, download, verify |
| Total | 50 min | Can be done in 1 sprint |

---

## The Problem Visualized

```
BEFORE (BROKEN):
Frontend: netco.app
API: netco.onrender.com
User clicks download
Browser: netco.app/api/orders/123/download ❌ (wrong domain!)
API: netco.onrender.com/api/orders/123/download (not reached)
Result: 404

AFTER (FIXED):
Frontend: netco.app
API: netco.onrender.com
User clicks download
Browser: netco.onrender.com/api/orders/123/download ✅ (correct domain!)
API: Returns .hc file ✅
Result: Download works!
```

---

## Key Constants

```typescript
// Add to 3 files (orders.ts, payment.ts, admin-orders.ts):
const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3001";

// Use in configUrl:
const configUrl = `${API_BASE_URL}/api/orders/${orderId}/download`;
```

---

## Backward Compatibility

✅ **Yes, fully compatible**

The frontend's `apiUrl()` function handles:
- Absolute URLs (new format): Returns as-is
- Relative URLs (old format): Prepends API_BASE_URL
- Empty URLs: Returns empty

No old orders are broken.

---

## One-Line Fix Summary

**Replace 3 relative URLs with absolute URLs using `${API_BASE_URL}` constant**

---

## Debug Commands

```bash
# Check API is responding
curl https://netco.onrender.com/api/orders/health

# Check config file exists
# (after order created)
curl -I https://netco.onrender.com/api/orders/abc123/download

# Check headers
curl -I https://netco.onrender.com/api/orders/abc123/download | grep Content-

# Check database
psql -c "SELECT id, configUrl FROM orders LIMIT 1;"
```

---

## Maximum Effort Checklist

- [ ] Read CONFIG_DOWNLOAD_SUMMARY.md (5 min)
- [ ] Read CONFIG_DOWNLOAD_FIXES.md (20 min)
- [ ] Read CONFIG_DOWNLOAD_DIAGRAM.md (10 min)
- [ ] Review APPLY_CONFIG_DOWNLOAD_FIX.md (5 min)
- [ ] Apply 3 code patches (5 min)
- [ ] Set 2 environment variables (2 min)
- [ ] Commit & push changes (2 min)
- [ ] Deploy API (5 min)
- [ ] Deploy frontend (5 min)
- [ ] Run testing checklist (20 min)
- [ ] Monitor logs (10 min)

**Total**: ~90 minutes (thorough approach)

---

## Minimum Effort Checklist

- [ ] Skim CONFIG_DOWNLOAD_SUMMARY.md (2 min)
- [ ] Copy patches from APPLY_CONFIG_DOWNLOAD_FIX.md (5 min)
- [ ] Set 2 environment variables (1 min)
- [ ] Deploy & test (15 min)

**Total**: ~25 minutes (experienced developers)

---

## Document Index

| File | Lines | Read Time |
|------|-------|-----------|
| QUICK_REFERENCE.md | 250 | 2 min |
| CONFIG_DOWNLOAD_SUMMARY.md | 405 | 5 min |
| CONFIG_DOWNLOAD_FIXES.md | 309 | 20 min |
| CONFIG_DOWNLOAD_AUDIT.md | 311 | 15 min |
| CONFIG_DOWNLOAD_DIAGRAM.md | 322 | 10 min |
| APPLY_CONFIG_DOWNLOAD_FIX.md | 379 | 10 min |

**Total**: 2,070 lines (~70 KB comprehensive docs)

---

## That's It!

Three files, two environment variables, one commit, two deployments = **config downloads working in production** ✅

---

**Last Updated**: June 22, 2026  
**Quick Ref Version**: 1.0  
**Status**: Ready to Use
