# Plan: Phase 6 Hardening Follow-up

## Goal
Address the reviewer follow-up findings from the Phase 6 maintenance request stack without expanding product scope.

This phase should make the existing implementation more reliable and operational by:
- preventing first-login user auto-sync race conditions;
- making the admin maintenance queue use server-side pagination and filters instead of a fixed first 100 records;
- removing or resolving the currently unused admin maintenance GET path;
- tightening small UX/performance issues found during review.

No business code should be changed until this follow-up plan is approved.

## Changes
- [ ] `src/lib/auth.ts` — make `getCurrentUser()` race-safe.
  - Replace the current `findUnique` then `create` auto-sync flow with a Prisma `upsert`, or equivalent create-with-unique-conflict-retry pattern.
  - Preserve existing behavior: Supabase-authenticated users without a Prisma record are still created as `TENANT` by default.
  - Do not change admin role assignment rules.
- [ ] `src/app/admin/maintenance/page.tsx` — move admin maintenance list to server-side pagination/filtering.
  - Read `page`, `status`, `priority`, and `category` from `searchParams`.
  - Use a bounded page size, such as 25 or 50.
  - Fetch both paginated rows and total count.
  - Do not silently hide records after the first 100.
- [ ] `src/app/admin/maintenance/maintenance-client.tsx` — align UI with server-side filtering and pagination.
  - Filter controls should update URL/search params or submit a GET form.
  - Add simple previous/next pagination controls.
  - Keep the selected detail panel in sync with the visible page.
  - If the currently selected request is not in the filtered page, select the first visible request or show the empty detail state.
  - Keep the compact admin tool style; no large redesign.
- [ ] `src/app/api/admin/maintenance-requests/route.ts` — resolve the unused GET route.
  - Preferred implementation: make the admin page use this route for server-backed list refresh only if it is genuinely needed.
  - Otherwise remove the unused GET handler and keep the server component Prisma query as the single admin list path.
  - Preserve `PATCH /api/admin/maintenance-requests/[id]` for updates.
- [ ] `src/app/(tenant)/dashboard/page.tsx` and/or `src/lib/maintenance-requests.ts` — avoid duplicate current active lease lookups.
  - Reuse the active lease already loaded on the dashboard when fetching tenant maintenance requests, or add a helper that accepts an existing lease resident record.
  - Preserve tenant scoping and continue excluding `adminNotes`.
- [ ] `src/app/api/tenant/maintenance-requests/route.ts` — consider lightweight rate limiting on authenticated POST.
  - Add rate limiting only if it fits the existing `checkRateLimit` helper without awkward new infrastructure.
  - Keep the endpoint authenticated and server-derived; do not add client-side Supabase writes.
  - If reviewer wants strict minimal scope, this item can be deferred.

## Expected Behavior
- First-time authenticated users can make concurrent requests without causing a Prisma unique constraint error or a 500.
- Admin maintenance queue can browse beyond the first 100 requests.
- Admin maintenance filters are server-backed and reflected in the URL.
- Admin detail panel never shows a hidden, filtered-out request as though it were part of the current queue.
- Tenant maintenance request functionality remains unchanged from a product perspective.
- Tenant responses still never include `adminNotes`.
- No new maintenance product features are introduced.

## Out of Scope
- Attachments/photos/storage.
- Tenant/admin comments or tenant-visible admin responses.
- Email/SMS/push notifications.
- Billing, rent ledger, rent payments, Stripe/ACH, invoices, receipts, balances.
- New maintenance statuses, categories, assignment, vendor, scheduling, or work orders.
- Public Supabase Data API access to maintenance tables.
- Major UI redesign.
- Changing Phase 5 lease data model.
- Changing admin role assignment workflow.
- CI workflow changes unless required by verification.

## Testing
- Run `npx prisma validate`.
- Run `npx prisma generate`.
- Run `npx tsc --noEmit`.
- Run `npm run lint`.
- Run `npm run build`.
- Manual/admin test: create enough maintenance requests, or seed enough rows, to verify pagination shows records beyond the first page.
- Manual/admin test: filter by status/priority/category and verify the URL, list, count, and detail panel stay in sync.
- Manual/admin test: update a request from a filtered page and verify the list/detail state remains coherent.
- Manual/auth test: simulate or reason through concurrent first-login requests and confirm `getCurrentUser()` cannot fail on duplicate `supabaseId`.
- Manual/tenant regression: active resident can still submit, list, and cancel only their own `OPEN` maintenance request.
- Security regression: tenant maintenance response payload still excludes `adminNotes`.

## Notes
- The key product fix is admin queue completeness: pagination and server-side filters should be solved together rather than only raising `take: 100`.
- The auth race fix is cross-cutting but small and safer to handle before more resident/admin workflows rely on `getCurrentUser()`.
- The admin GET API can stay only if the UI uses it. Keeping an unused list endpoint adds maintenance surface without current value.
- Rate limiting for authenticated maintenance POST is useful defense-in-depth, but not as urgent as the auth race and admin queue correctness.
