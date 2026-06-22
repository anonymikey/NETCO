# NETCO Config Download Flow - Complete Audit Index

## 📋 Quick Start

**Problem**: Config downloads break when API and frontend are on different domains (production setup)

**Solution**: Store absolute URLs instead of relative paths

**Effort**: ~30 minutes to implement and test

**Risk**: Low (backward compatible, easy rollback)

---

## 📚 Documentation Files

| File | Purpose | Audience | Read Time |
|------|---------|----------|-----------|
| **CONFIG_DOWNLOAD_SUMMARY.md** | Executive summary & quick overview | Everyone | 5 min |
| **CONFIG_DOWNLOAD_AUDIT.md** | Detailed technical audit findings | Developers | 15 min |
| **CONFIG_DOWNLOAD_FIXES.md** | Step-by-step code changes with explanations | Developers | 20 min |
| **CONFIG_DOWNLOAD_DIAGRAM.md** | Visual diagrams & exact line numbers | Developers | 10 min |
| **APPLY_CONFIG_DOWNLOAD_FIX.md** | Copy-paste ready code patches | Implementation | 10 min |
| **CONFIG_DOWNLOAD_AUDIT_INDEX.md** | This file - navigation guide | Everyone | 2 min |

---

## 🎯 Start Here Based on Your Role

### If You're a Project Manager
1. Read: **CONFIG_DOWNLOAD_SUMMARY.md** (5 min)
2. Overview: Problem, solution, timeline
3. Share with team: Risk assessment & rollback plan

### If You're a Developer (Implementing Fix)
1. Read: **CONFIG_DOWNLOAD_SUMMARY.md** (5 min)
2. Read: **CONFIG_DOWNLOAD_FIXES.md** (20 min) - Understand what's changing
3. Use: **APPLY_CONFIG_DOWNLOAD_FIX.md** (10 min) - Copy-paste patches
4. Reference: **CONFIG_DOWNLOAD_DIAGRAM.md** - Line numbers & verification
5. Deploy & test

### If You're a QA/Tester
1. Read: **CONFIG_DOWNLOAD_SUMMARY.md** (5 min)
2. Use: Testing checklist from SUMMARY
3. Reference: **CONFIG_DOWNLOAD_AUDIT.md** - Technical details if needed

### If You're a Code Reviewer
1. Read: **CONFIG_DOWNLOAD_AUDIT.md** (15 min)
2. Reference: **CONFIG_DOWNLOAD_DIAGRAM.md** - See data flow
3. Use: **CONFIG_DOWNLOAD_FIXES.md** - Line-by-line changes

---

## 🔍 Key Findings at a Glance

### The Problem
```
Production Setup:
- Frontend: https://netco.app (Vercel)
- API: https://api.netco.app (Separate server)

Current Bug:
- API stores: /api/orders/123/download (relative)
- Frontend browser tries: netco.app/api/orders/123/download ❌
- Actual API at: api.netco.app/api/orders/123/download ❌
- Result: 404 Download Fails
```

### The Solution
```
Store absolute URLs in database:
- API stores: https://api.netco.app/api/orders/123/download
- Frontend browser accesses: https://api.netco.app/api/orders/123/download ✅
- Result: Download Works
```

### Files to Change
| File | Lines | Change | Why |
|------|-------|--------|-----|
| orders.ts | +9, 120 | Add const, use in URL | Where free orders store configUrl |
| payment.ts | +10, 78 | Add const, use in URL | Where paid orders store configUrl |
| admin-orders.ts | +6, 100 | Add const, use in URL | Where admin fulfillment stores configUrl |
| Environment | 2 vars | Add API_BASE_URL | Tell API where it will be deployed |

### What's Already Correct ✅
- Download endpoint headers (Content-Type, Content-Disposition)
- File returned is actual .hc binary
- Frontend apiUrl() function handles both formats
- No security issues

---

## 📖 Document Cross-References

### If You See "Line 120 in orders.ts"
→ Details in **CONFIG_DOWNLOAD_DIAGRAM.md** (exact location)
→ Code change in **CONFIG_DOWNLOAD_FIXES.md** (Step 1.2)
→ Copy-paste in **APPLY_CONFIG_DOWNLOAD_FIX.md** (PATCH 1.2)

### If You See "API_BASE_URL environment variable"
→ Details in **CONFIG_DOWNLOAD_AUDIT.md** (Section 6)
→ Instructions in **CONFIG_DOWNLOAD_SUMMARY.md** (Deployment Steps)
→ Copy-paste in **APPLY_CONFIG_DOWNLOAD_FIX.md** (PATCH 5)

### If You See "Download endpoint validation"
→ Details in **CONFIG_DOWNLOAD_AUDIT.md** (Section 9)
→ Code example in **APPLY_CONFIG_DOWNLOAD_FIX.md** (optional)

### If You're Testing the Fix
→ Checklist in **CONFIG_DOWNLOAD_SUMMARY.md** (Testing Checklist)
→ Verification script in **APPLY_CONFIG_DOWNLOAD_FIX.md**
→ Architecture diagram in **CONFIG_DOWNLOAD_DIAGRAM.md** (BEFORE/AFTER)

---

## ✅ Implementation Checklist

### Before You Start
- [ ] Read CONFIG_DOWNLOAD_SUMMARY.md
- [ ] Understand the problem (relative vs absolute URLs)
- [ ] Know your deployment domains
- [ ] Have access to code repository
- [ ] Have access to API server env vars (Render/Railway dashboard)
- [ ] Have access to Vercel project settings

### Code Changes
- [ ] Apply PATCH 1 to orders.ts (lines 9, 120)
- [ ] Apply PATCH 2 to payment.ts (lines 10, 78)
- [ ] Apply PATCH 3 to admin-orders.ts (lines 6, 100)
- [ ] Run verification script to confirm patches applied
- [ ] Code review completed
- [ ] Tests pass in CI/CD

### Environment Configuration
- [ ] Set API_BASE_URL on API server (https://api.netco.app)
- [ ] Set VITE_API_BASE_URL on Vercel (https://api.netco.app)
- [ ] Verify both point to same domain
- [ ] Document where variables are configured

### Deployment
- [ ] Deploy API server first
- [ ] Verify API logs show no errors
- [ ] Wait 5 minutes for stability
- [ ] Deploy frontend
- [ ] Verify frontend loads without errors

### Testing
- [ ] Create new free order, check configUrl format
- [ ] Verify database has absolute URL
- [ ] Test download from dashboard
- [ ] Test download from order status page
- [ ] Verify .hc file downloads (not HTML)
- [ ] Check browser dev tools headers
- [ ] Test from different device/network
- [ ] Monitor logs for 1 hour

### Rollback Preparation
- [ ] Know how to revert code (git revert)
- [ ] Know how to redeploy API
- [ ] Have documented rollback steps ready

---

## 🚀 Quick Implementation Path

### For Experienced Developers

1. Skim **CONFIG_DOWNLOAD_SUMMARY.md** (2 min)
2. Open **APPLY_CONFIG_DOWNLOAD_FIX.md** (10 min)
3. Copy-paste 3 code patches
4. Update 2 environment variables
5. Deploy & test (15 min)

**Total Time**: ~30 minutes

### For First-Time Implementers

1. Read **CONFIG_DOWNLOAD_SUMMARY.md** (5 min)
2. Read **CONFIG_DOWNLOAD_FIXES.md** for understanding (20 min)
3. Read **CONFIG_DOWNLOAD_DIAGRAM.md** for context (10 min)
4. Use **APPLY_CONFIG_DOWNLOAD_FIX.md** to apply changes (10 min)
5. Deploy & test (15 min)
6. Run testing checklist (20 min)

**Total Time**: ~80 minutes

---

## 🔗 Related Documentation

### In This Repo
- `ADMIN_FULFILLMENT_FIX.md` - Related order fulfillment fixes
- `PAYMENT_FLOW_ANALYSIS.md` - Payment flow documentation
- `DATABASE_SCHEMA_REFERENCE.md` - Schema for orders/user_plans tables
- `API_SERVER_DEPLOYMENT_ANALYSIS.md` - Deployment architecture

### Key Files Involved
- `artifacts/api-server/src/routes/orders.ts` - Free order creation
- `artifacts/api-server/src/routes/payment.ts` - Paid order fulfillment
- `artifacts/api-server/src/routes/admin-orders.ts` - Admin fulfillment
- `artifacts/api-server/src/routes/plans.ts` - Returns user plans
- `artifacts/netco/src/lib/api.ts` - Frontend API helper (already correct)

---

## 📊 Status Dashboard

| Component | Status | Details |
|-----------|--------|---------|
| orders.ts | 🔴 BROKEN | Stores relative URLs |
| payment.ts | 🔴 BROKEN | Stores relative URLs |
| admin-orders.ts | 🔴 BROKEN | Stores relative URLs |
| Download endpoint | ✅ CORRECT | Headers & file already right |
| Frontend component | ✅ CORRECT | apiUrl() already handles both |
| Database schema | ✅ CORRECT | configUrl field exists |
| Production deploy | 🔴 BROKEN | Downloads fail across domains |

**After Fix**: All 🟢 WORKING

---

## 💾 Version Info

- **Audit Date**: June 22, 2026
- **Repository**: anonymikey/NETCO (main branch)
- **API Version**: Express.js
- **Frontend Version**: React 19 + Vite
- **Status**: Ready for Implementation

---

## 🤔 FAQ

**Q: How long will this take?**
A: 30 minutes for experienced devs, 90 minutes with thorough testing

**Q: Will this break existing orders?**
A: No, frontend apiUrl() handles both formats

**Q: Do I need to update the database?**
A: No, only new orders will have absolute URLs

**Q: Can I roll back if something goes wrong?**
A: Yes, revert code changes and redeploy

**Q: What if I deploy only the frontend?**
A: It still works via apiUrl() prepending VITE_API_BASE_URL

**Q: What if I deploy only the API?**
A: Frontend won't download but won't break

**Q: Where should I set the environment variables?**
A: API server platform (Render/Railway), Vercel for frontend

---

## 📞 Support

### Stuck on Code Changes?
→ Reference **CONFIG_DOWNLOAD_DIAGRAM.md** for exact line numbers

### Don't Understand the Problem?
→ Read **CONFIG_DOWNLOAD_SUMMARY.md** Problem section (30 seconds)

### Need Step-by-Step Implementation?
→ Use **APPLY_CONFIG_DOWNLOAD_FIX.md** (copy-paste patches)

### Want Full Technical Details?
→ Read **CONFIG_DOWNLOAD_AUDIT.md** (comprehensive audit)

### Need Visual Explanation?
→ Reference **CONFIG_DOWNLOAD_DIAGRAM.md** (BEFORE/AFTER diagrams)

---

## 📝 Document Sizes

| File | Lines | Size | Read Time |
|------|-------|------|-----------|
| CONFIG_DOWNLOAD_SUMMARY.md | 405 | ~15 KB | 5 min |
| CONFIG_DOWNLOAD_AUDIT.md | 311 | ~12 KB | 15 min |
| CONFIG_DOWNLOAD_FIXES.md | 309 | ~12 KB | 20 min |
| CONFIG_DOWNLOAD_DIAGRAM.md | 322 | ~13 KB | 10 min |
| APPLY_CONFIG_DOWNLOAD_FIX.md | 379 | ~15 KB | 10 min |
| CONFIG_DOWNLOAD_AUDIT_INDEX.md | This file | ~8 KB | 2 min |

**Total**: ~68 KB of documentation (comprehensive but skimmable)

---

## ✨ Next Steps

1. **Decision Maker**: Read SUMMARY.md → Approve → Notify team
2. **Tech Lead**: Read AUDIT.md → Create task → Assign developer
3. **Developer**: Read FIXES.md → Apply patches → Test
4. **QA**: Reference SUMMARY.md checklist → Test
5. **DevOps**: Set env vars → Monitor deployment

---

## 🎓 Learning Outcomes

After reviewing these documents, you'll understand:

✅ Why relative URLs fail in production
✅ How absolute URLs fix the issue
✅ Where in the codebase the fix goes
✅ How to deploy safely
✅ How to test the fix
✅ How to rollback if needed
✅ Why the frontend is already compatible
✅ Why the download endpoint is already correct

---

**Last Updated**: June 22, 2026
**Version**: 1.0
**Status**: Ready for Implementation
**Estimated ROI**: High (fixes critical production bug in 30 minutes)
