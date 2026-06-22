# Config Fulfillment Fix - Verification Steps

## Pre-Deployment Checks

### 1. Verify Schema Changes
```bash
# Check that schema file includes configServerId
grep -n "configServerId" lib/db/src/schema/orders.ts
# Should show: configServerId: text("config_server_id").references...
```

### 2. Verify Migration File
```bash
# Check migration exists
ls -la lib/db/migrations/0008_add_config_server_id_to_orders.sql
# Should exist and contain ADD COLUMN and ALTER TABLE statements
```

### 3. Verify API Changes
```bash
# Check admin-orders.ts includes configServerId in update
grep -A 3 "status: \"completed\"" artifacts/api-server/src/routes/admin-orders.ts
# Should show: configServerId: server.id

# Check orders.ts has direct lookup
grep -A 10 "order.configServerId" artifacts/api-server/src/routes/orders.ts
# Should show: eq(configServersTable.id, order.configServerId)
```

---

## Post-Deployment Verification

### Step 1: Database Migration Check
```sql
-- Connect to your database and run:

-- Check if column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name='orders' AND column_name='config_server_id';

-- Expected output: config_server_id

-- Check for NULL values (existing orders won't have this set)
SELECT COUNT(*) as null_count 
FROM orders 
WHERE config_server_id IS NULL;

-- Check for populated values (new fulfilled orders)
SELECT COUNT(*) as populated_count 
FROM orders 
WHERE config_server_id IS NOT NULL;
```

### Step 2: Admin Fulfillment Test
```
1. Open admin dashboard
2. Find a pending order (status = "pending")
3. Click "Fulfill" button
4. Select a config server from dropdown
5. Enter instructions (optional)
6. Click "Deliver Config"
7. Check response:
   - Should show "Order fulfilled!" notification
   - Order status should change to "completed"
```

### Step 3: Database Verification After Fulfillment
```sql
-- Find the recently fulfilled order
SELECT 
  id,
  status,
  config_url,
  config_server_id
FROM orders
WHERE status = 'completed'
ORDER BY created_at DESC
LIMIT 1;

-- Expected output:
-- id              | status    | config_url                              | config_server_id
-- 123e4567-e89b-  | completed | https://api../api/orders/123e4567.../  | 789a1234-56cd-...
--   12d3-a456-...  |           | download                                 | ef01-2345678...
```

### Step 4: Download Test
```
1. Go to user dashboard or order-status page
2. Find the fulfilled order
3. Click "Download Config" button
4. Check in browser:
   - File should download immediately
   - Filename should be NETWORK(PLAN).hc or .ehi
   - NOT index.html or any error JSON

5. Open downloaded file in hex editor:
   - Should contain binary data (not JSON error)
   - First bytes should be appropriate for config format
```

### Step 5: HTTP Headers Check
```bash
# Using curl to check response headers
curl -I https://netco.onrender.com/api/orders/{ORDER_ID}/download

# Expected headers:
# HTTP/1.1 200 OK
# Content-Type: application/octet-stream
# Content-Disposition: attachment; filename="AIRTEL(SUPER).hc"
# Content-Length: 12345
```

### Step 6: API Logs Check
```
Open Render console → Logs tab

Look for entries like:
✓ "Config file downloaded successfully"
✓ "Order fulfilled successfully"
✗ NO "Config server not found" errors
✗ NO "Config file not found in storage" errors
```

### Step 7: Supabase Storage Verification
```
1. Open Supabase dashboard
2. Go to Storage → vpn-configs bucket
3. Verify files exist for:
   - Free config servers (isFree = true)
   - Admin-uploaded servers
4. File naming should be: {UUID}.{ext} (e.g., 789a1234-56cd-ef01-2345.hc)
```

### Step 8: Legacy Free Configs Test
```
1. Create a new free order (no payment required)
2. Order should complete automatically
3. Download from dashboard
4. Verify file downloads (uses fallback logic)
5. Logs should show: "Using fallback: legacy free config lookup"
```

---

## Common Issues & Solutions

### Issue: Column doesn't exist in database
```
Error: column "config_server_id" does not exist
```
**Solution:**
- Migration hasn't run yet
- Check Render deploy logs for migration status
- If stuck: Manually run migration or redeploy

### Issue: Admin fulfillment returns error
```
Error: "Config file not found in storage"
```
**Solutions:**
1. Verify config server has file uploaded to Supabase
2. Check filename is correct in config_servers table
3. Verify Supabase credentials in Render env vars

### Issue: Downloads still fail with "Config server not found"
**Checks:**
1. Is configServerId being stored? Run SQL query above
2. Does config server exist? SELECT * FROM config_servers WHERE id = '...';
3. Are API changes deployed? Restart Render service

### Issue: Old orders break
**Expected behavior:** Should still work (fallback logic)
**If not working:**
1. Check that isFree = true for free config servers
2. Verify fallback includes isFree = true condition
3. Check logs for fallback lookup attempt

---

## Performance Verification

### Query Performance
```sql
-- Check that index exists
SELECT * FROM pg_indexes 
WHERE tablename = 'orders' AND indexname LIKE '%config_server_id%';

-- Expected: idx_orders_config_server_id

-- Test query performance
EXPLAIN ANALYZE
SELECT * FROM orders 
WHERE config_server_id = '789a1234-56cd-ef01-2345678...';

-- Expected: Should use index, execution time < 1ms
```

### API Response Time
```bash
# Time a download request
time curl -I https://netco.onrender.com/api/orders/{ORDER_ID}/download

# Expected: < 500ms response time
```

---

## Rollback Verification

If you need to rollback:

```bash
# Check current schema
git log --oneline lib/db/migrations/

# Rollback migration (Neon/database specific)
# For Neon: Use Neon dashboard to revert migration
# For PostgreSQL: DELETE FROM migrations WHERE name = '0008_...';

# Revert code changes
git revert HEAD
git push
```

---

## Final Checklist

- [ ] Schema change verified (config_server_id column exists)
- [ ] Migration file exists (0008_add_config_server_id_to_orders.sql)
- [ ] Admin-orders.ts stores configServerId
- [ ] Orders.ts uses configServerId for lookup
- [ ] Render deployment completed
- [ ] Database migration executed
- [ ] New order fulfillment test passed
- [ ] Download test passed
- [ ] HTTP headers correct
- [ ] Legacy free configs still work
- [ ] No errors in Render logs
- [ ] Performance acceptable
- [ ] Team notified of changes

---

## Success Indicators

✅ All tests pass when you see:
- Config files download as .hc/.ehi (not HTML)
- Content-Type: application/octet-stream
- configServerId populated in database for new orders
- No "Config server not found" errors in logs
- Old orders still work via fallback

---

## Support

If verification fails:
1. Check Render logs for deployment errors
2. Verify database migration status
3. Confirm API changes are deployed
4. Review audit documents in project root
