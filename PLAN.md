# Plan: Final Acceptance Fixes

## Goal
Close the remaining issues found during final manual acceptance before merge/deploy:

1. Direct rental application API submissions must not be accepted for non-ACTIVE properties.
2. Public listing data should not include obvious test/demo garbage properties such as `12345-123`.
3. Clarify that tenant account provisioning is not yet implemented in the admin UI and should be handled as a later feature phase, not as a hidden launch requirement.

This is a narrow final hardening and data-readiness phase. It should not add billing, rent payments, account provisioning, large UI changes, or new infrastructure.

## Changes
- [ ] `src/app/api/applications/route.ts` - change the POST property lookup so it only accepts properties with `status: "ACTIVE"`; return the existing `{ message: "Property not found" }` shape for missing or non-active properties.
- [ ] Tests - add or update focused coverage for the rental application property-status gate if it can be done without requiring real Supabase/Storage/database secrets. If route-level testing would require too much runtime mocking, add a small extracted helper and unit test that proves the status decision.
- [ ] Acceptance data - remove or deactivate the active test property `12345-123` in the target Supabase database before final public acceptance. Prefer changing its status away from `ACTIVE` over deleting if it has related rows or audit value.
- [ ] Documentation/acceptance notes - record the intended current tenant flow: tenants must already exist as Supabase/Auth users before admin can attach them to a lease in `/admin/residents`. Admin-side tenant account creation is deferred.

## Expected Behavior
- Public listing pages still show only ACTIVE properties.
- Direct `POST /api/applications` calls for DRAFT, INACTIVE, ARCHIVED, or RENTED properties are rejected.
- Existing valid applications for ACTIVE properties continue working.
- API error responses continue using `{ message: "..." }`.
- The public site no longer shows `12345-123` or similar acceptance/test property data.
- The launch checklist clearly distinguishes implemented resident/lease assignment from future tenant-account provisioning.

## Testing
Local static verification:

```bash
npx prisma validate
npx prisma generate
npx tsc --noEmit
npm run test
npm run lint
npm run build
```

Docker verification:

```bash
npm run verify:docker
```

Manual/browser checks after implementation:
- Visit `/`, `/listings`, and at least one real `/listings/[slug]`; confirm the test property is not visible.
- Submit or smoke-check a normal application for an ACTIVE property.
- Attempt a direct application POST using a non-ACTIVE property id and confirm it rejects with `{ message: "Property not found" }`.
- Confirm admin `/admin/residents` still loads and still supports lease assignment to existing tenant users.
- Confirm tenant with active lease still sees resident portal, and tenant without active lease still sees application dashboard.

Database/data checks:

```sql
select slug, title, status
from properties
where slug = '12345-123';
```

Expected final state: no row, or `status <> 'ACTIVE'`.

## Out Of Scope
- No rent ledger, bills, invoices, Stripe, ACH, or rent payments.
- No admin UI for creating Supabase/Auth tenant accounts.
- No new Supabase RLS/Data API policy changes.
- No schema changes unless implementation discovers the application-status gate cannot be safely tested without a tiny helper extraction.
- No Storage/document upload changes.
- No maintenance feature changes.
- No email changes.
- No large UI redesign.
- No Stage 4 durable rate limiting work.

## Notes
- The current resident portal foundation is lease-first: admin can attach existing tenant users to leases, and those tenants then see current residence and maintenance features.
- Tenant account provisioning remains a real product gap for a future phase. It should be planned separately because it needs Supabase Auth admin flows, password/invite handling, email behavior, and role safety decisions.
- If modifying target Supabase data is approved, use a narrow, reversible update for `12345-123` and do not reset, truncate, or delete unrelated data.

Reviewer decisions requested:
- Approve implementing the application POST ACTIVE-only gate.
- Approve deactivating the target Supabase `12345-123` test property before final public acceptance.
- Confirm tenant account provisioning should be a separate post-acceptance phase rather than part of this final fix.
