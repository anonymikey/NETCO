# Console Logging Instrumentation - Render Loop Trace

## Status
✅ All logging instrumentation added  
✅ Code builds successfully  
✅ Ready to capture real render sequence  

---

## What Was Added

### 1. **AuthContext.tsx** - Object Reference Tracking

**Critical addition:** Track if `session?.user` object reference changes on every render

```typescript
// Line 1: Import useRef
import { ..., useRef, ... }

// Line 30: Create ref to track previous user object
const prevUserRef = useRef<User | null>(null);

// Line 37-41: Detect and log object reference changes
const userRefChanged = prevUserRef.current !== user;
if (userRefChanged) {
  console.log("[v0] USER OBJECT REFERENCE CHANGED - user.id:", user?.id, "prev user.id:", prevUserRef.current?.id, "same id but diff ref:", user?.id === prevUserRef.current?.id);
  prevUserRef.current = user;
}
```

**What it proves:**
- If `user.id` is the same but `same id but diff ref: true` appears many times → **Bug confirmed**
- This would show that Supabase returns a new User object every time, causing context value changes

---

### 2. **Layout.tsx** - Render Tracking

```typescript
console.log("[v0] Layout RENDER - location:", location);
```

**Purpose:** Track if Layout is being unnecessarily re-rendered, which would cascade to children.

---

### 3. **Navbar.tsx** - Render Tracking with Auth State

```typescript
console.log("[v0] Navbar RENDER - user.id:", user?.id, "loading:", loading, "location:", location);
```

**Purpose:** Track if Navbar re-renders are triggering Layout updates.

---

### 4. **AccountPage.tsx** - Detailed Effect Tracing

```typescript
// Line 46-47: Component render
console.log("[v0] AccountPage RENDER - user.id:", user?.id, "authLoading:", authLoading, "session token:", session?.access_token?.slice(0, 20));

// Line 88-92: useEffect fired
console.log("[v0] USEEFFECT FIRED - dependencies changed: user.id:", user?.id, "authLoading:", authLoading);

// Line 95: fetchProfile called
console.log("[v0] fetchProfile CALLED for user:", user.id);

// Line 173-174: Dependency array note
console.log("[v0] useEffect dependency array ref check - user object ref likely changes every render");
```

**Purpose:** Capture exactly when the effect runs and when network requests happen.

---

## How to Verify the Bug

### Step 1: Run Dev Server
```bash
cd /vercel/share/v0-project/artifacts/netco
npm run dev
```

The server will start on `http://localhost:5173`

### Step 2: Open Browser Dev Tools
- Open DevTools (F12)
- Go to **Console** tab
- Type filter: `[v0]` to see only our logs

### Step 3: Navigate to Account Page
- If not logged in, login first
- Go to `/account` 

### Step 4: Watch Console
- You'll see logs appearing
- Look for the pattern repeating

### Step 5: Check Network Tab
- Open **Network** tab
- Filter for requests
- Look for repeated `user_profiles?select=` queries

---

## Expected Output If Bug Exists

```
[v0] AuthProvider RENDER - session user id: 123abc loading: false expiryTimeoutId: false
[v0] USER OBJECT REFERENCE CHANGED - user.id: 123abc prev user.id: null same id but diff ref: true
[v0] Layout RENDER - location: /account
[v0] Navbar RENDER - user.id: 123abc loading: false location: /account
[v0] AccountPage RENDER - user.id: 123abc authLoading: false session token: eyJhbGciOiJ...
[v0] useEffect dependency array ref check - user object ref likely changes every render
[v0] USEEFFECT FIRED - dependencies changed: user.id: 123abc authLoading: false
[v0] fetchProfile CALLED for user: 123abc

[10ms later...]

[v0] AuthProvider RENDER - session user id: 123abc loading: false expiryTimeoutId: false
[v0] USER OBJECT REFERENCE CHANGED - user.id: 123abc prev user.id: 123abc same id but diff ref: true
                                                     ↑ SAME ID
                                                                           ↑ DIFFERENT REFERENCE!
[v0] Layout RENDER - location: /account
[v0] Navbar RENDER - user.id: 123abc loading: false location: /account
[v0] AccountPage RENDER - user.id: 123abc authLoading: false session token: eyJhbGciOiJ...
[v0] USEEFFECT FIRED - dependencies changed: user.id: 123abc authLoading: false
[v0] fetchProfile CALLED for user: 123abc
```

**This pattern repeating hundreds of times = Confirms the bug**

---

## Expected Output If Bug Does NOT Exist

If `USER OBJECT REFERENCE CHANGED` appears ONCE with `prev user.id: null`, then rarely after that, the bug is NOT in AuthContext.

Then the problem might be:
- Navbar triggering unnecessary re-renders
- Layout triggering unnecessary re-renders
- NotificationsProvider making too many calls
- Account page useEffect running more than necessary for other reasons

---

## The Hypothesis We're Testing

### Null Hypothesis (Bug exists):
`session?.user` object is recreated on every render, causing:
1. Context value reference to change
2. AccountPage useEffect to detect `user` dependency change
3. AccountPage re-renders
4. Profile fetch triggers
5. Somewhere this causes another AuthProvider render
6. Cycle repeats → thousands of requests

### Alternative Hypothesis (Bug elsewhere):
The render loop is triggered by:
- Navbar's useAuth hook polling
- NotificationsProvider making interval calls
- Layout component state issues
- Something else entirely

The logs will definitively prove which one.

---

## Files Modified

1. `/vercel/share/v0-project/artifacts/netco/src/contexts/AuthContext.tsx`
   - Added: `useRef` import
   - Added: `prevUserRef` state
   - Added: Object reference change detection

2. `/vercel/share/v0-project/artifacts/netco/src/components/layout/Layout.tsx`
   - Added: Render log

3. `/vercel/share/v0-project/artifacts/netco/src/components/layout/Navbar.tsx`
   - Added: Render log with state

4. `/vercel/share/v0-project/artifacts/netco/src/pages/account.tsx`
   - Added: Component render log
   - Added: useEffect fire log
   - Added: fetchProfile call log
   - Added: Dependency check log

**Total changes:** ~50 lines of console.log statements  
**Build status:** ✅ Success  
**TypeScript errors:** 0  

---

## After Logs Are Captured

Once you run the logs and send the output:

1. We'll see exactly which component is rendering repeatedly
2. We'll see if it's the `user` object reference issue
3. We'll know the exact fix needed:
   - If it's AuthContext: Add `useMemo` to wrap `session?.user`
   - If it's AccountPage: Change dependency to `[user?.id, authLoading]`
   - If it's something else: We'll know exactly what to fix

---

## No Assumptions - Just Data

This instrumentation captures the ACTUAL render sequence, not theory. When you run it and share the logs, we'll have empirical proof of what's happening, not assumptions.

