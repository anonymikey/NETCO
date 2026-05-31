# Render Deployment Guide for NETCO API Server

## Quick Summary

| Item | Value |
|------|-------|
| **Build Command** | `cd artifacts/api-server && pnpm install && pnpm run build` |
| **Start Command** | `node --enable-source-maps ./artifacts/api-server/dist/index.mjs` |
| **Node Version** | 18+ (recommended 20.x LTS) |
| **Port** | `process.env.PORT` (Render provides 10000 by default) |
| **Framework** | Express.js (ES Modules) |

---

## 1. Package.json Start Script

```json
{
  "scripts": {
    "dev": "export NODE_ENV=development && pnpm run build && pnpm run start",
    "build": "node ./build.mjs",
    "start": "node --enable-source-maps ./dist/index.mjs",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  }
}
```

**Key Details:**
- Build script uses **esbuild** via `build.mjs` (not `tsc`)
- Start script runs the compiled ESM bundle with source maps enabled
- The build step bundles dependencies and creates tree-shaken output

---

## 2. Node Version Requirements

- **Minimum**: Node 18 LTS
- **Recommended**: Node 20.x LTS or later
- **TypeScript Target**: ES2020 (inferred from esbuild config)
- **Module Format**: ES Modules (ESM) — no CommonJS

**On Render:**
- Render auto-detects Node version from `.nvmrc` (missing) or Render default (20.x)
- If you need a specific version, create a `.nvmrc` file in the project root with `20.11.0` or your preferred version

---

## 3. Environment Variables Required

### Critical (must be set):
1. **`POSTGRES_URL`** ⭐ REQUIRED
   - Format: `postgresql://user:password@host:port/database?sslmode=require`
   - Source: Supabase → Settings → Database → Connection Pooling
   - Use **Transaction Pooler** (already selected on Supabase)
   - Example: `postgresql://postgres.xxx:[password]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require`

2. **`PORT`**
   - Provided by Render automatically (usually `10000`)
   - Required by server; will error if not set
   - **No action needed** — Render sets this automatically

3. **`NODE_ENV`**
   - Set to: `production`
   - Disables pretty-print logging, uses Pino JSON format
   - **Recommended** for Render production deployments

### Optional (feature-specific):

4. **`SUPABASE_URL`** (for storage operations)
   - Source: Supabase → Settings → API → URL
   - Example: `https://xxxxxxxxxxxx.supabase.co`
   - If not set: Falls back to local disk storage at `./uploads/`

5. **`SUPABASE_SERVICE_ROLE_KEY`** (for storage operations)
   - Source: Supabase → Settings → API → Service Role Key
   - Never expose in frontend code
   - If not set: Falls back to local disk storage

6. **`PAYFLOW_API_KEY`** (for M-Pesa payments)
   - Source: PayFlow merchant dashboard
   - Required if payment endpoints are used

7. **`PAYFLOW_API_SECRET`** (for M-Pesa payments)
   - Source: PayFlow merchant dashboard
   - Required if payment endpoints are used

8. **`PAYFLOW_ACCOUNT_ID`** (for M-Pesa payments)
   - Source: PayFlow merchant account
   - Must be a valid number (e.g., `123456`)
   - Required if payment endpoints are used

9. **`RESEND_API_KEY`** (for email sending)
   - Source: Resend → Dashboard → API Keys
   - Required for: email confirmations, password resets, announcements
   - If not set: Email endpoints will throw an error

10. **`VITE_PUBLIC_URL`** (for email links)
    - Format: Your application URL (e.g., `https://yourapp.vercel.app`)
    - Used in email templates for "Browse Plans" and similar CTAs
    - Optional; defaults to example placeholder if not set

11. **`LOG_LEVEL`** (for logging)
    - Values: `debug`, `info`, `warn`, `error`
    - Default: `info`
    - Optional; controls Pino logger verbosity

---

## 4. Database Connection Requirements

### Connection Method: **Transaction Pooler**

The API server uses **Supabase with the Transaction Pooler** connection method:

```
Host: aws-1-us-east-1.pooler.supabase.com
Port: 6543
SSL Mode: require (mandatory)
Connection Timeout: Suitable for serverless/Render free tier (auto-spins down)
```

**Why Transaction Pooler?**
- Optimal for Render's execution model (brief, isolated requests)
- Auto-handles connection pooling
- No timeout issues with Render's free tier spin-down behavior

**Setup Instructions:**
1. Go to **supabase.com** → Select your NETCO project
2. Click **Settings → Database**
3. Find **Connection Pooling** section
4. Select **"Transaction Pooler"** (should already be selected)
5. Under **Connection String**, copy the full URI:
   ```
   postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
   ```

**Database Schema:**
The server expects these tables from `@workspace/db`:
- `orders` — Payment orders
- `configServers` — Available VPN config servers
- `userPlans` — User VPN subscriptions
- `vpnConfigs` — VPN configuration database (on Supabase)

---

## 5. Build Command

```bash
cd artifacts/api-server && pnpm install && pnpm run build
```

**What happens:**
1. Install dependencies from `artifacts/api-server/package.json`
2. Run `build.mjs` which uses esbuild to:
   - Bundle TypeScript + JavaScript
   - Tree-shake unused code
   - Output ESM format to `dist/index.mjs` and `dist/serverless.mjs`
   - Generate source maps for debugging
   - External native modules (e.g., pg-native, sharp) are NOT bundled

**Build Output:**
- `dist/index.mjs` — Main Node.js server (used by Render)
- `dist/serverless.mjs` — Serverless handler (for Vercel Functions)
- `dist/*.mjs.map` — Source maps for stack traces

**Build Time:** ~15-30 seconds (depends on dependencies)

---

## 6. Start Command

```bash
node --enable-source-maps ./artifacts/api-server/dist/index.mjs
```

**Key flags:**
- `--enable-source-maps` — Maps minified code back to TypeScript source for debugging
- Input file must be `dist/index.mjs` (compiled ESM format)
- The server will:
  1. Initialize database connection to `POSTGRES_URL`
  2. Load Supabase storage client (if env vars are set)
  3. Listen on `process.env.PORT` (provided by Render)
  4. Log to stdout using Pino (structured JSON format)

**Startup sequence:**
```
✓ Pino logger initialized
✓ Express app created with CORS enabled
✓ Multer file upload middleware configured
✓ Database connection established
✓ Supabase storage initialized (if applicable)
✓ Server listening on port 10000
```

---

## 7. PORT Environment Variable Handling

**Current Implementation:**
```typescript
// artifacts/api-server/src/index.ts
const rawPort = process.env["PORT"];
if (!rawPort) throw new Error("PORT environment variable is required...");
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT value: "${rawPort}"`);
app.listen(port, (err) => { ... });
```

**Render Integration:**
- ✅ Server correctly reads `process.env.PORT`
- ✅ Validates that PORT is a positive integer
- ✅ Throws helpful error if PORT is missing
- ✅ Listens on the provided port immediately on startup

**On Render:**
- Render automatically provides `PORT=10000` at runtime
- No manual configuration needed
- Server will bind to `0.0.0.0:10000` (accessible as `https://your-service.onrender.com`)

---

## 8. Files That Must Be Modified Before Deploying

### ❌ **No modifications required** to the codebase itself.

The API server is deployment-ready with these caveats:

#### A. Environment Variables (Setup, Not Code Changes)
You **must** add these to Render before the server can run:

**Critical:**
- `POSTGRES_URL` → Supabase connection string (Transaction Pooler)
- `VITE_SUPABASE_URL` → Supabase project URL (optional backup)
- `SUPABASE_SERVICE_ROLE_KEY` → Supabase service role (optional, falls back to local disk)

**Optional but recommended:**
- `RESEND_API_KEY` → For email features
- `PAYFLOW_API_KEY`, `PAYFLOW_API_SECRET`, `PAYFLOW_ACCOUNT_ID` → For payments

#### B. Optional Configurations (Consider for Production)

1. **Create `.nvmrc` in project root** (if you want a specific Node version):
   ```
   20.11.0
   ```
   This ensures Render uses Node 20.11.0 instead of the default.

2. **Verify Render.yaml** (if you want to customize deployment):
   Create `render.yaml` in the root for Infrastructure as Code:
   ```yaml
   services:
     - type: web
       name: netco-api
       env: node
       plan: free
       buildCommand: cd artifacts/api-server && pnpm install && pnpm run build
       startCommand: node --enable-source-maps ./artifacts/api-server/dist/index.mjs
       envVars:
         - key: NODE_ENV
           value: production
         - key: POSTGRES_URL
           sync: false  # Require manual setup on Render dashboard
   ```

3. **Storage Consideration** (Important!):
   - If `SUPABASE_SERVICE_ROLE_KEY` is NOT set, files upload to local disk at `./uploads/`
   - **Problem:** Render's free tier is ephemeral — files are lost on restart
   - **Solution:** Always set `SUPABASE_SERVICE_ROLE_KEY` to use persistent Supabase storage
   - **Check:** Server logs will show: `"[v0] Supabase storage configured and enabled"` if storage is working

---

## 📋 Complete Render Deployment Checklist

### Step 1: Prepare Supabase Connection String
- [ ] Log into Supabase dashboard
- [ ] Select your NETCO project
- [ ] Go to **Settings → Database → Connection Pooling**
- [ ] Ensure **"Transaction Pooler"** is selected
- [ ] Copy the full connection string (URI format)
- [ ] Keep it safe — you'll need it for Render

### Step 2: Create/Connect Render Service
- [ ] Go to **dashboard.render.com**
- [ ] Click **"New +"** → **"Web Service"**
- [ ] Connect your GitHub repo (`anonymikey/NETCO`)
- [ ] Select branch: `v0/anonymiketech-5854-0c36b803` (or main after merge)
- [ ] **Service Name:** `netco-api`
- [ ] **Environment:** `Node`
- [ ] **Build Command:** `cd artifacts/api-server && pnpm install && pnpm run build`
- [ ] **Start Command:** `node --enable-source-maps ./artifacts/api-server/dist/index.mjs`
- [ ] **Instance Type:** `Free` (or `Starter+` for better reliability)
- [ ] Click **"Create Web Service"**

### Step 3: Add Environment Variables
In the Render dashboard (Settings → Environment):

**Critical:**
- [ ] **Key:** `POSTGRES_URL`  
  **Value:** `postgresql://postgres.[ID]:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require`

- [ ] **Key:** `NODE_ENV`  
  **Value:** `production`

**Recommended (for storage):**
- [ ] **Key:** `SUPABASE_URL`  
  **Value:** `https://[PROJECT_ID].supabase.co`

- [ ] **Key:** `SUPABASE_SERVICE_ROLE_KEY`  
  **Value:** [Your Supabase Service Role Key]

**Optional (for payments & emails):**
- [ ] **Key:** `RESEND_API_KEY`  
  **Value:** [Your Resend API key]

- [ ] **Key:** `PAYFLOW_API_KEY`  
  **Value:** [Your PayFlow API key]

- [ ] **Key:** `PAYFLOW_API_SECRET`  
  **Value:** [Your PayFlow API secret]

- [ ] **Key:** `PAYFLOW_ACCOUNT_ID`  
  **Value:** [Your PayFlow account ID]

### Step 4: Deploy & Verify
- [ ] Click **"Save"** to trigger a redeploy
- [ ] Wait for build to complete (3-5 minutes)
- [ ] Check **"Logs"** tab for startup messages
- [ ] Verify you see: `"Server listening"` and port number
- [ ] Test with: `curl https://your-service.onrender.com/api/health` (if health endpoint exists)

### Step 5: Monitor
- [ ] Check Render dashboard for errors
- [ ] Monitor the "Logs" section for runtime issues
- [ ] Verify database connections are working

---

## 🔍 Troubleshooting

### Build Fails
**Error:** `Module not found: @workspace/db`
- **Cause:** Missing monorepo dependencies
- **Fix:** Ensure `pnpm install` runs in the root before build
- **Root cause:** Render may not handle monorepo installs automatically
- **Solution:** Use custom build command: `pnpm install && cd artifacts/api-server && pnpm run build`

### Server Won't Start
**Error:** `PORT environment variable is required...`
- **Cause:** Render not setting PORT env var
- **Fix:** Go to Render Settings → Restart the service (it auto-provides PORT)

**Error:** `POSTGRES_URL is missing`
- **Cause:** Environment variable not set on Render
- **Fix:** Add `POSTGRES_URL` to Render environment variables (see Step 3)

### Database Connection Fails
**Error:** `connect ECONNREFUSED` or `SSL: CERTIFICATE_VERIFY_FAILED`
- **Cause:** Invalid connection string or missing `?sslmode=require`
- **Fix:** Double-check the Supabase connection string includes `?sslmode=require`
- **Verify:** Connection string format: `postgresql://user:pass@host:port/db?sslmode=require`

### File Uploads Fail (405 errors)
**Error:** `Upload failed: Server error (405)`
- **Cause:** Missing Supabase credentials → falls back to local disk → permissions error
- **Fix:** Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` on Render
- **Verify:** Check logs for `"[v0] Supabase storage configured and enabled"`

### Server Crashes After 5 Minutes
**Error:** Render web service stops unexpectedly
- **Cause:** Free tier spins down after 15 minutes of inactivity
- **Fix:** Upgrade to `Starter+` tier for always-on uptime
- **Or:** Accept the spin-down; server restarts immediately on next request

---

## 📊 Performance Notes

| Metric | Value | Note |
|--------|-------|------|
| **Build Time** | ~15-30s | esbuild is fast; most time is npm install |
| **Cold Start** | ~2-5s | Node startup + database init |
| **Warm Start** | <100ms | Subsequent requests after warm-up |
| **Memory Usage** | ~150MB | Typical for Node.js + esbuild bundle |
| **Max File Upload** | 50MB | multer default; adjust if needed |

---

## 📝 Post-Deployment Steps

1. **Test API Endpoints:**
   ```bash
   curl https://netco-api.onrender.com/api/health
   curl -X POST https://netco-api.onrender.com/api/upload \
     -H "Content-Type: multipart/form-data" \
     -F "file=@config.hc"
   ```

2. **Monitor Logs:**
   - Check Render dashboard "Logs" tab regularly
   - Monitor for database connection errors
   - Watch for Supabase storage errors

3. **Set Up Uptime Monitoring:**
   - Use Render's built-in health checks
   - Or use an external service (UptimeRobot, Pingdom)

4. **Plan for Scale:**
   - Free tier is suitable for development/testing
   - Upgrade to `Starter+` or higher for production traffic
   - Consider adding PostgreSQL replication for high availability

---

## 🚀 Next Steps

1. Add `POSTGRES_URL` from Supabase (Transaction Pooler)
2. Create Render web service with build/start commands above
3. Add environment variables to Render dashboard
4. Deploy and monitor logs
5. Test endpoints once server is running

**Your server will be live at:** `https://netco-api.onrender.com`

