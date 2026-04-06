# Plan: Tenant Dashboard

## Goal
Add a tenant dashboard so registered tenants can view their application status after logging in.

## Changes

### 1. Login redirect based on role
- [ ] `src/app/(auth)/login/page.tsx` — After login, call API to get role, redirect to `/dashboard` (tenant) or `/admin/dashboard` (admin)

### 2. Middleware protection for tenant routes
- [ ] `src/middleware.ts` — Add `/dashboard` to matcher, require auth (but not admin)

### 3. Tenant dashboard page
- [ ] `src/app/(tenant)/dashboard/page.tsx` — Server component showing tenant's applications
- [ ] `src/app/(tenant)/layout.tsx` — Layout with auth check (must be logged in)

### 4. Tenant applications API
- [ ] `src/app/api/tenant/applications/route.ts` — Get current user's applications

### 5. Link applications to user accounts
- [ ] `src/app/api/applications/route.ts` (POST) — If user is logged in, set `applicantId`

### 6. Auth callback redirect
- [ ] `src/app/(auth)/auth/callback/route.ts` — Redirect based on role

## Testing
- Login as tenant → redirected to /dashboard, see applications
- Login as admin → redirected to /admin/dashboard
- Tenant submits application while logged in → application linked to account
