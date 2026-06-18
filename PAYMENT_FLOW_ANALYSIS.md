# Payment Completion Flow Analysis

## Overview
Complete trace of the PayFlow payment callback/webhook to order fulfillment and user_plans creation.

---

## 1. Endpoint That Receives PayFlow Callbacks

**File:** `artifacts/api-server/src/routes/payment.ts`

**Primary Flow:**
1. **Initiate Payment:** `POST /api/payment/initiate`
   - Takes `phone`, `amount`, `orderId`
   - Sends STK push to PayFlow API
   - Returns `reference` and `checkoutRequestId`

2. **Status Check:** `POST /api/payment/status/:reference` (POLLING)
   - Client polls this endpoint to check payment status
   - This endpoint **receives the status from PayFlow** via query
   - It then updates orders and creates user_plans

---

## 2. Route Mounting Verification

**File:** `artifacts/api-server/src/routes/index.ts` (line 20)
```typescript
router.use("/payment", paymentRouter);
```

**File:** `artifacts/api-server/src/app.ts` (verified earlier)
```typescript
app.use("/api", router);
```

✅ **Correct:** Payment endpoint is mounted at `/api/payment` as expected.

---

## 3. Callback URL Sent to PayFlow

**File:** `artifacts/api-server/src/routes/payment.ts` (line 195)

In the STK push request to PayFlow:
```typescript
const body = {
  payment_account_id: PAYFLOW_ACCOUNT_ID,
  phone: phoneFormatted,
  amount: Number(amount),
  reference,
  description: `NETCO VPN Config — Order ${orderId}`,
};
```

**Note:** The `body` sent to PayFlow does NOT include a callback URL. This is the standard PayFlow STK push flow - PayFlow handles the M-Pesa interaction server-to-server, and the client polls `/api/payment/status/:reference` for results.

**Status Check Endpoint:** `POST /api/payment/status/:reference`
- Client polls this endpoint after payment initiation
- PayFlow status is checked server-side with API credentials
- No webhook needed - polling model instead

---

## 4. Successful Callbacks Update Order Status

**File:** `artifacts/api-server/src/routes/payment.ts` (lines 230-280)

When `/api/payment/status/:reference` is called:

1. **Check Payment Status with PayFlow:**
   ```typescript
   const pfRes = await fetch(`${PAYFLOW_BASE}/status.php`, {
     method: "POST",
     headers: payflowHeaders(),
     body: JSON.stringify({ checkout_request_id: reference }),
   });
   ```

2. **If Status = "completed":**
   ```typescript
   if (mappedStatus === "completed") {
     const [order] = await db
       .select()
       .from(ordersTable)
       .where(eq(ordersTable.paymentReference, reference))
       .limit(1);

     if (order) {
       if (order.status !== "completed") {
         await autoFulfillOrder(order.id, req.log as MinimalLogger);
       }
   ```

3. **autoFulfillOrder Function (lines 54-115):**
   ```typescript
   async function autoFulfillOrder(orderId: string, logger: MinimalLogger) {
     // ... fetch config server ...
     
     await db.update(ordersTable)
       .set({ status: "completed", configUrl })
       .where(eq(ordersTable.id, orderId));
   ```

✅ **Verified:** `orders.status` is updated to `'completed'`

---

## 5. Successful Callbacks Create user_plans Record

**File:** `artifacts/api-server/src/routes/payment.ts` (lines 90-115)

Inside `autoFulfillOrder()`:

```typescript
const existing = await db.select().from(userPlansTable)
  .where(eq(userPlansTable.orderId, orderId))
  .limit(1);

if (existing.length === 0) {
  await db.insert(userPlansTable).values({
    id: randomUUID(),
    orderId,
    network: order.network,
    planName: server.serverName,
    planType: server.planType,
    duration: order.duration,
    appType: order.appType,
    deviceId: order.deviceId,
    phone: order.phone,
    expiryDate: expiryFromDuration(order.duration),
    status: "active",
    configUrl,
    fileExtension: ext,
  });
}
```

✅ **Verified:** `user_plans` record is created with all required fields.

---

## 6. Why Order `5106faf9-886d-4551-adca-4ab15e012afd` Remains Pending

**Potential Root Causes:**

1. **Payment Not Actually Completed**
   - User initiated payment but never completed M-Pesa transaction
   - Status poll returned `status !== "completed"`

2. **Missing Config Server**
   - Order's combination (network, app_type, duration) has no active server
   - `autoFulfillOrder()` would exit early: `if (!server) return;`
   - Order stays pending, no user_plans created

3. **Config File Missing in Storage**
   - Server exists but config file missing in Supabase Storage
   - `autoFulfillOrder()` catches and exits: `if (!storageFile) return;`
   - Order stays pending

4. **PayFlow Status Never Polled**
   - Client initiated payment but never called `/api/payment/status/:reference`
   - No backend process to check and complete the order
   - Order remains in pending status indefinitely

5. **Database Transaction Failed Silently**
   - Status was completed but update query failed
   - Rare but possible if database connection drops

---

## Recommended Investigation Steps

1. **Check PayFlow Dashboard:**
   - Verify if payment was actually completed on PayFlow side
   - Look for reference starting with "NETCO-"

2. **Query Database:**
   ```sql
   SELECT * FROM orders WHERE id = '5106faf9-886d-4551-adca-4ab15e012afd';
   -- Check: status, paymentReference, configUrl
   
   SELECT * FROM user_plans WHERE order_id = '5106faf9-886d-4551-adca-4ab15e012afd';
   -- Should have created a record if completed
   ```

3. **Check Server Status:**
   ```sql
   SELECT * FROM config_servers 
   WHERE status = 'active' 
   AND network = (SELECT network FROM orders WHERE id = '5106faf9-886d-4551-adca-4ab15e012afd')
   AND app_type = (SELECT app_type FROM orders WHERE id = '5106faf9-886d-4551-adca-4ab15e012afd')
   AND duration = (SELECT duration FROM orders WHERE id = '5106faf9-886d-4551-adca-4ab15e012afd');
   -- Verify config server exists for the order combination
   ```

4. **Check Logs:**
   - Look for API logs for `/api/payment/status` calls with the order ID
   - Check if auto-fulfill was attempted and what happened

5. **Verify Storage:**
   - Check if config file exists in Supabase Storage bucket

---

## Summary

| Component | Status | Details |
|-----------|--------|---------|
| Endpoint | ✅ Correct | Mounted at `/api/payment` |
| Callback Model | ✅ Polling | Client polls `/api/payment/status/:reference` |
| Order Status Update | ✅ Implemented | Updates to 'completed' on successful payment |
| user_plans Creation | ✅ Implemented | Created in `autoFulfillOrder()` with all fields |
| Pending Order Cause | ❓ Unknown | Requires database/log investigation |

The payment flow is correctly implemented. The pending order needs investigation at the PayFlow, database, and config server level.
