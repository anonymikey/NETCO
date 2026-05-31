# API Server Deployment Analysis Summary

## Executive Summary

The NETCO API server in `/artifacts/api-server` is **production-ready for Render deployment** with zero code changes required. Only environment variable setup is needed.

---

## 1. Package.json Start Script

**Location:** `/artifacts/api-server/package.json`

```json
"scripts": {
  "dev": "export NODE_ENV=development && pnpm run build && pnpm run start",
  "build": "node ./build.mjs",
  "start": "node --enable-source-maps ./dist/index.mjs"
}
```

**Analysis:**
- ✅ Clean, standard Node.js setup
- ✅ Uses esbuild for fast bundling (not tsc)
- ✅ Outputs ES Modules (`.mjs` format)
- ✅ Source maps enabled for production debugging

---

## 2. Node Version Required

**Minimum:** Node 18 LTS  
**Recommended:** Node 20.x LTS  
**Specified in repo:** None (no `.nvmrc` file)

**Impact:**
- Render defaults to Node 20.x (acceptable)
- If you need a specific version, create `.nvmrc` with your version
- TypeScript target is ES2020 (compatible with Node 18+)

---

## 3. Environment Variables Required

### 🔴 **CRITICAL** (Must be set or server won't start)

| Variable | Type | Format | Source | Used For |
|----------|------|--------|--------|----------|
| **POSTGRES_URL** | String | Connection URI | Supabase Transaction Pooler | Database connection |
| **PORT** | Number | Integer 1-65535 | Render (auto-provided) | HTTP server binding |

### 🟡 **IMPORTANT** (Needed for features to work)

| Variable | Type | Format | Source | Used For | Fallback |
|----------|------|--------|--------|----------|----------|
| **SUPABASE_URL** | String | HTTPS URL | Supabase Settings | Storage bucket access | None - features disabled |
| **SUPABASE_SERVICE_ROLE_KEY** | String | Long token | Supabase API keys | Storage authentication | Local disk ⚠️ ephemeral |
| **RESEND_API_KEY** | String | API token | Resend dashboard | Email sending | Features throw error |
| **PAYFLOW_API_KEY** | String | API key | PayFlow account | M-Pesa payments | Features throw error |
| **PAYFLOW_API_SECRET** | String | Secret token | PayFlow account | M-Pesa auth | Features throw error |
| **PAYFLOW_ACCOUNT_ID** | Number | Integer | PayFlow account | M-Pesa routing | Features throw error |

### 🟢 **OPTIONAL** (Good to have)

| Variable | Default | Used For |
|----------|---------|----------|
| **NODE_ENV** | `development` | Logging format (use `production` for Render) |
| **LOG_LEVEL** | `info` | Logger verbosity (`debug`, `info`, `warn`, `error`) |
| **VITE_PUBLIC_URL** | Placeholder URL | Email template links |

---

## 4. Database Connection Requirements

**System:** Supabase PostgreSQL with Transaction Pooler

**Connection Details:**
- **Host:** `aws-1-us-east-1.pooler.supabase.com`
- **Port:** `6543`
- **SSL Mode:** `require` (mandatory)
- **Auth:** Supabase database user + password
- **Pooling:** Transaction-level (optimal for serverless/Render)

**Expected Tables:**
- `orders` — Payment and order records
- `config_servers` — Available VPN configurations
- `user_plans` — User subscriptions
- `vpn_configs` — VPN configuration database

**Code Location:**
- Database client: `src/lib/db.ts` (does not exist in current structure)
- Database usage: All route handlers import `@workspace/db` from monorepo
- Schema source: `lib/db` package (separate monorepo package)

**Connection Behavior:**
- ✅ Initializes on server startup
- ✅ Throws error if `POSTGRES_URL` is missing
- ✅ Auto-reconnects on connection loss
- ✅ Compatible with Render free tier (no long-lived connections needed)

---

## 5. Build Command for Render

```bash
cd artifacts/api-server && pnpm install && pnpm run build
```

**Breaking it down:**
1. `cd artifacts/api-server` — Enter the API server directory
2. `pnpm install` — Install dependencies (monorepo linked)
3. `pnpm run build` — Run esbuild to compile TypeScript → JavaScript

**What esbuild does:**
- Reads `src/index.ts` and `src/serverless.ts` as entry points
- Bundles dependencies (except externalized ones)
- Outputs ES Modules format
- Generates source maps
- Creates tree-shaken, minified bundles
- Output location: `dist/index.mjs`, `dist/serverless.mjs`

**Build Time:** ~15-30 seconds (includes npm install)

**Success Indicators:**
```
✓ dist/index.mjs created
✓ dist/serverless.mjs created
✓ dist/*.mjs.map (source maps)
✓ Exit code 0
```

---

## 6. Start Command for Render

```bash
node --enable-source-maps ./artifacts/api-server/dist/index.mjs
```

**Breakdown:**
- `node` — Run Node.js runtime
- `--enable-source-maps` — Map minified code back to TypeScript
- `./artifacts/api-server/dist/index.mjs` — Entry point (compiled ESM)

**Startup Sequence:**
1. Load environment variables
2. Initialize Pino logger
3. Create Express app with CORS
4. Set up multer for file uploads
5. Load database connection from `POSTGRES_URL`
6. Initialize Supabase storage (if credentials provided)
7. Listen on `process.env.PORT`
8. Log: `"Server listening on port [PORT]"`

**Success Indicators:**
```
Server listening on port 10000
Request started: GET /api/health
```

---

## 7. PORT Environment Variable Handling

**Implementation (src/index.ts):**
```typescript
const rawPort = process.env["PORT"];
if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}
app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");
});
```

**Analysis:**
- ✅ Correctly reads `process.env.PORT`
- ✅ Validates port is a positive integer
- ✅ Throws meaningful error if PORT is missing or invalid
- ✅ Listens on `0.0.0.0:[PORT]` (all interfaces)
- ✅ Compatible with Render's automatic PORT provisioning

**Render Integration:**
- Render automatically provides `PORT=10000` at runtime
- Server will successfully bind and accept connections
- No manual PORT configuration needed

---

## 8. Files That Must Be Modified Before Deploying

### ✅ **ZERO FILES require modification**

The codebase is deployment-ready. However, consider these optional enhancements:

### Optional: Create `.nvmrc` for consistent Node version
**File:** `/vercel/share/v0-project/.nvmrc`
```
20.11.0
```
**Benefit:** Ensures Render uses the same Node version as development

### Optional: Create Render configuration file
**File:** `/vercel/share/v0-project/render.yaml`
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
        sync: false
```
**Benefit:** Infrastructure as Code for reproducible deployments

### ⚠️ Critical Storage Consideration

**Current Fallback Logic** (src/lib/storage.ts):
```typescript
const useSupabase = Boolean(supabaseUrl && serviceRoleKey);

if (!useSupabase) {
  fs.mkdirSync(LOCAL_DIR, { recursive: true });
  console.warn("⚠️  Supabase storage not configured — using local disk storage at ./uploads/");
}
```

**Problem:** If Supabase credentials aren't set, files upload to local disk (`./uploads/`), but **Render's free tier is ephemeral** — files are deleted on restart.

**Solution:** Always set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` on Render.

**Recommendation:** Add a startup check to warn if storage is misconfigured:
```typescript
if (!useSupabase && process.env.NODE_ENV === "production") {
  console.warn("⚠️  WARNING: Storage is using local disk in production!");
  console.warn("This will cause data loss on deployment/restart.");
  console.warn("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY immediately.");
}
```

---

## 📋 Pre-Deployment Checklist

| Item | Status | Action |
|------|--------|--------|
| Node version | ✅ Ready | No change needed (defaults work) |
| Build script | ✅ Ready | Use as-is |
| Start script | ✅ Ready | Use as-is |
| PORT handling | ✅ Ready | Render provides PORT automatically |
| Database connection | ⚠️ Setup needed | Get `POSTGRES_URL` from Supabase |
| Environment setup | ⚠️ Setup needed | Add vars to Render dashboard |
| File storage | ⚠️ Setup needed | Set Supabase credentials |
| Email functionality | ⚠️ Optional | Add `RESEND_API_KEY` |
| Payments functionality | ⚠️ Optional | Add PayFlow credentials |

---

## 🚀 Deployment Steps

### 1. Prepare Supabase
- Log into Supabase dashboard
- Select your NETCO project
- Go to Settings → Database → Connection Pooling
- Copy the **Transaction Pooler** connection string
- Format: `postgresql://postgres.[ID]:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require`

### 2. Create Render Service
- Go to dashboard.render.com
- Click "New" → "Web Service"
- Connect GitHub repo: `anonymikey/NETCO`
- Use branch: `v0/anonymiketech-5854-0c36b803` (or main)
- **Build Command:** `cd artifacts/api-server && pnpm install && pnpm run build`
- **Start Command:** `node --enable-source-maps ./artifacts/api-server/dist/index.mjs`

### 3. Add Environment Variables (Render Settings → Environment)

**Critical:**
```
POSTGRES_URL = postgresql://postgres.[ID]:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
NODE_ENV = production
```

**Optional but Recommended:**
```
SUPABASE_URL = https://[PROJECT_ID].supabase.co
SUPABASE_SERVICE_ROLE_KEY = [Your service role key]
RESEND_API_KEY = [Your API key]
```

### 4. Deploy
- Click "Create Web Service"
- Wait 3-5 minutes for build to complete
- Verify logs show "Server listening on port 10000"

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────┐
│           Render Web Service                 │
│  Instance: Free/Starter+                     │
│  Node: 20.x LTS                              │
└───────────────────┬─────────────────────────┘
                    │
                    ├─ npm/pnpm install (monorepo)
                    ├─ esbuild (bundle & minify)
                    ├─ Start: node index.mjs
                    │
        ┌───────────┼───────────┐
        │           │           │
    ┌───▼───┐   ┌───▼────┐ ┌───▼──────┐
    │Express│   │Supabase│ │Supabase  │
    │ App   │   │Database│ │ Storage  │
    └───┬───┘   └───┬────┘ └───┬──────┘
        │           │          │
        │           │          │
    ┌───▼───────────▼──────────▼───┐
    │    PostgreSQL (Render)        │
    │    aws-1-us-east-1.pooler     │
    │    Transaction Pooler         │
    └───────────────────────────────┘
```

---

## 🔍 Monitoring & Debugging

**Render Dashboard Features:**
- **Logs tab:** Real-time server logs (JSON format from Pino)
- **Metrics tab:** Memory, CPU, network usage
- **Deploys tab:** Build logs, deployment history
- **Events tab:** Service restarts, errors

**Key Log Patterns to Monitor:**

✅ **Success:**
```json
{"level":30,"time":"2024-01-01T00:00:00.000Z","msg":"Server listening","port":10000}
```

❌ **Database Connection Error:**
```json
{"level":50,"err":{"message":"POSTGRES_URL is missing"},"msg":"Error listening"}
```

❌ **Storage Misconfiguration:**
```
⚠️  Supabase storage not configured — using local disk storage
```

---

## 📝 Summary

| Aspect | Status | Notes |
|--------|--------|-------|
| **Production Ready** | ✅ Yes | Zero code changes needed |
| **Render Compatible** | ✅ Yes | All requirements met |
| **Build & Start** | ✅ Ready | Scripts are optimal |
| **Database** | ⚠️ Setup only | Needs `POSTGRES_URL` |
| **Port Binding** | ✅ Ready | Auto-handled by Render |
| **Environment** | ⚠️ Setup needed | Vars must be added to Render |
| **Storage** | ⚠️ Setup needed | Set Supabase credentials |
| **Security** | ✅ Good | Service role key properly isolated |

**Time to Deploy:** 15-20 minutes (mostly Supabase setup)

