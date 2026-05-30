# Render Deployment Checklist for NETCO API Server

## Pre-Deployment Verification

### API Server Configuration
- [x] Build command correct: `pnpm install && pnpm run build`
- [x] Start command correct: `node --enable-source-maps ./dist/index.mjs`
- [x] Listens on process.env.PORT: YES
- [x] Node version compatible: 20.x+
- [x] No code modifications needed: YES
- [x] All dependencies in package.json: YES
- [x] ESM format in use: YES

### Database Ready
- [ ] PostgreSQL database created (Supabase/Neon)
- [ ] Database URL ready: `POSTGRES_URL` or `SUPABASE_DATABASE_URL`
- [ ] Database allows external connections
- [ ] SSL enabled in connection string
- [ ] Migrations run (Drizzle auto-manages)

### Credentials Gathered
- [ ] SUPABASE_URL: `https://xxx.supabase.co`
- [ ] SUPABASE_SERVICE_ROLE_KEY: `eyJxxxxx...`
- [ ] RESEND_API_KEY: `re_xxx...`
- [ ] PAYFLOW_API_KEY: Obtained
- [ ] PAYFLOW_API_SECRET: Obtained
- [ ] PAYFLOW_ACCOUNT_ID: Obtained
- [ ] POSTGRES_URL: `postgresql://user:pass@host/db`

### GitHub Repository
- [ ] Repository connected to Render
- [ ] Main branch stable and tested
- [ ] Latest changes pushed to GitHub

---

## Render Deployment Steps

### 1. Create Web Service
- [ ] Go to https://render.com/dashboard
- [ ] Click "New Web Service"
- [ ] Connect GitHub repository
- [ ] Select **netco** repo
- [ ] Authorization granted

### 2. Configure Service
- [ ] Service Name: `netco-api`
- [ ] Environment: `Node`
- [ ] Root Directory: `artifacts/api-server`
- [ ] Build Command: `pnpm install && pnpm run build`
- [ ] Start Command: `node --enable-source-maps ./dist/index.mjs`
- [ ] Plan: **Starter** ($7/month)

### 3. Add Environment Variables
Copy and paste into Render environment:

```
PORT=5000
NODE_ENV=production
LOG_LEVEL=info
POSTGRES_URL=your_database_url
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
RESEND_API_KEY=your_resend_key
PAYFLOW_API_KEY=your_payflow_key
PAYFLOW_API_SECRET=your_payflow_secret
PAYFLOW_ACCOUNT_ID=your_account_id
VITE_PUBLIC_URL=https://netcom.anonymiketech.online
VITE_SUPABASE_URL=your_supabase_url
```

### 4. Deploy
- [ ] Click "Create Web Service"
- [ ] Wait for build (3-5 minutes first time)
- [ ] Check build logs for errors
- [ ] Deployment complete when status shows "Live"

### 5. Get API URL
- [ ] Go to service dashboard
- [ ] Copy the Render URL: `https://netco-api.onrender.com`
- [ ] Save this URL

---

## Post-Deployment Testing

### Verify API is Running
- [ ] `curl https://netco-api.onrender.com/api/stats` returns 200
- [ ] Check service logs for "Server listening on port 5000"
- [ ] No database connection errors in logs
- [ ] No startup errors in logs

### Test Key Endpoints
- [ ] GET `/api/stats` returns statistics
- [ ] GET `/api/packages` returns packages list
- [ ] POST `/api/servers` accepts file upload (after auth)
- [ ] GET `/api/admin/stats` requires admin auth

---

## Update Frontend (Vercel)

### Add API Backend URL
1. Go to https://vercel.com/dashboard
2. Select `netco-platform` project
3. Settings → Environment Variables
4. Add/Update:
   - Key: `VITE_API_BACKEND_URL`
   - Value: `https://netco-api.onrender.com`
5. Select "All Environments"
6. Save

### Redeploy Frontend
- [ ] Go to Deployments tab
- [ ] Click "Redeploy" on latest
- [ ] Wait for build (1-2 minutes)
- [ ] Visit https://netcom.anonymiketech.online
- [ ] Test file upload in admin panel

---

## Final Verification

### Test Full Flow
- [ ] Login works: ✓
- [ ] Upload config file: ✓
- [ ] File appears in Supabase Storage: ✓
- [ ] Create order: ✓
- [ ] Payment modal shows: ✓
- [ ] No console errors: ✓
- [ ] No 405 errors: ✓

### Monitor Performance
- [ ] Check Render dashboard for:
  - Response times < 200ms
  - CPU usage < 30%
  - Memory usage < 100MB
  - No restart loops
- [ ] Check Vercel frontend logs
- [ ] Check Supabase query performance

---

## Troubleshooting

### If deployment fails:
1. Check build logs: "Logs" → "Build Output"
2. Common issues:
   - `pnpm not found`: Add `"packageManager": "pnpm@9"` to root package.json
   - `PORT not set`: Verify it's in environment variables
   - `Database connection error`: Check POSTGRES_URL format

### If API doesn't respond:
1. Check service is "Live" in Render dashboard
2. Check environment variables are set correctly
3. Check database is accessible from Render IP
4. Look for errors in service logs

### If frontend can't reach API:
1. Verify VITE_API_BACKEND_URL is set in Vercel
2. Verify it matches Render URL exactly
3. Check browser console for CORS errors
4. Test API directly: `curl https://netco-api.onrender.com/api/stats`

---

## Keep Running

### Monitor Logs Daily
- Render dashboard → netco-api → Logs
- Look for errors or warnings
- Check response times

### Set Up Error Alerts
- Render sends email if service crashes
- Subscribe to deployment notifications

### Scaling (if needed later)
- Upgrade from Starter to Standard plan
- Render auto-scales within plan
- No code changes needed

---

## Reference

- Render Docs: https://render.com/docs
- Node.js ESM Guide: https://nodejs.org/api/esm.html
- Drizzle ORM: https://orm.drizzle.team
- Supabase: https://supabase.com/docs
- Resend Email: https://resend.com/docs

---

**Estimated Deployment Time**: 15-20 minutes total
**Success Criteria**: Full app working without 405 errors
