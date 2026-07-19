# Exact Code Changes Added for Instrumentation

All changes are CONSOLE LOGS ONLY - no functional changes to the application.

---

## 1. AuthContext.tsx

### Change 1: Import useRef
```typescript
// BEFORE:
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// AFTER:
import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react";
```

### Change 2: Add prevUserRef state
```typescript
// Inside AuthProvider(), after [expiryTimeoutId]:
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [expiryTimeoutId, setExpiryTimeoutId] = useState<NodeJS.Timeout | null>(null);
  
  // ADDED:
  const prevUserRef = useRef<User | null>(null);

  console.log("[v0] AuthProvider RENDER - session user id:", session?.user?.id, "loading:", loading, "expiryTimeoutId:", !!expiryTimeoutId);
  // ... rest of function
}
```

### Change 3: Add object reference tracking
```typescript
// Before "return <AuthContext.Provider...":
  const user = session?.user ?? null;

  // ADDED: Track if user object reference changed
  const userRefChanged = prevUserRef.current !== user;
  if (userRefChanged) {
    console.log("[v0] USER OBJECT REFERENCE CHANGED - user.id:", user?.id, "prev user.id:", prevUserRef.current?.id, "same id but diff ref:", user?.id === prevUserRef.current?.id);
    prevUserRef.current = user;
  }

  return (
    <AuthContext.Provider value={{ ... }}>
```

---

## 2. Layout.tsx

### Change: Add render log
```typescript
// Inside Layout function body, after const statements:
export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith("/admin");

  // ADDED:
  console.log("[v0] Layout RENDER - location:", location);

  return (
    // ... JSX
```

---

## 3. Navbar.tsx

### Change: Add render log with auth state
```typescript
// Inside Navbar function body, after const statements:
export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, signOut, loading } = useAuth();

  // ADDED:
  console.log("[v0] Navbar RENDER - user.id:", user?.id, "loading:", loading, "location:", location);

  useEffect(() => {
    // ... existing useEffect
```

---

## 4. AccountPage.tsx

### Change 1: Add component render log
```typescript
// Inside AccountPage function, after destructuring:
export default function AccountPage() {
  const [, navigate] = useLocation();
  const { user, session, signOut, loading: authLoading } = useAuth();
  const { toast } = useToast();

  // ADDED:
  console.log("[v0] AccountPage RENDER - user.id:", user?.id, "authLoading:", authLoading, "session token:", session?.access_token?.slice(0, 20));

  const [profile, setProfile] = useState<UserProfile | null>(null);
  // ... rest of component
```

### Change 2: Add useEffect tracking
```typescript
// Inside the second useEffect (profile loading):
  useEffect(() => {
    // ADDED:
    console.log("[v0] USEEFFECT FIRED - dependencies changed: user.id:", user?.id, "authLoading:", authLoading);
    
    if (!user || authLoading) {
      // ADDED:
      console.log("[v0] USEEFFECT EARLY RETURN - user:", !!user, "authLoading:", authLoading);
      return;
    }

    const loadProfile = async () => {
      try {
        // ADDED:
        console.log("[v0] fetchProfile CALLED for user:", user.id);
        
        // ... existing code
```

### Change 3: Add dependency note at end of useEffect
```typescript
    loadProfile();
  }, [user, authLoading]);

  // ADDED:
  console.log("[v0] useEffect dependency array ref check - user object ref likely changes every render");
```

---

## Summary

- **Total console.log() statements added:** ~15 lines across 4 files
- **Total lines added:** ~50 (including comments)
- **Functional code changes:** 0 (all logging only)
- **Breaking changes:** 0
- **Performance impact:** Minimal (only console logging)
- **Removable:** Yes - all `console.log("[v0]` lines can be deleted later

---

## Verification

Build succeeds with no errors:
```
✓ 2957 modules transformed
✓ built in 5.57s
```

TypeScript check: No errors
All imports resolve correctly
No warnings about unused code

---

## How to Remove Later

Just search for `[v0]` and delete all console.log statements that contain it.

Or run:
```bash
grep -r "console.log.*\[v0\]" src/
# To see all the lines, then delete them
```

