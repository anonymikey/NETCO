# NETCO Config Download - Visual Flow Diagram & Exact Line Numbers

## Current Architecture (BROKEN IN PRODUCTION)

```
┌─────────────────────────────────────────────────────────────────┐
│ Production Environment                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Browser on netco.app                 Separate API on api.netco  │
│  ┌──────────────────────────┐         ┌────────────────────────┐ │
│  │  Frontend (React/Vite)    │         │  API Server (Express)  │ │
│  │  Domain: netco.app        │         │  Domain: api.netco.app │ │
│  │                           │         │                        │ │
│  │  User clicks download     │         │  /api/orders/:id/..    │ │
│  │  - Component has URL:     │         │  Returns: configUrl    │ │
│  │    "/api/orders/123/dwnl" │────────→│  = "/api/orders/123... │ │
│  │                           │         │                        │ │
│  │  Browser interprets as:   │         │  ❌ PROBLEM:           │ │
│  │  netco.app/api/orders/... │         │  Relative URL stored   │ │
│  │  ❌ WRONG DOMAIN!         │         │  in database           │ │
│  └──────────────────────────┘         └────────────────────────┘ │
│                                                                   │
│  Request fails: 404 Not Found                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Fixed Architecture (WORKING IN PRODUCTION)

```
┌─────────────────────────────────────────────────────────────────┐
│ Production Environment                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Browser on netco.app                 Separate API on api.netco  │
│  ┌──────────────────────────┐         ┌────────────────────────┐ │
│  │  Frontend (React/Vite)    │         │  API Server (Express)  │ │
│  │  Domain: netco.app        │         │  Domain: api.netco.app │ │
│  │  ENV: VITE_API_BASE_URL   │         │  ENV: API_BASE_URL     │ │
│  │  = api.netco.app          │         │  = api.netco.app       │ │
│  │                           │         │                        │ │
│  │  User clicks download     │         │  /api/orders/:id/...   │ │
│  │  - Component has URL:     │         │  Returns: configUrl    │ │
│  │    (relative initially)   │         │  = "https://api...     │ │
│  │  - apiUrl() function      │         │     /api/orders/123"   │ │
│  │    prepends API_BASE_URL  │         │                        │ │
│  │  - Becomes:               │         │  ✅ ABSOLUTE URL:      │ │
│  │    api.netco.app/api/...  │────────→│  works from any domain │ │
│  │                           │         │                        │ │
│  │  ✅ Request succeeds      │←────────│  Returns .hc file with │ │
│  │  Binary .hc file received │         │  correct headers       │ │
│  └──────────────────────────┘         └────────────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow & URL Evolution

```
┌──────────────────────────────────────────────────────────────────────┐
│ ORDER LIFECYCLE - URL TRANSFORMATION                                 │
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│ 1. FREE ORDER CREATED                                                 │
│    ┌────────────────────────────────────────────────────────────┐   │
│    │ POST /api/orders/free                                      │   │
│    │ ├─ orders.ts:120 (NEEDS FIX)                              │   │
│    │ │  const configUrl = `/api/orders/${orderId}/download`;    │   │
│    │ │  OLD: "/api/orders/abc-123/download" ❌ RELATIVE       │   │
│    │ │  NEW: "https://api.netco.app/api/orders/abc-123/..."   │   │
│    │ └─ DB Insert: order.configUrl = configUrl                │   │
│    └────────────────────────────────────────────────────────────┘   │
│                                                                        │
│ 2. PAYMENT INITIATED (PAID ORDERS)                                   │
│    ┌────────────────────────────────────────────────────────────┐   │
│    │ POST /api/payment/initiate                                 │   │
│    │ ├─ Triggers STK push to user's phone                       │   │
│    │ └─ Stores order with status: "pending"                    │   │
│    └────────────────────────────────────────────────────────────┘   │
│                                                                        │
│ 3. PAYMENT COMPLETED                                                  │
│    ┌────────────────────────────────────────────────────────────┐   │
│    │ GET /api/payment/status/:reference                         │   │
│    │ ├─ payflow.ts:78 (NEEDS FIX)                              │   │
│    │ │  const configUrl = `/api/orders/${orderId}/download`;    │   │
│    │ │  OLD: "/api/orders/xyz-789/download" ❌ RELATIVE       │   │
│    │ │  NEW: "https://api.netco.app/api/orders/xyz-789/..."   │   │
│    │ │                                                           │   │
│    │ ├─ db.update(orders).set({                                │   │
│    │ │    status: "completed",                                 │   │
│    │ │    configUrl: configUrl  ← NEW ABSOLUTE URL            │   │
│    │ │  })                                                      │   │
│    │ └─ Response includes configUrl (absolute) ✅             │   │
│    └────────────────────────────────────────────────────────────┘   │
│                                                                        │
│ 4. ADMIN MANUAL FULFILLMENT                                          │
│    ┌────────────────────────────────────────────────────────────┐   │
│    │ POST /admin/orders/:id/fulfill                             │   │
│    │ ├─ admin-orders.ts:100 (NEEDS FIX)                        │   │
│    │ │  const configUrl = `/api/orders/${order.id}/download`;   │   │
│    │ │  OLD: "/api/orders/def-456/download" ❌ RELATIVE       │   │
│    │ │  NEW: "https://api.netco.app/api/orders/def-456/..."   │   │
│    │ │                                                           │   │
│    │ ├─ db.transaction: update order + insert user_plan        │   │
│    │ └─ Returns configUrl (absolute) ✅                       │   │
│    └────────────────────────────────────────────────────────────┘   │
│                                                                        │
│ 5. FRONTEND DISPLAYS DOWNLOAD LINK                                   │
│    ┌────────────────────────────────────────────────────────────┐   │
│    │ GET /api/plans (query for user's active plans)             │   │
│    │ ├─ plans.ts:47                                             │   │
│    │ │  Returns plan.configUrl (from user_plans table)          │   │
│    │ │  ← Already absolute from step 3 or 4 ✅                │   │
│    │ └─ Frontend receives: "https://api.netco.app/api..."      │   │
│    │                                                             │   │
│    │ OR                                                           │   │
│    │                                                             │   │
│    │ GET /api/orders/:id (for single order status)              │   │
│    │ ├─ orders.ts:formatOrder (line 210+)                      │   │
│    │ │  Returns order.configUrl ← Already absolute ✅          │   │
│    │ └─ Frontend receives: "https://api.netco.app/api..."      │   │
│    └────────────────────────────────────────────────────────────┘   │
│                                                                        │
│ 6. FRONTEND DOWNLOAD BUTTON CLICKED                                  │
│    ┌────────────────────────────────────────────────────────────┐   │
│    │ free-config-download-modal.tsx:97-98                       │   │
│    │ ├─ const downloadUrl = apiUrl(order.configUrl)            │   │
│    │ │  Input: "https://api.netco.app/api/orders/123/download" │   │
│    │ │  apiUrl() detects absolute URL (already has protocol)   │   │
│    │ │  Returns as-is: "https://api.netco.app/api/..."         │   │
│    │ └─ Browser receives: correct absolute URL ✅             │   │
│    │                                                             │   │
│    │ OR (dashboard/order-status with relative legacy data)      │   │
│    │ ├─ Input: "/api/orders/123/download" (old format)         │   │
│    │ │  apiUrl() prepends VITE_API_BASE_URL                    │   │
│    │ │  Returns: "https://api.netco.app/api/..."               │   │
│    │ └─ Backward compatible ✅                                 │   │
│    └────────────────────────────────────────────────────────────┘   │
│                                                                        │
│ 7. BROWSER DOWNLOAD                                                   │
│    ┌────────────────────────────────────────────────────────────┐   │
│    │ GET https://api.netco.app/api/orders/123/download          │   │
│    │ ├─ orders.ts:GET /:id/download (line 177+)               │   │
│    │ │  ✅ 1. Verify order exists and status = "completed"    │   │
│    │ │  ✅ 2. Find matching config server                     │   │
│    │ │  ✅ 3. Download .hc file from Supabase storage         │   │
│    │ │  ✅ 4. Set headers:                                    │   │
│    │ │      - Content-Type: application/octet-stream          │   │
│    │ │      - Content-Disposition: attachment;                │   │
│    │ │        filename="server.hc"                            │   │
│    │ │      - Content-Length: {buffer.byteLength}            │   │
│    │ │  ✅ 5. res.send(buffer) - send actual .hc file       │   │
│    │ │                                                           │   │
│    │ └─ Browser receives: Binary .hc file ✅ DOWNLOAD WORKS   │   │
│    └────────────────────────────────────────────────────────────┘   │
│                                                                        │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Exact Line Numbers - Change Locations

### File 1: `artifacts/api-server/src/routes/orders.ts`

```
Line 1-7:    [Imports]
Line 8:      import path from "path";
Line 9:      import { downloadConfigFile, getSupabaseAdmin } from "../lib/storage";
             ↓
             ADD HERE: const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3001";
             ↓
Line 10:     const router = Router();

Line 112-140: /free POST route
Line 120:    const configUrl = `/api/orders/${orderId}/download`;
             ↓
             CHANGE TO: const configUrl = `${API_BASE_URL}/api/orders/${orderId}/download`;
             ↓
Line 134:    [Uses configUrl - no change needed]
Line 140:    res.status(201).json({ ...formatOrder(order), configUrl });

Line 177-182: GET /:id/download route
             [NO CHANGES - headers already correct]
             Headers already properly set:
             - Content-Disposition ✅
             - Content-Type ✅
             - Content-Length ✅
```

---

### File 2: `artifacts/api-server/src/routes/payment.ts`

```
Line 1-9:    [Imports]
Line 10:     import { sendOrderConfirmationEmail } from "../lib/email.js";
             ↓
             ADD HERE: const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3001";
             ↓
Line 11:     const router = Router();

Line 50:     async function autoFulfillOrder(orderId: string, logger: MinimalLogger) {
Line 51:       try {
Line 52:         const [order] = await db.select()...
             ...
Line 78:       const configUrl = `/api/orders/${orderId}/download`;
               ↓
               CHANGE TO: const configUrl = `${API_BASE_URL}/api/orders/${orderId}/download`;
               ↓
Line 83:       await db.transaction(async (tx) => {
Line 84:         await tx.update(ordersTable)
Line 85:           .set({ status: "completed", configUrl })
               [configUrl already updated from line 78]
```

---

### File 3: `artifacts/api-server/src/routes/admin-orders.ts`

```
Line 1-5:    [Imports]
Line 6:      import { downloadConfigFile } from "../lib/storage";
             ↓
             ADD HERE: const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3001";
             ↓
Line 7:      const router = Router();

Line 100:    const configUrl = `/api/orders/${order.id}/download`;
             ↓
             CHANGE TO: const configUrl = `${API_BASE_URL}/api/orders/${order.id}/download`;
             ↓
Line 105:    await tx.update(ordersTable)
Line 106:      .set({ status: "completed", configUrl })
             [configUrl already updated from line 100]
```

---

### File 4: `artifacts/netco/src/components/free-config-download-modal.tsx`

```
Line 1-70:   [No changes needed - apiUrl() already handles both absolute and relative]
Line 97-98:  if (order.configUrl) {
               const downloadUrl = apiUrl(order.configUrl);
             [Already works with absolute URLs ✅]
```

---

### File 5: Environment Variables

**API Server** (Render, Railway, etc.):
```env
API_BASE_URL=https://api.netco.app
```

**Frontend** (Vercel):
```env
VITE_API_BASE_URL=https://api.netco.app
```

---

## Download Endpoint Behavior - BEFORE and AFTER

### BEFORE FIX (BROKEN)

```
1. User creates order
   API stores: configUrl = "/api/orders/123/download"
   ↓
2. Frontend fetches order
   Receives: { ..., configUrl: "/api/orders/123/download" }
   ↓
3. User clicks download button
   Browser navigates to: netco.app/api/orders/123/download
   ↓
4. WRONG DOMAIN! 404 Error
   ❌ Browser: netco.app (frontend domain)
   ❌ Tries to find: netco.app/api/orders/123/download
   ❌ API is at: api.netco.app/api/orders/123/download
```

### AFTER FIX (WORKING)

```
1. User creates order
   API stores: configUrl = "https://api.netco.app/api/orders/123/download"
   ↓
2. Frontend fetches order
   Receives: { ..., configUrl: "https://api.netco.app/api/orders/123/download" }
   ↓
3. User clicks download button
   Browser navigates to: https://api.netco.app/api/orders/123/download
   ↓
4. CORRECT DOMAIN! 200 Success
   ✅ Browser follows absolute URL
   ✅ Reaches: api.netco.app/api/orders/123/download
   ✅ Downloads: Binary .hc file with correct headers
```

---

## Summary

| Component | Lines | Change Type | Status |
|-----------|-------|------------|--------|
| orders.ts | +9, +120 | ADD const, UPDATE configUrl | 🔴 REQUIRED |
| payment.ts | +10, +78 | ADD const, UPDATE configUrl | 🔴 REQUIRED |
| admin-orders.ts | +6, +100 | ADD const, UPDATE configUrl | 🔴 REQUIRED |
| orders.ts (download) | 177-182 | None | ✅ Already Correct |
| free-config-download-modal.tsx | 97-98 | None | ✅ Already Correct |
| .env (API) | — | ADD variable | 🔴 REQUIRED |
| .env (Frontend) | — | ADD variable | 🔴 REQUIRED |

**Total Changes**: 3 files, 6 locations, 100% backward compatible with frontend `apiUrl()` function
