# NETCO Config Download Flow Audit

## Executive Summary

The config download flow has **CRITICAL ISSUES** with relative URLs that will break in production. All `configUrl` fields store relative paths (`/api/orders/:id/download`), which the frontend treats as relative to the current domain. If the API and frontend are on different domains, downloads will fail.

**Current Status**: ❌ **BROKEN IN PRODUCTION**

---

## 1. Deployment Architecture

### API Server
- **Location**: `artifacts/api-server`
- **Framework**: Express.js (Node.js)
- **Deployment**: Separate from frontend (different domain in production)
- **Entry Point**: `artifacts/api-server/src/index.ts`
- **Default Port**: 3001 (inferred from typical Express setup)
- **Routes**: `/api/*` namespace

### Frontend
- **Location**: `artifacts/netco`
- **Framework**: React + Vite (SPA)
- **Deployment**: Static site (separate from API in production)
- **Entry Point**: `artifacts/netco/src/main.tsx`
- **Build Output**: `artifacts/netco/dist`
- **API Connection**: Via `VITE_API_BASE_URL` environment variable

### Deployment Pattern
```
Production:
├── Frontend: https://netco.app (Vercel/Static hosting)
└── API: https://api.netco.app or https://netco.app/api (separate service)
```

---

## 2. Current Config URL Flow

### Problem Areas

#### A. Orders Route (`artifacts/api-server/src/routes/orders.ts`)
**Lines 120, 134, 140**
```typescript
// CURRENT (BROKEN in production):
const configUrl = `/api/orders/${orderId}/download`;
// ...
configUrl,  // Stored in database as relative URL
```

**Issue**: Relative URL stored in database. When frontend is on different domain, `/api/orders/:id/download` resolves to `frontend.com/api/orders/:id/download` ❌

#### B. Payment Route (`artifacts/api-server/src/routes/payment.ts`)
**Lines 50, 78, 83, 101, 336, 354, 364**
```typescript
// CURRENT (BROKEN):
const configUrl = `/api/orders/${orderId}/download`;  // Line 78
await tx.update(ordersTable).set({ status: "completed", configUrl })  // Line 83
```

Same issue - relative URL that breaks when API and frontend are on different domains.

#### C. Admin Orders Route (`artifacts/api-server/src/routes/admin-orders.ts`)
**Lines 100, 105, 123, 132**
```typescript
// CURRENT (BROKEN):
const configUrl = `/api/orders/${order.id}/download`;  // Line 100
res.json({ success: true, configUrl });  // Line 132 - returns relative URL
```

#### D. Frontend Download Component (`artifacts/netco/src/components/free-config-download-modal.tsx`)
**Lines 97-98**
```typescript
// CURRENT:
if (order.configUrl) {
  const downloadUrl = apiUrl(order.configUrl);  // Calls apiUrl() on relative path
  // The apiUrl() function prepends API_BASE_URL, so this works...
  // BUT if API_BASE_URL is empty, it stays relative
```

**Workaround**: The `apiUrl()` function in `artifacts/netco/src/lib/api.ts` salvages this:
```typescript
export function apiUrl(path: string): string {
  if (!path.startsWith("/")) return path;
  if (API_BASE) return `${API_BASE}${path}`;  // Only if env var set
  return path;  // Falls back to relative if not configured
}
```

**Issue**: Relies on `VITE_API_BASE_URL` being set correctly. If empty or missing, download fails.

---

## 3. Download Endpoint Headers ✅ **CORRECT**

### File: `artifacts/api-server/src/routes/orders.ts` (Lines 177-180)
```typescript
router.get("/:id/download", async (req, res) => {
  // ...
  res.setHeader("Content-Disposition", `attachment; filename="${server.originalName}"`);
  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Content-Length", buffer.byteLength);
  res.send(buffer);
});
```

**Status**: ✅ Correct
- `Content-Type: application/octet-stream` - correct for binary files
- `Content-Disposition: attachment; filename="..."` - triggers browser download
- `Content-Length` header - good for progress tracking
- **File verification**: Calls `downloadConfigFile()` which fetches from Supabase/local disk - returns `.hc` binary file ✅

**However**: There's no validation that the file is `.hc`. It just sends whatever is in storage. This is acceptable if upload validation is enforced elsewhere.

---

## 4. Database Schema - `configUrl` Field

### File: `lib/db/src/schema/orders.ts`
```typescript
configUrl: text("config_url"),  // Stores URL as text
```

**Current Storage**:
- Type: `text` (String in database)
- Format: Relative path: `/api/orders/{orderId}/download`
- Problem: No validation that this is absolute

---

## 5. Exact Code Changes Required

### Change 1: Orders Route - Store Absolute URL
**File**: `artifacts/api-server/src/routes/orders.ts`

**Current (Lines 120, 134, 140)**:
```typescript
const configUrl = `/api/orders/${orderId}/download`;
```

**Required**:
```typescript
const API_BASE_URL = process.env.API_BASE_URL || `http://localhost:3001`;
const configUrl = `${API_BASE_URL}/api/orders/${orderId}/download`;
```

**Location**: After line 1 (imports), add at router definition:
```typescript
const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3001";
```

### Change 2: Payment Route - Store Absolute URL
**File**: `artifacts/api-server/src/routes/payment.ts`

**Current (Line 78)**:
```typescript
const configUrl = `/api/orders/${orderId}/download`;
```

**Required**:
```typescript
const configUrl = `${API_BASE_URL}/api/orders/${orderId}/download`;
```

**Location**: Add at top of file (after imports):
```typescript
const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3001";
```

### Change 3: Admin Orders Route - Store Absolute URL
**File**: `artifacts/api-server/src/routes/admin-orders.ts`

**Current (Line 100)**:
```typescript
const configUrl = `/api/orders/${order.id}/download`;
```

**Required**:
```typescript
const configUrl = `${API_BASE_URL}/api/orders/${order.id}/download`;
```

**Location**: Add at top of file (after imports):
```typescript
const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3001";
```

---

## 6. Environment Variable Configuration

### Required Environment Variables

#### For API Server:
```env
# .env or deployment platform (e.g., Render, Railway)
API_BASE_URL=https://api.netco.app
# or for local development:
API_BASE_URL=http://localhost:3001
```

#### For Frontend:
```env
# .env.development or deployment platform (Vercel)
VITE_API_BASE_URL=https://api.netco.app
# or for local development:
VITE_API_BASE_URL=http://localhost:3001
```

**Note**: Both must point to the same API domain for downloads to work.

---

## 7. Download Verification Checklist

### Current Issues:
- ❌ Config URLs stored as relative paths in database
- ❌ Will fail when API and frontend on different domains
- ❌ Download endpoints don't verify response is `.hc` file (could return HTML error page if misconfigured)

### After Fixes:
- ✅ Absolute URLs stored in database
- ✅ Works across different domains
- ✅ Headers correctly set for file download
- ✅ Supabase/local storage properly referenced

### Test Scenario:
```
1. Frontend: https://netco.app
2. API: https://api.netco.app
3. User creates free order
4. Database stores: https://api.netco.app/api/orders/{id}/download
5. Frontend fetches: https://api.netco.app/api/orders/{id}/download ✅
6. API returns: .hc binary file with correct headers ✅
```

---

## 8. Future Plan Storage References

### Current Implementation (`artifacts/api-server/src/routes/plans.ts`, Line 47):
```typescript
configUrl: p.configUrl ?? null,  // Returns whatever is in user_plans table
```

**Future Requirements**:
- Plans table (`user_plans`) also stores `configUrl` field
- Must also be migrated to absolute URLs when created
- Check migrations: `lib/db/migrations/` for schema updates
- Update any plan creation logic to use absolute URLs

**Files to Update Later**:
1. Any migration that inserts into `user_plans` table
2. Any code that creates plans to use `${API_BASE_URL}/api/orders/...` format

---

## 9. Content-Type and Content-Disposition Validation

### Current Implementation (`artifacts/api-server/src/routes/orders.ts`, Lines 177-182):
```typescript
router.get("/:id/download", async (req, res) => {
  // ... order and server lookup ...
  
  const buffer = await downloadConfigFile(server.filename);
  
  res.setHeader("Content-Disposition", `attachment; filename="${server.originalName}"`);
  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Content-Length", buffer.byteLength);
  res.send(buffer);
});
```

### Potential Issue:
No validation that `server.originalName` actually ends with `.hc`. If a wrong file is uploaded, it could return incorrect file types.

### Recommended Addition:
```typescript
// Validate file extension
const ext = path.extname(server.originalName).toLowerCase();
if (ext !== ".hc" && ext !== ".ehi") {  // Add valid extensions
  res.status(422).json({ error: "Invalid config file format" });
  return;
}
```

---

## Summary of Required Changes

| File | Lines | Issue | Fix |
|------|-------|-------|-----|
| `orders.ts` | 120, 134, 140 | Relative URL | Use `${API_BASE_URL}/api/orders/...` |
| `payment.ts` | 78, 83 | Relative URL | Use `${API_BASE_URL}/api/orders/...` |
| `admin-orders.ts` | 100, 105, 123, 132 | Relative URL | Use `${API_BASE_URL}/api/orders/...` |
| `orders.ts` (download) | 177-182 | Headers OK ✅ | No changes needed |
| `.env` files | — | Missing variable | Add `API_BASE_URL=https://api.netco.app` |

---

## Deployment Checklist

- [ ] Add `API_BASE_URL` env var to API server (Render/Railway/etc)
- [ ] Update `VITE_API_BASE_URL` env var in frontend (Vercel)
- [ ] Ensure both point to same API domain
- [ ] Deploy API changes first
- [ ] Deploy frontend changes
- [ ] Test download flow end-to-end
- [ ] Verify database contains absolute URLs for new orders
- [ ] Monitor logs for any remaining relative URL issues
