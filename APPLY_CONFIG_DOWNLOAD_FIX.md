# Apply Config Download Fix - Complete Code Patches

This file contains complete, copy-paste-ready code snippets. Apply these in order.

---

## PATCH 1: Update `artifacts/api-server/src/routes/orders.ts`

### Change 1.1: Add API_BASE_URL constant (after imports)

Find this:
```typescript
import path from "path";
import { downloadConfigFile, getSupabaseAdmin } from "../lib/storage";

const router = Router();
```

Replace with:
```typescript
import path from "path";
import { downloadConfigFile, getSupabaseAdmin } from "../lib/storage";

const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3001";
const router = Router();
```

### Change 1.2: Update configUrl generation in `/free` POST route (around line 120)

Find this:
```typescript
router.post("/free", async (req, res) => {
  try {
    const userId = await resolveUserIdFromRequest(req);
    if (!userId) {
      res.status(401).json({ error: "Authentication required. Sign in and try again." });
      return;
    }

    const { packageId, network, duration, appType, deviceId, phone } = req.body as {
      packageId?: string;
      network?: string;
      duration?: string;
      appType?: string;
      deviceId?: string;
      phone?: string;
    };

    if (!network || !duration || !appType || !deviceId || !phone) {
      res.status(400).json({ error: "Missing required fields: network, duration, appType, deviceId, phone" });
      return;
    }

    const [freeServer] = await db
      .select()
      .from(configServersTable)
      .where(
        and(
          eq(configServersTable.network, network),
          eq(configServersTable.appType, appType),
          eq(configServersTable.duration, duration),
          eq(configServersTable.status, "active"),
          eq(configServersTable.isFree, true)
        )
      )
      .limit(1);

    if (!freeServer) {
      res.status(404).json({ error: "No free config available for this combination" });
      return;
    }

    const orderId = randomUUID();
    const configUrl = `/api/orders/${orderId}/download`;  // ← CHANGE THIS LINE
    const ext = path.extname(freeServer.originalName).toLowerCase();
```

Replace the configUrl line with:
```typescript
    const orderId = randomUUID();
    const configUrl = `${API_BASE_URL}/api/orders/${orderId}/download`;  // ← FIXED
    const ext = path.extname(freeServer.originalName).toLowerCase();
```

**That's all for orders.ts!** The rest of the code automatically uses this updated `configUrl`.

---

## PATCH 2: Update `artifacts/api-server/src/routes/payment.ts`

### Change 2.1: Add API_BASE_URL constant (after imports)

Find this:
```typescript
import { sendOrderConfirmationEmail } from "../lib/email.js";

const router = Router();
```

Replace with:
```typescript
import { sendOrderConfirmationEmail } from "../lib/email.js";

const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3001";
const router = Router();
```

### Change 2.2: Update configUrl in autoFulfillOrder function (around line 78)

Find this section within the `autoFulfillOrder` function:
```typescript
async function autoFulfillOrder(orderId: string, logger: MinimalLogger) {
  try {
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
    if (!order || order.configUrl) return;

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
      logger.warn?.(`No matching config server for order ${orderId}`);
      return;
    }

    // Verify file exists in Supabase Storage
    try {
      await downloadConfigFile(server.filename);
    } catch {
      logger.warn?.(`Config file missing in storage for server ${server.id}`);
      return;
    }

    const configUrl = `/api/orders/${orderId}/download`;  // ← CHANGE THIS LINE
    const ext = path.extname(server.originalName).toLowerCase();
```

Replace the configUrl line with:
```typescript
    const configUrl = `${API_BASE_URL}/api/orders/${orderId}/download`;  // ← FIXED
    const ext = path.extname(server.originalName).toLowerCase();
```

**That's all for payment.ts!**

---

## PATCH 3: Update `artifacts/api-server/src/routes/admin-orders.ts`

### Change 3.1: Add API_BASE_URL constant (after imports)

Find this:
```typescript
import { downloadConfigFile } from "../lib/storage";

const router = Router();
```

Replace with:
```typescript
import { downloadConfigFile } from "../lib/storage";

const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3001";
const router = Router();
```

### Change 3.2: Update configUrl in fulfill endpoint (around line 100)

Find this section in the POST `/orders/:id/fulfill` route:
```typescript
    const configUrl = `/api/orders/${order.id}/download`;  // ← CHANGE THIS LINE
    const ext = path.extname(server.originalName).toLowerCase();

    await db.transaction(async (tx) => {
      await tx.update(ordersTable)
        .set({ status: "completed", configUrl })
        .where(eq(ordersTable.id, order.id));
```

Replace the configUrl line with:
```typescript
    const configUrl = `${API_BASE_URL}/api/orders/${order.id}/download`;  // ← FIXED
    const ext = path.extname(server.originalName).toLowerCase();

    await db.transaction(async (tx) => {
      await tx.update(ordersTable)
        .set({ status: "completed", configUrl })
        .where(eq(ordersTable.id, order.id));
```

**That's all for admin-orders.ts!**

---

## PATCH 4: No changes needed to frontend

File: `artifacts/netco/src/components/free-config-download-modal.tsx`

The `apiUrl()` function already handles both absolute and relative URLs correctly. No changes needed.

---

## PATCH 5: Environment Variables

### For API Server

Add to your deployment platform (Render, Railway, DigitalOcean, etc.):

```env
API_BASE_URL=https://api.netco.app
```

For local development, add to `.env` file or use:
```env
API_BASE_URL=http://localhost:3001
```

### For Frontend

Add to Vercel project (Project Settings → Environment Variables):

```env
VITE_API_BASE_URL=https://api.netco.app
```

For local development, add to `artifacts/netco/.env`:
```env
VITE_API_BASE_URL=http://localhost:3001
```

---

## Verification Script

After applying all patches, verify the changes were applied correctly:

```bash
#!/bin/bash
# Check orders.ts
grep -n "const API_BASE_URL" artifacts/api-server/src/routes/orders.ts || echo "ERROR: API_BASE_URL not found in orders.ts"
grep -n "\${API_BASE_URL}/api/orders" artifacts/api-server/src/routes/orders.ts || echo "ERROR: configUrl not updated in orders.ts"

# Check payment.ts
grep -n "const API_BASE_URL" artifacts/api-server/src/routes/payment.ts || echo "ERROR: API_BASE_URL not found in payment.ts"
grep -n "\${API_BASE_URL}/api/orders" artifacts/api-server/src/routes/payment.ts || echo "ERROR: configUrl not updated in payment.ts"

# Check admin-orders.ts
grep -n "const API_BASE_URL" artifacts/api-server/src/routes/admin-orders.ts || echo "ERROR: API_BASE_URL not found in admin-orders.ts"
grep -n "\${API_BASE_URL}/api/orders" artifacts/api-server/src/routes/admin-orders.ts || echo "ERROR: configUrl not updated in admin-orders.ts"

echo "✓ Verification complete"
```

---

## Testing After Deployment

1. **Create a free order** and check the response:
   ```bash
   curl -X POST http://localhost:3001/api/orders/free \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"network":"safaricom","duration":"daily","appType":"http_custom","deviceId":"test123","phone":"0712345678"}'
   ```
   
   Should return:
   ```json
   {
     "configUrl": "https://api.netco.app/api/orders/abc-123/download",
     ...
   }
   ```
   
   Not: `"/api/orders/abc-123/download"`

2. **Check database directly**:
   ```sql
   SELECT id, configUrl FROM orders WHERE id = 'abc-123';
   ```
   
   Should show: `https://api.netco.app/api/orders/abc-123/download`

3. **Test download endpoint**:
   ```bash
   curl -I https://api.netco.app/api/orders/abc-123/download
   ```
   
   Should return:
   ```
   HTTP/1.1 200 OK
   Content-Type: application/octet-stream
   Content-Disposition: attachment; filename="server.hc"
   ```

4. **Test frontend download**:
   - Go to dashboard
   - Click download button
   - Verify .hc file downloads (not HTML error)

---

## Rollback Instructions

If something goes wrong:

1. **Revert code changes**:
   ```bash
   git revert <commit-hash>
   git push
   ```

2. **Redeploy API server**:
   - Back to using relative URLs
   - Frontend still works via `apiUrl()` helper

3. **No frontend rollback needed**:
   - Frontend continues working automatically

---

## Checklist

Before deploying:

- [ ] Read CONFIG_DOWNLOAD_AUDIT.md
- [ ] Read CONFIG_DOWNLOAD_SUMMARY.md
- [ ] Applied all 3 code patches
- [ ] Verified grep script output
- [ ] Set environment variables
- [ ] Created backup of current code
- [ ] Code reviewed by team member

After deploying:

- [ ] API server deployed successfully
- [ ] API logs show no errors
- [ ] Created test order
- [ ] Verified configUrl in database
- [ ] Download endpoint working
- [ ] Frontend deployed
- [ ] Test download from dashboard
- [ ] Test download from order status
- [ ] Verified .hc file downloads
- [ ] Checked browser console for errors
- [ ] Monitored logs for 1 hour

---

## Support

If you encounter issues:

1. Check API logs: `docker logs <api-container>`
2. Check browser console: F12 in Chrome/Firefox
3. Check environment variables are set correctly
4. Verify both API_BASE_URL and VITE_API_BASE_URL point to same domain
5. Try rolling back if all else fails

---

## Files Modified

1. ✅ `artifacts/api-server/src/routes/orders.ts`
2. ✅ `artifacts/api-server/src/routes/payment.ts`
3. ✅ `artifacts/api-server/src/routes/admin-orders.ts`
4. ❌ `artifacts/netco/src/components/free-config-download-modal.tsx` (no changes)
5. ✅ Environment variables (2 platforms)

**Total changes**: 3 files, 6 code lines, 100% backward compatible
