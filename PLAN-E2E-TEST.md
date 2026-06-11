# Plan: Full-Flow / Full-Feature End-to-End Test Pass

## Goal
Exercise every user-facing flow and feature of YellowRiver as a real
**anonymous visitor, tenant/resident, and admin**, and judge whether the
interactions are **logically sound and realistic** — not just "does it return
200." Deliverable is a findings report (works / bug / UX-or-logic concern),
each with reproduction steps and severity. This is a TEST pass: **no product
code changes** except, if the reviewer pre-authorizes, trivial obviously-safe
fixes — otherwise bugs are reported, not fixed.

## Approach & tooling
- Drive the running dev server (`preview_start`, port 3000) with: text
  snapshots/screenshots for UI, direct `fetch` probes for API + auth, and
  read-only Supabase REST/SQL for DB-state verification.
- Auth: mint **disposable** Supabase accounts per role (admin/tenant) via the
  service-role key, exactly as the perf-test pass did. **Never** mutate the
  real admin (`shaojin.guo1@gmail.com`) — flip roles only on throwaway users.
- Each created row (users, properties, leases, applications, inquiries,
  maintenance, storage objects) is **tagged** (e.g. title/email prefix
  `e2e-test-…`) and **deleted at the end**; the pass ends with a query proving
  zero `e2e-test-*` rows remain.
- Email is in Resend **test mode**: admin notifications to the owner inbox
  deliver; applicant-facing sends fail with `testing_restriction` (expected).
  Verify via the Resend API, not by sending to strangers.

## ⚠️ Reviewer decision needed — test data location
The only database is the **live shared Supabase project**. This plan creates
and deletes tagged test rows there. Options for the reviewer:
(a) approve careful tagged-and-cleaned test data on the live DB (default), or
(b) require a separate scratch DB / branch first.
Destructive ops are scoped to `e2e-test-*` rows only; no truncate, no schema
change, no touching existing real data.

## Scope — flows to test

### A. Public / anonymous
- [ ] Home renders; featured properties come from DB (ACTIVE only); stats,
  CTA links resolve.
- [ ] Listings index: location + bedrooms filters actually filter; pagination
  works; only ACTIVE properties show. (Known gap: price/amenity filters not
  built — confirm they're absent, not broken.)
- [ ] Listing detail by slug: ACTIVE renders fully; **DRAFT/INACTIVE/
  ARCHIVED/RENTED slug → 404** (vuln C1 fix — verify it holds).
- [ ] Static pages: about/contact/faq/privacy/terms render.
- [ ] Contact form submit → 201, inquiry persisted, admin notification email
  delivered (Resend), rate limiting kicks in after the configured burst.

### B. Auth
- [ ] Register → "check your email"; confirm link → `/auth/callback` →
  role-based redirect (tenant → /dashboard).
- [ ] First login creates exactly one `users` row, role TENANT.
- [ ] Login role routing: admin → /admin/dashboard, tenant → /dashboard;
  `?redirect=` honored but open-redirect-safe.
- [ ] Logout clears session.
- [ ] Forgot-password → reset email; reset-password flow updates password.
- [ ] Middleware: logged-out → /admin/* and /dashboard redirect to login.

### C. Tenant / resident portal
- [ ] Tenant with NO active lease: dashboard shows applications view (their
  own apps, matched correctly), no maintenance entry.
- [ ] Tenant WITH active lease: dashboard shows lease summary (property,
  dates, rent, residents, deposit) — money/dates formatted, not raw Decimal.
- [ ] Maintenance: submit (title/desc/location/category/priority) → appears in
  own list; cancel an OPEN request; cannot cancel non-OPEN; cannot see another
  resident's requests; `adminNotes` never present in tenant payload.
- [ ] Realistic check: when a lease ends/cancels, does the dashboard correctly
  flip back to the applications view; can a maintenance request still be read.

### D. Admin
- [ ] Dashboard stats match DB counts; recent lists correct.
- [ ] Listings CRUD: create (slug generated/unique), edit, delete; image
  upload (signed URL → private/public bucket), reorder, delete; storage
  objects cleaned on delete.
- [ ] Applications: list/filter; open detail; change status SUBMITTED→
  UNDER_REVIEW→APPROVED/REJECTED → applicant status email attempted (logged);
  document signed-URL view is admin-only + short-lived.
- [ ] Inquiries: list, mark read, internal reply note sets REPLIED; archived
  not silently un-archived (known L2 concern — verify).
- [ ] Residents/Leases: create lease attaching tenant(s), primary resident
  invariant; **active-lease uniqueness** (one ACTIVE per property and per
  tenant) holds — incl. the concurrent path (partial unique index landed in
  acceptance work); edit lease preserves resident history (M3 concern).
- [ ] Maintenance queue: filters (status/priority/category) + pagination work
  server-side; update status sets `resolvedAt`/`cancelledAt`; notes save.
- [ ] Settings page is honestly read-only (no fake controls).

### E. Authorization matrix (anon / tenant / admin)
- [ ] Every `/admin/*` page and `/api/admin/*` route: tenant blocked
  (redirect for pages, 401 for APIs), anon redirected.
- [ ] Per-page admin guards beat the 60s middleware role cache (revoked admin
  blocked on client-side nav) — re-confirm from perf pass.
- [ ] IDOR: tenant cannot fetch another user's application, maintenance
  request, or document by guessed id; application documents need auth.
- [ ] Known gap to characterize: application POST has **no ACTIVE-property
  gate** (still `findUnique` by id). Verify whether a DRAFT/RENTED property
  can receive a public application; report the real-world impact.

### F. Cross-cutting realism checks
- [ ] Money (Decimal) and dates render correctly everywhere (no `[object]`,
  no raw cents, sensible timezones).
- [ ] Empty states (no listings/apps/inquiries/requests) render, not crash.
- [ ] Error shapes are `{ message }`; validation errors are user-readable.
- [ ] Mobile viewport spot-check on 2–3 key pages.

## Testing mechanics
- Static suite first as a baseline: `tsc` / `lint` / `npm run test` / `build`.
- Then the scripted flows above, capturing evidence (status codes, snapshot
  text, screenshots, Resend delivery status, DB row checks).
- Findings logged as: AREA — severity (Blocker/High/Med/Low/Polish) — repro —
  observed vs expected.

## Cleanup & safety
- All test artifacts tagged `e2e-test-*`; deleted at end (DB rows + any
  uploaded storage objects + disposable auth users).
- Final proof: queries returning zero `e2e-test-*` rows in users, properties,
  leases, lease_residents, applications, application_documents,
  contact_inquiries, maintenance_requests.
- `.env.local` untouched; real admin untouched; no commits unless a reviewer-
  approved trivial fix is made (separately, with its own message).

## Out of scope
- Building missing features (price/amenity filters, applicant-email domain,
  profile page, analytics).
- Load/performance benchmarking (covered by the perf pass).
- Fixing discovered bugs beyond reviewer-pre-approved trivial ones — bugs are
  reported for separate plan-gated work.
- Production/CD, domain verification.

Reviewer: approve scope, the live-DB test-data decision, and whether trivial
fixes may be applied inline, before execution.
