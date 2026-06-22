# NETCO Config Download - Exact Code Changes Required

**Total Changes**: 3 files, 2 additions, 3 modifications

---

## File 1: `artifacts/api-server/src/routes/orders.ts`

### Change 1a: Add Constant (after imports, around line 5-10)

Add this line:

```typescript
const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3001";
```

### Change 1b: Update Line 120

**BEFORE:**
```typescript
const configUrl = `/api/orders/${orderId}/download`;
```

**AFTER:**
```typescript
const configUrl = `${API_BASE_URL}/api/orders/${orderId}/download`;
```

**Full Context** (lines 118-122):
```typescript
// ... previous code ...
const orderId = req.params.id;
const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3001";
const configUrl = `${API_BASE_URL}/api/orders/${orderId}/download`;
// ... rest of code ...
```

---

## File 2: `artifacts/api-server/src/routes/payment.ts`

### Change 2a: Add Constant (after imports, around line 5-10)

Add this line:

```typescript
const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3001";
```

### Change 2b: Update Line 78

**BEFORE:**
```typescript
const configUrl = `/api/orders/${orderId}/download`;
```

**AFTER:**
```typescript
const configUrl = `${API_BASE_URL}/api/orders/${orderId}/download`;
```

**Full Context** (lines 76-80):
```typescript
// ... previous code ...
const orderId = req.params.id;
const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3001";
const configUrl = `${API_BASE_URL}/api/orders/${orderId}/download`;
// ... rest of code ...
```

---

## File 3: `artifacts/api-server/src/routes/admin-orders.ts`

### Change 3a: Add Constant (after imports, around line 5-10)

Add this line:

```typescript
const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3001";
```

### Change 3b: Update Line 100

**BEFORE:**
```typescript
const configUrl = `/api/orders/${order.id}/download`;
```

**AFTER:**
```typescript
const configUrl = `${API_BASE_URL}/api/orders/${order.id}/download`;
```

**Full Context** (lines 98-102):
```typescript
// ... previous code ...
const orderId = order.id;
const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3001";
const configUrl = `${API_BASE_URL}/api/orders/${order.id}/download`;
// ... rest of code ...
```

---

## Environment Variables

### For Render Dashboard

**Path**: Dashboard → NETCO → Environment

Add:
```
Key: API_BASE_URL
Value: https://netco.onrender.com
```

### For Vercel Dashboard

**Path**: Project Settings → Environment Variables

Add:
```
Name: VITE_API_BASE_URL
Value: https://netco.onrender.com
Environments: Production, Preview, Development
```

---

## Verification

After making changes:

```bash
# Check constant is added to all 3 files
grep -n "const API_BASE_URL" artifacts/api-server/src/routes/orders.ts
grep -n "const API_BASE_URL" artifacts/api-server/src/routes/payment.ts
grep -n "const API_BASE_URL" artifacts/api-server/src/routes/admin-orders.ts

# Check URLs use the constant
grep -n "configUrl.*API_BASE_URL" artifacts/api-server/src/routes/orders.ts
grep -n "configUrl.*API_BASE_URL" artifacts/api-server/src/routes/payment.ts
grep -n "configUrl.*API_BASE_URL" artifacts/api-server/src/routes/admin-orders.ts
```

All should return matches.

---

## Commit Message

```
fix: use absolute URLs for config downloads

- Store full API URLs instead of relative paths
- Fixes downloads when API and frontend on different domains
- Backward compatible with frontend apiUrl() function
- Requires API_BASE_URL environment variable set
```

---

## Deployment Steps

1. Make code changes above
2. Commit & push to main
3. Set environment variables in Render and Vercel
4. Wait for auto-deploys (10-15 minutes)
5. Test by creating order and downloading

---

## Test Command

```bash
# After deployment, test the API
curl -I "https://netco.onrender.com/api/orders/test-id/download"

# Should return 200 or 404 (proving API responds)
# Old: might return 404 "not found" (because test-id doesn't exist)
# New: should return headers with Content-Type: application/octet-stream
```

---

## That's It!

Three files, two URLs, three lines changed = working config downloads ✅

---

**Version**: 1.0  
**Status**: Ready to Apply  
**Created**: June 22, 2026
