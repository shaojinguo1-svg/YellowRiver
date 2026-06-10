# Plan: Performance Optimization — Cut Per-Request Remote Round-Trips

> Separate from PLAN.md (Final Acceptance Blocker Remediation), which is an
> in-flight team plan. No file overlap between the two plans except
> `.env.local` ownership notes. Reviewer should approve before implementation.

## Goal
Protected pages (admin/tenant) take 1–2s per navigation in dev, with occasional
10–20s cold spikes. Measured root cause (dev server logs + RTT probe, not
guesswork):

- Each admin page request makes 6–7 sequential remote calls against a remote
  Supabase (~70–230ms RTT each):
  1. middleware `supabase.auth.getUser()` (remote Auth API)
  2. middleware REST role check with `cache: "no-store"` (remote, 100–300ms,
     observed as `proxy.ts: 200–600ms` in dev logs)
  3. admin layout `getCurrentUser()` → another `auth.getUser()` + a
     `prisma.user.upsert()` (a WRITE on every request)
  4. page `requireAdmin()` → a third `auth.getUser()` + a second upsert
  5. then the page's own queries
- `DATABASE_URL` connects directly to `db.<ref>.supabase.co:5432`; cold TLS
  connection setup explains the 10–20s outliers (observed `render: 9.9s` and
  `19.5s` on `/`).

This plan removes redundant round-trips without weakening route protection.

## Changes

### 1. Request-scoped dedupe of `getCurrentUser` — `src/lib/auth.ts`
- [ ] Wrap `getCurrentUser` in React `cache()` so layout + page within one
      request share a single lookup.
- [ ] Replace the unconditional `prisma.user.upsert()` with read-first:
      `findUnique` (fast read) → return if found; only on miss fall back to
      the existing `upsert` (preserves first-login race safety).
- [ ] `requireAdmin` logic unchanged.

Expected: −2 auth round-trips and −2 DB writes per protected page
(~300–500ms saved).

### 2. Make the `/admin` middleware role check cheap — `src/middleware.ts`
- [ ] Keep the middleware auth check (`getUser`) and login redirects unchanged.
- [ ] Add a module-scope in-memory cache for the role lookup, keyed by the
      *verified* `user.id` returned by `getUser()`, with a 60s TTL. Warm
      requests skip the REST role call entirely.
- [ ] Add `requireAdmin()` to admin pages that currently rely on
      layout/middleware only: `admin/page.tsx`, `admin/dashboard/page.tsx`,
      `admin/listings/page.tsx`, `admin/listings/new/page.tsx`,
      `admin/listings/[id]/edit/page.tsx`, `admin/settings/page.tsx`.
      (Defense-in-depth: layouts do not re-run on client-side navigation
      within the same layout tree.)

Expected: middleware cost 200–600ms → ~100ms (just `getUser`) on warm
requests.

Trade-off (reviewer decision): a revoked admin role can keep fetching page
shells for up to 60s; every data/mutation path (admin APIs + per-page
`requireAdmin`) still enforces immediately, so no data or mutation is
reachable in that window.

### 3. Connection pooling — `.env.local` + `src/lib/prisma.ts`
- [ ] Switch app `DATABASE_URL` from direct `:5432` to the Supabase pooler
      (Supavisor) transaction mode `:6543` (connection string from Supabase
      Dashboard → Connect). Owner provides the pooler URL; not committed.
- [ ] Keep `DIRECT_URL` (5432 direct) for `prisma migrate` (per
      `prisma.config.ts`).
- [ ] Configure the `pg` Pool in `src/lib/prisma.ts`: `max: 10`,
      `keepAlive: true`, `idleTimeoutMillis: 30_000`,
      `connectionTimeoutMillis: 10_000`.

Expected: eliminates 10–20s cold-connection spikes; faster query setup.
Compatibility note: node-postgres issues unnamed prepared statements, which
are compatible with Supavisor transaction mode; rollback is an env revert.

### 4. Minor image polish (optional, last)
- [ ] `PropertyCard` `<Image>`: add a `sizes` attribute.
- [ ] First/hero images: `priority`.

## Files
- `src/lib/auth.ts` — `cache()` + read-first lookup
- `src/middleware.ts` — TTL role cache
- `src/app/admin/{page,dashboard/page,listings/page,listings/new/page,listings/[id]/edit/page,settings/page}.tsx` — add `requireAdmin()`
- `src/lib/prisma.ts` — Pool options
- `.env.local` — pooled `DATABASE_URL` (owner provides; not committed)
- (optional) `src/components/property/property-card.tsx`, `src/app/page.tsx`

## Testing
- `npx tsc --noEmit` && `npm run lint` && `npm run build`
- Before/after dev-log timings for `/admin/dashboard`, `/admin/maintenance`,
  `/dashboard` (compare `proxy.ts` + `render` ms)
- Production check: `npm run build && npm start`; `curl -w` timings for `/`,
  `/listings` (expect ISR cache hits on repeat requests)
- Security regression:
  - logged-out → `/admin/*` and `/dashboard` redirect to login
  - TENANT → `/admin/*` blocked (direct URL and client-side navigation)
  - admin APIs still reject tenants immediately
  - first-login concurrency still creates exactly one `users` row
- `npx prisma migrate status` still works via `DIRECT_URL`

## Notes / Risks
- 60s role-cache staleness affects page shells only; all data/mutation paths
  enforce immediately. Alternative considered: role claim in Supabase JWT
  `app_metadata` (zero round-trips, no staleness) — deferred to the planned
  admin-provisioning feature since it touches Supabase config and the user
  creation flow.
- Dev mode disables ISR and optimizes remote images per request; part of the
  perceived slowness exists only in dev. The production check quantifies the
  real user-facing numbers.
- Coordination: PLAN.md (acceptance remediation) bumps `prisma`/`next`
  versions and touches `package.json`; this plan does not touch
  `package.json`, so the two can land in either order.
- Out of scope: vulnerability remediation list (separate ticket),
  Redis-backed rate limiting, admin user provisioning feature, JWT role
  claims.
