# Plan: Performance Optimization — Cut Per-Request Remote Round-Trips

> Separate from PLAN.md (Final Acceptance Blocker Remediation), which is an
> in-flight team plan. No file overlap between the two plans except
> `.env.local` ownership notes.
>
> **Status: APPROVED with amendments (review incorporated below).**
> Sequencing: PLAN.md's dependency bumps (next 16.2.7, prisma 7.8.0) have NOT
> landed at implementation time; before/after timings are both captured on
> next 16.1.6 / prisma 7.4.2 so the comparison does not straddle the version
> change. Re-baseline if the bumps land mid-implementation.

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
      request share a single lookup. (`cache()` is a no-op in route handlers,
      which is fine — handlers call it once anyway.)
- [ ] Replace the unconditional `prisma.user.upsert()` with read-first:
      `findUnique` (fast read) → return if found; only on miss fall back to
      the existing `upsert` (preserves first-login race safety).
- [ ] Keep `requireAdmin()` throwing `"Unauthorized"` for API routes
      (`api-handler.ts` maps it to 401).
- [ ] **Amendment:** add a page-safe variant `requireAdminPage()` that calls
      `redirect("/login")` on failure instead of throwing — there is no
      `error.tsx` under `src/app/admin/`, so a bare throw in a page renders
      a 500.

Expected: −2 auth round-trips and −2 DB writes per protected page
(~300–500ms saved).

### 2. Make the `/admin` middleware role check cheap — `src/middleware.ts`

**Amendment: the middleware cache and the per-page checks MUST land in one
atomic commit** — the cache without the page checks opens a ≤60s data window
on client-side navigation.

- [ ] Keep the middleware auth check (`getUser`) and all redirect logic
      unchanged.
- [ ] Add a module-scope `Map` cache for the admin role REST lookup, keyed by
      the *verified* `user.id` from `getUser()`, TTL 60s.
      - Cap the Map at ~1000 entries; evict the oldest entry on insert.
      - Cache negative results too (fail-closed): role *promotion* can take
        up to 60s to reach middleware.
      - REST lookup failures are NOT cached — fail closed for this request,
        retry live on the next.
- [ ] Add `requireAdminPage()` to the six pages currently lacking a check:
      `admin/page.tsx`, `admin/dashboard/page.tsx`, `admin/listings/page.tsx`,
      `admin/listings/new/page.tsx`, `admin/listings/[id]/edit/page.tsx`,
      `admin/settings/page.tsx`.
      (Defense-in-depth: layouts do not re-run on client-side navigation
      within the same layout tree; middleware may serve a ≤60s-stale role.)
- [ ] Switch the five pages already calling `requireAdmin()` to
      `requireAdminPage()` for consistent UX (redirect instead of 500).
      API routes keep `requireAdmin()`.
- [ ] Edge-runtime note: `middleware.ts` builds for the Edge runtime in
      Next 16; the Map is per-instance and may be evicted — that only causes
      a fallthrough to the live REST check, which is the safe direction.
      Do NOT rename `middleware.ts` to `proxy.ts` in this change.

Expected: middleware cost 200–600ms → ~100ms (just `getUser`) on warm
requests.

Trade-off (accepted by review): a revoked admin can keep fetching page
SHELLS for up to 60s; every data/mutation path (admin APIs + per-page
`requireAdminPage`) enforces immediately against the live DB, so no data or
mutation is reachable in that window.

### 3. Connection pooling — `.env.local` + `src/lib/prisma.ts` + `prisma.config.ts`
- [ ] **Amendment:** add a guard in `prisma.config.ts` — if `DATABASE_URL`
      contains `":6543"` or `"pooler.supabase.com"` and `DIRECT_URL` is
      unset, throw with a clear message. `prisma migrate` uses
      `pg_advisory_lock`, which breaks through the transaction-mode pooler;
      the current silent fallback to `DATABASE_URL` is the footgun.
- [ ] Configure the `pg` Pool in `src/lib/prisma.ts`: `max: 10`,
      `keepAlive: true`, `idleTimeoutMillis: 30_000`,
      `connectionTimeoutMillis: 10_000`.
- [ ] `.env.local` (owner provides, never commit): `DATABASE_URL` = Supavisor
      transaction-mode URL (host `*.pooler.supabase.com:6543`, username
      `postgres.<project-ref>`); `DIRECT_URL` stays on
      `db.<ref>.supabase.co:5432` for `prisma migrate`.
- [ ] The `Serializable` lease transactions in `src/lib/resident-leases.ts`
      are compatible with transaction mode (interactive transactions pin one
      backend; no advisory locks/LISTEN in app code) — no changes needed.

Expected: eliminates 10–20s cold-connection spikes; faster query setup.
Compatibility note: node-postgres issues unnamed prepared statements, which
are compatible with Supavisor transaction mode; rollback is an env revert.

### 4. Minor polish (optional, last)
- [ ] `PropertyCard` `<Image>`: add a `sizes` attribute.
- [ ] First/hero images: `priority`.
- [ ] Optionally add `loading.tsx` under admin sections (none exist today).

## Files
- `src/lib/auth.ts` — `cache()` + read-first lookup + `requireAdminPage()`
- `src/middleware.ts` — TTL role cache (atomic with page checks)
- `src/app/admin/**/page.tsx` — add/switch to `requireAdminPage()` (11 pages)
- `src/lib/prisma.ts` — Pool options
- `prisma.config.ts` — pooled-URL-without-DIRECT_URL guard
- `.env.local` — pooled `DATABASE_URL` (owner provides; not committed)
- (optional) `src/components/property/property-card.tsx`, `src/app/page.tsx`,
  `src/app/admin/loading.tsx`

## Testing
- `npx tsc --noEmit` && `npm run lint` && `npm run test` && `npm run build`
- Before/after timings (authenticated probe, same dependency versions) for
  `/admin/dashboard`, `/admin/maintenance`, `/dashboard`
- Production check: `npm run build && npm start`; `curl -w` timings for `/`,
  `/listings` (expect ISR cache hits on repeat requests)
- Security regression:
  - logged-out → `/admin/*` and `/dashboard` redirect to login
  - TENANT → `/admin/*` blocked (direct URL AND client-side navigation /
    RSC fetch — this specifically exercises the per-page checks)
  - admin APIs still reject tenants immediately (401)
  - first-login concurrency still creates exactly one `users` row
    (read-first falls back to atomic upsert)
  - revoked admin: gets redirected on next full load and blocked on
    client-side nav (per-page check beats the ≤60s middleware cache)
- `npx prisma migrate status` still works via `DIRECT_URL`; confirm the new
  `prisma.config.ts` guard fires when `DIRECT_URL` is unset and
  `DATABASE_URL` looks pooled

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
  Redis-backed rate limiting, admin user provisioning feature.
- Documented follow-up (NOT in this change): switch middleware/server auth to
  `supabase.auth.getClaims()` with asymmetric JWT signing keys to eliminate
  the remaining ~100ms remote `getUser()` round-trips.
