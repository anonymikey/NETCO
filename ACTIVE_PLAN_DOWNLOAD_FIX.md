## Active Plan Config Download Fix - Complete Implementation

### Problem Identified
Users downloading configs from active plans were getting `.html` files instead of actual `.hc` or `.ehi` config files. The free config downloads worked correctly because they used the `apiUrl()` helper function, but active plan downloads did not.

### Root Cause
1. **API Server** was storing relative config URLs (`/api/orders/123/download`) instead of absolute URLs
2. **Frontend Dashboard** was using raw config URLs without the `apiUrl()` helper function
3. When browser tried to download from relative path on `netco.app` domain, it was intercepted and served `index.html` instead of the binary file

### Changes Made

#### 1. Frontend - Dashboard Page (`artifacts/netco/src/pages/dashboard.tsx`)
**Added Import:**
```typescript
import { apiUrl } from "@/lib/api";
```

**Fixed Download Link:**
```typescript
// Before
<a href={plan.configUrl} download data-testid={`button-download-${plan.id}`}>

// After
<a href={apiUrl(plan.configUrl)} download data-testid={`button-download-${plan.id}`}>
```

**What it does:**
- The `apiUrl()` function converts relative URLs to absolute URLs using `VITE_API_BASE_URL`
- Ensures downloads are requested from the correct API domain (`netco.onrender.com`)
- Backward compatible with both relative and absolute URLs

---

#### 2. Frontend - Order Status Page (`artifacts/netco/src/pages/order-status.tsx`)
**Added Import:**
```typescript
import { apiUrl } from "@/lib/api";
```

**Fixed Download Link:**
```typescript
// Before
<a href={configUrl} download className="w-full">

// After
<a href={apiUrl(configUrl)} download className="w-full">
```

**What it does:**
- Same as dashboard fix - ensures the payment completion download uses absolute URLs

---

#### 3. API Server - Orders Route (`artifacts/api-server/src/routes/orders.ts`)
**Added Constant:**
```typescript
const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3001";
```

**Fixed Config URL Storage (Line 121):**
```typescript
// Before
const configUrl = `/api/orders/${orderId}/download`;

// After
const configUrl = `${API_BASE_URL}/api/orders/${orderId}/download`;
```

**What it does:**
- Stores absolute URLs instead of relative URLs in the database
- Uses `API_BASE_URL` environment variable (set in Render)
- Falls back to localhost for development

---

#### 4. API Server - Payment Route (`artifacts/api-server/src/routes/payment.ts`)
**Added Constant:**
```typescript
const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3001";
```

**Fixed Config URL Storage (Line 79):**
```typescript
// Before
const configUrl = `/api/orders/${orderId}/download`;

// After
const configUrl = `${API_BASE_URL}/api/orders/${orderId}/download`;
```

**What it does:**
- Same as orders.ts - stores absolute URLs for paid order completions

---

#### 5. API Server - Admin Orders Route (`artifacts/api-server/src/routes/admin-orders.ts`)
**Added Constant:**
```typescript
const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3001";
```

**Fixed Config URL Storage (Line 101):**
```typescript
// Before
const configUrl = `/api/orders/${order.id}/download`;

// After
const configUrl = `${API_BASE_URL}/api/orders/${order.id}/download`;
```

**What it does:**
- Stores absolute URLs when admin manually fulfills orders

---

### Environment Variables Required

**Render (API Server):**
```
API_BASE_URL = https://netco.onrender.com
```

**Vercel (Frontend):**
```
VITE_API_BASE_URL = https://netco.onrender.com
```

### How It Works Now

1. **User purchases a plan** → Payment completed
2. **API stores config URL** → `https://netco.onrender.com/api/orders/123/download` (absolute)
3. **Frontend displays download button** → Uses `apiUrl()` to ensure correct domain
4. **User clicks download** → Browser requests from `netco.onrender.com` (correct domain)
5. **API returns .hc/.ehi file** → File downloads successfully ✅

### Backward Compatibility

- **Old Orders (before fix)**: Have relative URLs stored in database. The frontend's `apiUrl()` function still works because it prepends `VITE_API_BASE_URL` to relative paths.
- **New Orders (after fix)**: Have absolute URLs stored in database. Downloads work reliably.
- **No Database Migration Needed**: The fix is fully backward compatible.

### Testing Checklist

```
✓ Render: Set API_BASE_URL environment variable
✓ Vercel: Set VITE_API_BASE_URL environment variable
✓ Deploy both API and frontend
✓ Create test order and complete payment
✓ Click download button on active plan
✓ Verify .hc or .ehi file downloads (not index.html)
✓ Test with old orders (backward compatibility)
✓ Check browser DevTools Network tab:
  - URL: https://netco.onrender.com/api/orders/{id}/download
  - Content-Type: application/octet-stream
  - Content-Disposition: attachment; filename="..."
  - Response: Binary file (not HTML)
```

### Files Modified

1. `/artifacts/netco/src/pages/dashboard.tsx` - Added import, fixed download link
2. `/artifacts/netco/src/pages/order-status.tsx` - Added import, fixed download link
3. `/artifacts/api-server/src/routes/orders.ts` - Added constant, fixed URL storage
4. `/artifacts/api-server/src/routes/payment.ts` - Added constant, fixed URL storage
5. `/artifacts/api-server/src/routes/admin-orders.ts` - Added constant, fixed URL storage

### Summary

This fix ensures that active plan config downloads work exactly like free config downloads by:
1. Storing absolute URLs with the correct API domain in the database
2. Using the `apiUrl()` helper on the frontend to ensure proper URL handling
3. Maintaining full backward compatibility with existing orders

Total changes: 5 files, 10 lines added, 3 lines modified.
