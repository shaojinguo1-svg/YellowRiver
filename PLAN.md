# Plan: Fix Hydration Mismatch Error

## Goal
Fix the React hydration error caused by server/client HTML mismatch.

## Root Cause Analysis
Likely culprits in this codebase:
1. `Footer` — uses `new Date().getFullYear()` which could differ between server and client
2. `Header` — uses `useState` for scroll state that differs on initial render
3. `ApplicationForm` — reads `localStorage` on mount, restoring form data
4. Any component using `useSearchParams()` without `<Suspense>` boundary

## Changes
- [ ] Check Footer for `Date.now()` / `new Date()` usage
- [ ] Check Header for hydration-unsafe patterns
- [ ] Check all client components for server/client mismatches
- [ ] Fix identified issues

## Testing
- Run dev server, open browser console, confirm no hydration errors
- Check all pages: /, /listings, /about, /contact, /faq

## Notes
- Hydration errors are "recoverable" but hurt performance and cause visual flicker
