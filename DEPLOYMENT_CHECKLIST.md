# NETCO Platform - Deployment Checklist

## Pre-Deployment Tasks

### Database Setup
- [ ] Open Supabase Dashboard → SQL Editor
- [ ] Create new query
- [ ] Copy entire `/FINAL_SCHEMA.sql` file
- [ ] Paste into SQL Editor
- [ ] Click "Run"
- [ ] Verify "Success. No rows returned"
- [ ] Run verification query to confirm tables exist

### Code Verification
- [ ] Run `pnpm install` in project root
- [ ] Run `pnpm -r run build` to compile all packages
- [ ] Verify no critical errors in build output
- [ ] Check both `@workspace/netco` and `@workspace/api-server` built successfully

### Environment Configuration
- [ ] Set `VITE_SUPABASE_URL` in frontend .env
- [ ] Set `VITE_SUPABASE_ANON_KEY` in frontend .env
- [ ] Set `DATABASE_URL` in API server .env
- [ ] Verify all required env vars are present

## Deployment Steps

### 1. Deploy API Server
```bash
# From /artifacts/api-server
npm run build
# Deploy to your hosting (AWS Lambda, Vercel, Heroku, etc.)
```

- [ ] API server deployed
- [ ] Verify API is accessible at `/api/*` endpoints
- [ ] Test health endpoint: `GET /health`

### 2. Deploy Frontend Application
```bash
# From /artifacts/netco
npm run build
# Deploy dist folder to hosting
```

- [ ] Frontend deployed
- [ ] Verify app loads without 404 errors
- [ ] Check console for errors in browser DevTools

### 3. Verify Database Connection
- [ ] Test profile API endpoint
- [ ] Create a test account and profile
- [ ] Update profile with test data
- [ ] Verify data persists in Supabase

## Post-Deployment Testing

### User Flows
- [ ] Sign up new user → Profile auto-creates
- [ ] Navigate to `/account` → Page loads, displays profile data
- [ ] Update profile fields → Save successfully
- [ ] Navigate to `/plans` → Display VPN plans
- [ ] Navigate to `/notifications` → Load notification list
- [ ] Navigate to `/dashboard` → Show active plans

### Admin Flows  
- [ ] Navigate to `/admin` → Admin dashboard loads
- [ ] View Orders section → Display orders
- [ ] View Users section → Display users
- [ ] View Analytics section → Show stats and charts
- [ ] Verify admin navbar separate from user navbar

### Data & Security
- [ ] Check browser storage for auth token
- [ ] Verify API calls include authentication
- [ ] Test RLS by accessing another user's data (should fail)
- [ ] Verify service role can access all data
- [ ] Check password is never logged or exposed

### Performance
- [ ] Page load time < 3 seconds
- [ ] API responses < 500ms
- [ ] No 404 errors in browser console
- [ ] Images and assets load properly

## Monitoring & Maintenance

### Weekly
- [ ] Check Supabase logs for errors
- [ ] Monitor API response times
- [ ] Review user feedback
- [ ] Backup database (if not auto-configured)

### Monthly
- [ ] Review RLS policies effectiveness
- [ ] Check unused indexes and optimize
- [ ] Update dependencies (npm/pnpm)
- [ ] Test disaster recovery plan

### Quarterly
- [ ] Perform security audit
- [ ] Review and optimize slow queries
- [ ] Update SSL certificates (if needed)
- [ ] Plan feature improvements

## Troubleshooting Guide

### If you see 404 errors on `/account`:
1. Verify `user_profiles` table exists: `SELECT COUNT(*) FROM user_profiles;`
2. Check auth-profile API route is running
3. Verify `id` column is UUID type: `\d user_profiles`
4. Test API directly: `curl http://localhost:3000/api/auth-profile/{userId}`

### If profile won't save:
1. Check `DATABASE_URL` is correct
2. Verify RLS policies allow updates: `SELECT * FROM pg_policies WHERE tablename='user_profiles';`
3. Ensure user is authenticated before saving
4. Check API logs for specific error message

### If admin pages show 404:
1. Verify all admin routes are registered in `/admin.tsx`
2. Check admin layout component is applied
3. Verify user has admin role/permissions
4. Test routes directly: `/admin/orders`, `/admin/users`, etc.

### If notifications don't appear:
1. Verify `notifications` table has records
2. Check real-time subscription is active
3. Test notifications API: `GET /api/notifications/{userId}`
4. Review Supabase logs for sync issues

## Success Criteria

✅ All users can create accounts and access `/account` page
✅ Profile data persists and updates correctly
✅ Admin can access `/admin/*` pages without errors
✅ Notifications appear in real-time
✅ Plans page displays correctly
✅ No 404 errors on any user-facing page
✅ API responses under 500ms
✅ Data is properly secured with RLS
✅ All features work on desktop and mobile

## Rollback Plan

If deployment fails:
1. Revert code to previous commit
2. Restore database from backup
3. Redeploy previous version
4. Investigate logs for root cause
5. Fix issues locally and test thoroughly
6. Prepare new deployment

## Support Contacts

- Database Issues: Supabase Documentation (supabase.com/docs)
- API Issues: Check Express.js docs and API logs
- Frontend Issues: Check React/Vite docs and browser console
- Deployment Issues: Check hosting platform documentation

---

**Last Updated**: June 2026
**Status**: All fixes applied, ready for deployment
**Next Review**: After first production deployment
