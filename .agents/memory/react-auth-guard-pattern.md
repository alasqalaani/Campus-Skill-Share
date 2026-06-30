---
name: React auth guard pattern
description: How to correctly guard protected pages with useAuth() — avoiding the render-phase redirect loop bug
---

## The bug

Calling `setLocation()` during the render phase while auth is loading causes an infinite redirect loop:

```typescript
// WRONG — causes flicker/loop
const { isAuthenticated } = useAuth(); // starts loading: isAuthenticated = false
if (!isAuthenticated) {
  setLocation("/");   // called during render!
  return null;
}
```

The `useAuth()` hook starts with `isLoading=true, isAuthenticated=false`. Any page that calls `setLocation` during render sees `isAuthenticated=false` and redirects to `/`. The landing page then detects the user IS authenticated and uses `useEffect` to redirect back to the protected page. The protected page mounts, auth is loading again, redirects again — infinite loop at ~3 re-mounts/second.

**Why:** `setLocation` during render is a side effect in the render phase, which React (and wouter) don't handle safely — it triggers immediate re-renders, causing unmount/remount cycles.

## The fix

Always use `useEffect` for navigation and always check `isLoading` before redirecting:

```typescript
// CORRECT
const { isAuthenticated, isLoading: authLoading } = useAuth();
const [, setLocation] = useLocation();

useEffect(() => {
  if (!authLoading && !isAuthenticated) setLocation("/");
}, [authLoading, isAuthenticated, setLocation]);

if (authLoading || !isAuthenticated) return null;
// ... rest of page
```

**How to apply:** Every protected page that guards with `useAuth()` must follow this pattern. Pages that use `useGetMyProfile` (or any other hook that returns `isLoading`) must alias one of the `isLoading` names to avoid redeclaration: e.g. `isLoading: authLoading` from `useAuth()` and `isLoading: profileLoading` from `useGetMyProfile()`.

**Why:** `useEffect` fires after render, so routing/location state is updated safely. Checking `!isLoading` ensures the redirect only fires once auth has actually resolved, not during the brief loading window.
