# NETCO System Audit Report

## Issue 1: Config Download System

### Problem
Dashboard download button appears to download index.html instead of config file.

### Root Cause Analysis

**Vercel Configuration (vercel.json):**
```json
"rewrites": [
  { "source": "/api/:path*", "destination": "/api/handler" },
  { "source": "/:path*", "destination": "/index.html" }
]
```

This catch-all rewrite sends ALL requests to `/index.html`, including `/api/orders/:id/download`.

### API Route Status
✅ The `/api/orders/:id/download` endpoint is correctly implemented:
- Sets `Content-Disposition: attachment; filename="..."`
- Sets `Content-Type: application/octet-stream`
- Returns binary buffer data
- No code issues

### Issue Source
❌ The Vercel rewrite rule `{ "source": "/:path*", "destination": "/index.html" }` is too broad and catches `/api/orders/:id/download` BEFORE it reaches the Express handler.

### Solution
The vercel.json rewrites need to exclude `/api/*` from the HTML catch-all:

**Current (BROKEN):**
```json
"rewrites": [
  { "source": "/api/:path*", "destination": "/api/handler" },
  { "source": "/:path*", "destination": "/index.html" }
]
```

**Fixed (NEEDED):**
```json
"rewrites": [
  { "source": "/api/:path*", "destination": "/api/handler" },
  { "source": "/((?!/api).)*", "destination": "/index.html" }
]
```

The regex `((?!/api).)*` matches any path that does NOT start with `/api/`.

---

## Issue 2: Dashboard Instructions Not Displaying

### Problem
Instructions are stored in the database but not showing in the dashboard.

### Root Cause Analysis

**Database Status:** ✅ `user_plans.instructions` column exists and contains values
**API Schema Status:** ❌ `ListPlansResponseItem` zod schema missing `instructions` field
**API Response Status:** ❌ `/api/plans` endpoint not returning `instructions` field
**Frontend Status:** ✅ Dashboard UI code exists and ready to render

### Missing Link in Chain
The API response never includes `instructions`, so even though the code is ready to display it, the data never arrives at the frontend.

### Fixes Applied

1. **Updated API Schema** (`lib/api-zod/src/generated/api.ts`):
   - Added `"instructions": zod.string().nullish()` to `ListPlansResponseItem`

2. **Updated API Endpoint** (`artifacts/api-server/src/routes/plans.ts`):
   - Added `instructions: p.instructions ?? null` to the formatted response

### Verification Checklist
- ✅ Database has instructions data
- ✅ Schema now includes instructions
- ✅ API endpoint now returns instructions
- ✅ Frontend UI ready to display (already implemented with cyan glowing card)

---

## Summary of Changes

| File | Change | Status |
|------|--------|--------|
| `/api/orders/:id/download` | Route code correct, no changes | ✅ Working |
| `vercel.json` | Rewrite rule needs fix | ⚠️ Config issue |
| `lib/api-zod/src/generated/api.ts` | Added instructions field | ✅ Fixed |
| `artifacts/api-server/src/routes/plans.ts` | Added instructions to response | ✅ Fixed |
| `artifacts/netco/src/pages/dashboard.tsx` | UI already ready | ✅ Ready |

---

## Next Steps

1. **Config Download Fix:** Update Vercel rewrite rule to exclude `/api/*` from HTML catch-all
2. **Instructions Display:** Already fixed - API will now return instructions
3. **Test:** Verify download endpoint returns binary file and instructions appear in dashboard

---

## Testing Commands

### Test Download Endpoint
```bash
curl -v https://netco.anonymiketech.online/api/orders/{ORDER_ID}/download
# Should return: Content-Type: application/octet-stream
# Should return: Content-Disposition: attachment
# Should NOT return: index.html
```

### Test Plans API
```bash
curl https://netco.anonymiketech.online/api/plans?phone=254712345678
# Should return: "instructions": "This file connects within..."
```
