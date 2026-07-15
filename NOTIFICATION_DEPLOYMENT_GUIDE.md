# Notification Duplicate Fix - Deployment Guide

## Pre-Deployment Checklist

- [ ] Review NOTIFICATION_DUPLICATE_FIX.md for full context
- [ ] Backup production database
- [ ] Test migration script locally
- [ ] Test on staging environment first

## Deployment Steps

### Step 1: Database Migration (CRITICAL - Do First)

Run this SQL script against your Supabase/PostgreSQL database:

```sql
-- Create plan_notification_tracking table
CREATE TABLE IF NOT EXISTS public.plan_notification_tracking (
  id text PRIMARY KEY,
  plan_id text NOT NULL REFERENCES public.user_plans(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  trigger text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expiry_date_snapshot timestamp with time zone NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS plan_notification_tracking_plan_id_trigger_idx 
  ON public.plan_notification_tracking(plan_id, trigger);

CREATE INDEX IF NOT EXISTS plan_notification_tracking_user_id_idx 
  ON public.plan_notification_tracking(user_id);

CREATE INDEX IF NOT EXISTS plan_notification_tracking_created_at_idx 
  ON public.plan_notification_tracking(created_at);
```

**Estimated time**: < 1 minute
**Impact**: None (new table, no existing data affected)
**Rollback**: `DROP TABLE public.plan_notification_tracking;`

### Step 2: Deploy Backend

Deploy the updated API server code to Render:

```bash
# Files changed:
# - lib/db/src/schema/plan_notification_tracking.ts (NEW)
# - lib/db/src/schema/index.ts (MODIFIED)
# - artifacts/api-server/src/lib/plan-notifications.ts (MODIFIED)
# - artifacts/api-server/src/routes/notifications.ts (MODIFIED)

git push origin v0/kifumbum-6780-983ddb07
# Render will auto-deploy when you push to main
```

**Verification**: Check Render logs for successful deployment

### Step 3: Deploy Frontend

Deploy the frontend to Vercel:

```bash
# No code changes in frontend, but rebuild to ensure consistency
# Vercel will auto-deploy on git push
git push origin v0/kifumbum-6780-983ddb07
```

### Step 4: Verify Deployment

After deployment, verify the fix is working:

#### Test 1: Check Endpoint Responds
```bash
curl -X POST https://your-api.render.com/api/notifications/check-plan-expiry \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected response:
# {
#   "success": true,
#   "createdCount": 0,  # Or number of new notifications
#   "checkedCount": 5,  # Number of plans checked
#   "skippedCount": 5,  # Number skipped (duplicates)
#   "timestamp": "2025-07-16T12:34:56.789Z"
# }
```

#### Test 2: Verify No Duplicates
1. Create a test plan expiring in < 1 hour
2. Load My Plans page → See 1 notification
3. Refresh page → Should still be 1 notification (no duplicate)
4. Call endpoint again → Response should show skippedCount > 0
5. Query database:
```sql
SELECT COUNT(*) FROM notifications 
WHERE title LIKE '%Urgent%' AND user_id = 'test_user_id';
-- Should be 1, not 2+
```

#### Test 3: Verify Tracking Table
```sql
SELECT * FROM plan_notification_tracking WHERE user_id = 'test_user_id';
-- Should show 1 row with trigger='1_hour'
```

## Rollback Procedure (If Issues)

If problems occur after deployment:

### Immediate Rollback (< 5 minutes)

```bash
# 1. Revert code changes
git revert HEAD  # Or checkout previous version
git push origin main

# 2. Verify in production
# Old code will work normally without deduplication
```

**Note**: The tracking table will remain (safe to leave).

### Complete Rollback (If table has issues)

```sql
-- Delete tracking data
DELETE FROM plan_notification_tracking;

-- Then proceed with code revert above
```

## Monitoring Post-Deployment

### Metrics to Monitor (First 24 Hours)

1. **API Response Times**
   - `/api/notifications/check-plan-expiry` should take < 1 second

2. **Notification Database Growth**
   ```sql
   -- Should stabilize, not keep growing
   SELECT DATE(created_at), COUNT(*) FROM notifications 
   GROUP BY DATE(created_at) 
   ORDER BY DATE DESC LIMIT 7;
   ```

3. **User Complaints**
   - Monitor support channel for duplicate notification reports
   - Should drop to zero

4. **Tracking Table Size**
   ```sql
   SELECT COUNT(*) FROM plan_notification_tracking;
   -- Should grow to ~1 per plan per trigger type, then stabilize
   ```

### Query for Monitoring

Monitor deduplication effectiveness:

```sql
-- See how many notifications are being skipped
SELECT 
  DATE(created_at),
  COUNT(*) as notifications_created
FROM plan_notification_tracking
GROUP BY DATE(created_at)
ORDER BY DATE DESC;

-- Verify no duplicates
SELECT 
  plan_id,
  trigger,
  COUNT(*) as count
FROM plan_notification_tracking
GROUP BY plan_id, trigger
HAVING COUNT(*) > 1;
-- Should return 0 rows
```

## Verification Success Criteria

✅ All criteria must be met:

- [ ] Database migration completes successfully
- [ ] Backend deploys without errors
- [ ] Frontend deploys without errors
- [ ] Test plan shows 1 notification (not duplicates)
- [ ] Refresh page doesn't create duplicate
- [ ] `/check-plan-expiry` returns skippedCount > 0
- [ ] No user complaints about duplicates
- [ ] No errors in API logs
- [ ] Tracking table contains expected data

## Support

If issues occur during deployment:

1. Check logs: Render (backend), Vercel (frontend)
2. Verify migration ran: Query `plan_notification_tracking` table
3. Test JWT authentication on `/check-plan-expiry` endpoint
4. Review NOTIFICATION_DUPLICATE_FIX.md for details

## Timeline

| Task | Estimated Time |
|------|-----------------|
| Database migration | 1 min |
| Backend deployment | 2-3 min |
| Frontend deployment | 1-2 min |
| Verification testing | 10-15 min |
| **Total** | **15-20 min** |

---

**Deployment Prepared**: July 16, 2025
**Status**: Ready for production deployment
