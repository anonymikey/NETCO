# NETCO Config Download - Exact Code Changes

## Overview
This document contains the **exact code changes** needed to fix the config download flow. Apply these changes in order.

---

## Change 1: Update `artifacts/api-server/src/routes/orders.ts`

### Step 1.1: Add API_BASE_URL constant at top of file

**Location**: After line 7 (after `import path from "path";`)

**Add this line**:
```typescript
const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3001";
```

**Before (after imports)**:
```typescript
import path from "path";
import { downloadConfigFile, getSupabaseAdmin } from "../lib/storage";

const router = Router();
```

**After (with change)**:
```typescript
import path from "path";
import { downloadConfigFile, getSupabaseAdmin } from "../lib/storage";

const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3001";
const router = Router();
```

---

### Step 1.2: Update `/free` POST endpoint (Line 120)

**Current**:
```typescript
const orderId = randomUUID();
const configUrl = `/api/orders/${orderId}/download`;
const ext = path.extname(freeServer.originalName).toLowerCase();
```

**Replace with**:
```typescript
const orderId = randomUUID();
const configUrl = `${API_BASE_URL}/api/orders/${orderId}/download`;
const ext = path.extname(freeServer.originalName).toLowerCase();
```

---

### Step 1.3: Update POST response (Lines 134, 140)

These lines already reference `configUrl` variable created above, so they automatically get the absolute URL. No change needed to these lines - they inherit from Step 1.2.

---

## Change 2: Update `artifacts/api-server/src/routes/payment.ts`

### Step 2.1: Add API_BASE_URL constant at top of file

**Location**: After line 9 (after the last `import` statement)

**Add this block**:
```typescript
const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3001";
```

**Before**:
```typescript
import { sendOrderConfirmationEmail } from "../lib/email.js";

const router = Router();
```

**After**:
```typescript
import { sendOrderConfirmationEmail } from "../lib/email.js";

const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3001";
const router = Router();
```

---

### Step 2.2: Update `autoFulfillOrder` function (Line 78)

**Current (Line 78)**:
```typescript
const configUrl = `/api/orders/${orderId}/download`;
```

**Replace with**:
```typescript
const configUrl = `${API_BASE_URL}/api/orders/${orderId}/download`;
```

---

## Change 3: Update `artifacts/api-server/src/routes/admin-orders.ts`

### Step 3.1: Add API_BASE_URL constant at top of file

**Location**: After line 5 (after `import { downloadConfigFile } from "../lib/storage";`)

**Add this line**:
```typescript
const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3001";
```

**Before**:
```typescript
import { downloadConfigFile } from "../lib/storage";

const router = Router();
```

**After**:
```typescript
import { downloadConfigFile } from "../lib/storage";

const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3001";
const router = Router();
```

---

### Step 3.2: Update POST `/orders/:id/fulfill` endpoint (Line 100)

**Current**:
```typescript
const configUrl = `/api/orders/${order.id}/download`;
```

**Replace with**:
```typescript
const configUrl = `${API_BASE_URL}/api/orders/${order.id}/download`;
```

---

## Change 4: No changes needed to `artifacts/netco/src/components/free-config-download-modal.tsx`

The frontend component already handles this correctly via the `apiUrl()` function:

```typescript
if (order.configUrl) {
  const downloadUrl = apiUrl(order.configUrl);  // This will work with absolute URLs
  // ...
}
```

The `apiUrl()` function intelligently handles both:
- **Absolute URLs**: Returns as-is (our new format: `https://api.netco.app/api/orders/...`)
- **Relative URLs**: Prepends `API_BASE_URL` (fallback for legacy data)

**No code changes needed** - frontend already future-proof.

---

## Change 5: Add Environment Variables

### For API Server

Add to your deployment platform (Render, Railway, etc.) or `.env` file:

```env
API_BASE_URL=https://api.netco.app
```

For local development:
```env
API_BASE_URL=http://localhost:3001
```

### For Frontend

Add to Vercel project settings or `.env` file:

```env
VITE_API_BASE_URL=https://api.netco.app
```

For local development:
```env
VITE_API_BASE_URL=http://localhost:3001
```

**Important**: Both must point to the same API domain.

---

## Change 6: Optional - Add file extension validation

**File**: `artifacts/api-server/src/routes/orders.ts`

**Location**: Inside `GET /:id/download` handler, after line 168 (after `if (order.status !== "completed")`)

**Add this validation** (optional but recommended):
```typescript
// Validate file extension
const ext = path.extname(server.originalName).toLowerCase();
if (ext !== ".hc" && ext !== ".ehi" && ext !== ".ovpn") {
  res.status(422).json({ error: "Invalid config file format. Expected .hc or .ehi file." });
  return;
}
```

**Full updated handler**:
```typescript
router.get("/:id/download", async (req, res) => {
  const { id } = req.params;

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  if (order.status !== "completed") {
    res.status(403).json({ error: "Order not completed yet" });
    return;
  }

  const [server] = await db
    .select()
    .from(configServersTable)
    .where(
      and(
        eq(configServersTable.network, order.network),
        eq(configServersTable.appType, order.appType),
        eq(configServersTable.duration, order.duration),
        eq(configServersTable.status, "active")
      )
    )
    .limit(1);

  if (!server) {
    res.status(404).json({ error: "Config server not found for this order" });
    return;
  }

  // Validate file extension (OPTIONAL BUT RECOMMENDED)
  const ext = path.extname(server.originalName).toLowerCase();
  if (ext !== ".hc" && ext !== ".ehi" && ext !== ".ovpn") {
    res.status(422).json({ error: "Invalid config file format. Expected .hc or .ehi file." });
    return;
  }

  const buffer = await downloadConfigFile(server.filename);

  res.setHeader("Content-Disposition", `attachment; filename="${server.originalName}"`);
  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Content-Length", buffer.byteLength);
  res.send(buffer);
});
```

---

## Summary of Changes

| File | Change | Type | Priority |
|------|--------|------|----------|
| `orders.ts` | Add `API_BASE_URL` const + use in line 120 | Required | 🔴 HIGH |
| `payment.ts` | Add `API_BASE_URL` const + use in line 78 | Required | 🔴 HIGH |
| `admin-orders.ts` | Add `API_BASE_URL` const + use in line 100 | Required | 🔴 HIGH |
| `.env` (API) | Add `API_BASE_URL` env var | Required | 🔴 HIGH |
| `.env` (Frontend) | Add `VITE_API_BASE_URL` env var | Required | 🔴 HIGH |
| `orders.ts` | Add file ext validation | Optional | 🟡 MEDIUM |

---

## Deployment Steps

1. **Make code changes above** (Changes 1-3)
2. **Set environment variables**:
   - Add `API_BASE_URL=https://api.netco.app` to API server
   - Add `VITE_API_BASE_URL=https://api.netco.app` to frontend
3. **Deploy API** first (will create orders with absolute URLs)
4. **Deploy Frontend** (will use absolute URLs from orders)
5. **Test**: Create new order → download config → verify .hc file downloads

---

## Verification

After deployment, test that:

✅ New orders have absolute URLs in `configUrl` field
✅ Downloads work from different domains
✅ Browser receives correct `Content-Disposition: attachment` header
✅ File received is `.hc` binary, not HTML error page
✅ File size matches original config file

---

## Rollback (if needed)

If issues occur:
1. Revert code changes
2. Redeploy with relative URLs
3. Frontend's `apiUrl()` function will still handle relative URLs via `VITE_API_BASE_URL`

The system is designed to be backward compatible.
