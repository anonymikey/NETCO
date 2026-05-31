# Render Deployment Quick Setup (5-Minute Checklist)

## Before You Start
Have ready:
- [ ] Your Supabase project open
- [ ] Render account logged in
- [ ] GitHub repo access

---

## Step 1: Get Supabase Connection String (2 min)

1. Go to **supabase.com** → Your NETCO project
2. Click **Settings** (⚙️) → **Database**
3. Find **Connection Pooling** section
4. Make sure **"Transaction Pooler"** is selected
5. Copy the **URI** connection string:
   ```
   postgresql://postgres.[ID]:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
   ```

**Save this value** — you'll need it in Step 3.

---

## Step 2: Create Render Service (1 min)

1. Go to **dashboard.render.com**
2. Click **New +** → **Web Service**
3. Connect GitHub → Select `anonymikey/NETCO`
4. Fill in:
   - **Name:** `netco-api`
   - **Branch:** `v0/anonymiketech-5854-0c36b803` (or `main`)
   - **Root Directory:** Leave empty
   - **Runtime:** Node
   - **Build Command:** 
     ```
     cd artifacts/api-server && pnpm install && pnpm run build
     ```
   - **Start Command:**
     ```
     node --enable-source-maps ./artifacts/api-server/dist/index.mjs
     ```
5. **Plan:** Free (or Starter+ for production)
6. Click **Create Web Service**

---

## Step 3: Add Environment Variables (1 min)

After the service is created, go to **Settings** → **Environment**

Add these variables:

### Critical (Must have):
```
POSTGRES_URL = [PASTE THE CONNECTION STRING FROM STEP 1]
NODE_ENV = production
```

### Recommended (for storage):
```
SUPABASE_URL = https://[YOUR_PROJECT_ID].supabase.co
SUPABASE_SERVICE_ROLE_KEY = [Get from Supabase → Settings → API → Service Role Key]
```

### Optional (for emails & payments):
```
RESEND_API_KEY = [Get from Resend dashboard]
PAYFLOW_API_KEY = [Get from PayFlow]
PAYFLOW_API_SECRET = [Get from PayFlow]
PAYFLOW_ACCOUNT_ID = [Your PayFlow account ID]
```

Click **Save** for each variable.

---

## Step 4: Wait & Verify (1-2 min)

1. Render will automatically start building
2. Watch the **Logs** tab
3. You should see:
   ```
   ✓ Build completed
   ✓ Server listening on port 10000
   ```

---

## Step 5: Test Your Server

Once deployed, your API is live at:
```
https://netco-api.onrender.com
```

Test with:
```bash
curl https://netco-api.onrender.com/api/health
```

Or open in browser:
```
https://netco-api.onrender.com/api/admin/servers
```

---

## ⚠️ If Something Goes Wrong

### Build Fails
Check the **Logs** tab for errors. Most common:
- **"POSTGRES_URL is missing"** → Add it to Environment variables
- **"Module not found"** → Might be a monorepo issue; try again (it's usually temporary)

### Server Won't Start
- **"PORT environment variable is required"** → Render should provide this automatically. Try restarting the service.
- **Database connection error** → Check your `POSTGRES_URL` in Environment. Make sure it includes `?sslmode=require` at the end.

### Database Connection Fails
- Copy the exact connection string from Supabase (including `?sslmode=require`)
- Use **Transaction Pooler**, not Direct connection
- Add to Render as `POSTGRES_URL` (not `DATABASE_URL`)

---

## 🎉 You're Done!

Your NETCO API server is now deployed on Render!

**Service URL:** `https://netco-api.onrender.com`

### Next Steps:
1. Update your frontend to point to the new API URL
2. Monitor the Render dashboard for errors
3. If using free tier, expect 15-minute spin-downs; upgrade to Starter+ for always-on

---

## Quick Reference

| Component | Value |
|-----------|-------|
| **Service Name** | netco-api |
| **Framework** | Node.js + Express |
| **Database** | Supabase PostgreSQL |
| **Storage** | Supabase Storage (or local disk) |
| **Port** | 10000 (automatic) |
| **Node Version** | 20.x LTS |
| **Build Time** | ~15-30 seconds |
| **Cold Start** | ~2-5 seconds |

---

**Questions?** Check `RENDER_DEPLOYMENT_GUIDE.md` for detailed explanations.
