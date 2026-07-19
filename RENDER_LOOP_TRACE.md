# Account Page Render Loop - Detailed Trace

## Current Logging Added

### 1. AuthContext (`src/contexts/AuthContext.tsx`)

**Lines added:**
- Line 1: Added `useRef` import
- Line 30: Added `prevUserRef` to track object identity
- Line 37-41: Logs when user object reference changes

**What it logs:**
```
[v0] AuthProvider RENDER - session user id: <id> loading: <bool> expiryTimeoutId: <bool>
[v0] USER OBJECT REFERENCE CHANGED - user.id: <id> prev user.id: <prev-id> same id but diff ref: <bool>
```

This will show if `session?.user` is being recreated as a new object on every render despite having the same data.

---

### 2. Layout (`src/components/layout/Layout.tsx`)

**Line added:**
```
[v0] Layout RENDER - location: <path>
```

Helps track if Layout is being unnecessarily re-rendered.

---

### 3. Navbar (`src/components/layout/Navbar.tsx`)

**Line added:**
```
[v0] Navbar RENDER - user.id: <id> loading: <bool> location: <path>
```

Shows if Navbar is re-rendering and causing Layout updates.

---

### 4. AccountPage (`src/pages/account.tsx`)

**Lines added:**
```
[v0] AccountPage RENDER - user.id: <id> authLoading: <bool> session token: <first-20-chars>
[v0] USEEFFECT FIRED - dependencies changed: user.id: <id> authLoading: <bool>
[v0] fetchProfile CALLED for user: <id>
```

Captures every time the component renders and every time the useEffect fires.

---

## Expected Render Sequence When Bug Occurs

If the bug is `user` object reference changing on every render:

```
1. AuthProvider RENDER - session user id: abc123 loading: false
2. USER OBJECT REFERENCE CHANGED - user.id: abc123 prev user.id: abc123 same id but diff ref: true
   ↑ CRITICAL: Same ID but different object reference!
   ↑ This causes context value to change
   
3. Layout RENDER - location: /account
4. Navbar RENDER - user.id: abc123 loading: false location: /account
5. AccountPage RENDER - user.id: abc123 authLoading: false session token: <token>
6. USEEFFECT FIRED - dependencies changed: user.id: abc123 authLoading: false
7. fetchProfile CALLED for user: abc123
   ↑ Network request #1
   
(After fetch completes, probably NotificationsProvider fires or another state update)

8. AuthProvider RENDER - session user id: abc123 loading: false
9. USER OBJECT REFERENCE CHANGED - user.id: abc123 prev user.id: abc123 same id but diff ref: true
   ↑ Same issue again!
   
10. Layout RENDER
11. Navbar RENDER
12. AccountPage RENDER
13. USEEFFECT FIRED
14. fetchProfile CALLED
    ↑ Network request #2 (exact duplicate)
```

This loop repeats thousands of times.

---

## How to Capture Real Logs

1. **Build and run dev server:**
   ```bash
   cd artifacts/netco
   npm run dev
   ```

2. **Open DevTools Console** and filter for `[v0]`

3. **Navigate to `/account`** (may need to login first)

4. **Watch the console** - if the bug exists, you'll see `USER OBJECT REFERENCE CHANGED` hundreds of times with the same ID but different ref

5. **Check Network tab** - look for repeated `user_profiles?select=` requests

---

## Key Hypothesis to Test

**The bug is:** `session?.user` is a new object reference every time AuthProvider renders, even though the user data (id, email, etc.) hasn't changed.

**Why it matters:**
- `const user = session?.user ?? null` on line 104 assigns this new object to `user`
- Even though `user.id` is the same, `user` object reference changed
- `useEffect([user, authLoading])` in AccountPage sees `user` as a new dependency
- React runs the effect, calls fetchProfile
- This triggers a re-render somewhere
- Which triggers AuthProvider re-render
- Which creates a new `user` object reference again
- Infinite loop

---

## What the Logs Will Prove

If you see:
```
[v0] USER OBJECT REFERENCE CHANGED - user.id: abc123 prev user.id: abc123 same id but diff ref: true
```

**Multiple times in quick succession**, then we've proven the bug.

If you DON'T see this message, then the problem is different (maybe Navbar, Layout, or something else).

---

## Files with Logging Instrumentation

1. `/vercel/share/v0-project/artifacts/netco/src/contexts/AuthContext.tsx`
2. `/vercel/share/v0-project/artifacts/netco/src/components/layout/Layout.tsx`
3. `/vercel/share/v0-project/artifacts/netco/src/components/layout/Navbar.tsx`
4. `/vercel/share/v0-project/artifacts/netco/src/pages/account.tsx`

All logs use `[v0]` prefix for easy filtering in DevTools console.

---

## Next Steps After Capturing Logs

1. Capture console output for 3-5 seconds while navigating to /account
2. Count how many times `USER OBJECT REFERENCE CHANGED` appears
3. If high frequency with same IDs = confirms the hypothesis
4. Then we implement the minimal fix:
   - Either wrap `session?.user` in `useMemo`
   - Or change dependency array to `[user?.id, authLoading]`

