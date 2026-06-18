# Admin Panel Config Delivery - Fix Applied

## Problem Found

When admin tries to deliver a config from the admin panel using `POST /api/admin/orders/:id/fulfill`, the endpoint returns:
```
Error 422: "Config file not found on disk"
```

### Root Cause
**File: `artifacts/api-server/src/routes/admin-orders.ts` (lines 90-92)**

The fulfillment route was checking for config files on **local disk**:
```typescript
const filePath = path.join(UPLOADS_DIR, server.filename);
if (!fs.existsSync(filePath)) {
  res.status(422).json({ error: "Config file not found on disk" });
  return;
}
```

**Problem:** Config files are stored in **Supabase Storage**, not on local disk. The route was using the wrong storage layer.

---

## Solution Applied

### Changes Made to `artifacts/api-server/src/routes/admin-orders.ts`

**1. Removed incorrect imports (lines 5-6)**
```typescript
// ❌ BEFORE
import path from "path";
import fs from "fs";

// ✅ AFTER
import { downloadConfigFile } from "../lib/storage";
```

**2. Removed UPLOADS_DIR constant (lines 9-10)**
```typescript
// ❌ BEFORE
const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

// ✅ AFTER (removed entirely)
```

**3. Fixed file validation (lines 90-95)**
```typescript
// ❌ BEFORE
const filePath = path.join(UPLOADS_DIR, server.filename);
if (!fs.existsSync(filePath)) {
  res.status(422).json({ error: "Config file not found on disk" });
  return;
}

// ✅ AFTER - Verify file exists in Supabase Storage
try {
  await downloadConfigFile(server.filename);
} catch (err) {
  req.log.error({ err, filename: server.filename }, "Config file not found in storage");
  res.status(422).json({ error: "Config file not found in storage" });
  return;
}
```

---

## How It Works Now

### Correct Flow for Admin Delivery

1. **Admin selects order** → Admin panel POSTs to `/api/admin/orders/{orderId}/fulfill`
2. **Backend fetches order** → Retrieves order record from database
3. **Backend finds config server** → Matches by network, appType, duration
4. **Backend verifies file in Supabase Storage** → Calls `downloadConfigFile(server.filename)`
5. **If file exists** → Updates order.status = "completed"
6. **Creates user_plans record** → Stores plan details with orderId reference
7. **Returns configUrl** → Client uses `/api/orders/{orderId}/download` to retrieve file

### Storage Abstraction Pattern
The `downloadConfigFile()` utility in `lib/storage.ts` handles both:
- **Supabase Storage** (production) - Downloads from cloud bucket
- **Local disk** (fallback) - Reads from `./uploads/` directory

By using this abstraction, the admin fulfillment route now works correctly regardless of storage backend.

---

## Related Code References

**Download Route (working pattern):**
- File: `artifacts/api-server/src/routes/orders.ts` (line 194)
- Uses: `await downloadConfigFile(server.filename)`
- This pattern is now replicated in admin fulfillment

**Storage Utility:**
- File: `artifacts/api-server/src/lib/storage.ts`
- Provides abstraction for Supabase Storage and local fallback
- `downloadConfigFile()` - Downloads config from storage (either Supabase or local disk)
- `uploadConfigFile()` - Uploads config to storage
- `deleteConfigFile()` - Removes config from storage

**Config Server Schema:**
- File: `lib/db/src/schema/config_servers.ts`
- Fields: `filename`, `fileUrl`, `originalName`
- `filename` - Internal identifier used for storage operations
- `fileUrl` - Public URL when using Supabase Storage

---

## Testing

To verify the fix works:

1. **Upload a config file** via admin panel → Saves to Supabase Storage
2. **Create/pending an order** → For the same network/appType/duration
3. **Click "Deliver Config"** button in admin panel
4. **Verify response** → Should return `{ success: true, configUrl: "/api/orders/..." }`
5. **Download config** → Navigate to returned configUrl to verify file downloads

If the config file doesn't exist in storage, you'll now see the correct error:
```
"Config file not found in storage"
```

Instead of the misleading "not found on disk" message.
