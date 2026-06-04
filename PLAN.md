# Plan: Final Acceptance Blocker Remediation

## Goal
Resolve the remaining final acceptance blockers without expanding product scope:

1. Direct rental application API submissions must only accept ACTIVE properties.
2. Property image listing by property id must be admin-only.
3. The target Supabase acceptance data must not expose the test/demo property `12345-123` as ACTIVE.
4. Direct vulnerable dependencies must be updated to the approved target versions.
5. Bootstrap scripts and README tenant-flow documentation must be reliable enough for acceptance.

This is a focused remediation pass. It must not introduce billing, payments, tenant invitation UI, new feature phases, broad dependency modernization, or unrelated UI/API changes.

## Changes
### 1. Application POST ACTIVE-only gate

- [ ] `src/app/api/applications/route.ts` - change the application POST property lookup from "property exists by id" to "property exists by id and `status: \"ACTIVE\"`".
- [ ] Preserve the current rejection shape for missing or non-ACTIVE properties:

```json
{ "message": "Property not found" }
```

- [ ] Keep server-side derivation and document validation behavior unchanged.
- [ ] Do not add application claiming, tenant conversion, email changes, or schema changes.

### 2. Property image list endpoint admin-only

- [ ] `src/app/api/properties/[id]/images/route.ts` - require admin authorization for `GET`, matching the image management behavior of POST/update/delete/reorder routes.
- [ ] Preserve existing API error style, especially:

```json
{ "message": "Unauthorized" }
```

- [ ] Do not create a replacement public by-id image API. Public listing/detail pages should continue using existing server-side ACTIVE property queries.

### 3. Acceptance data cleanup for `12345-123`

- [ ] Target Supabase project/database only after reviewer approval.
- [ ] Confirm the current row before mutation:

```sql
select id, slug, title, status
from properties
where slug = '12345-123';
```

- [ ] If the row exists and is ACTIVE, update only that row away from ACTIVE. Prefer `INACTIVE` to preserve related rows and avoid deleting acceptance history:

```sql
update properties
set status = 'INACTIVE',
    updated_at = now()
where slug = '12345-123'
  and status = 'ACTIVE';
```

- [ ] Re-check the row after mutation and record that `status <> 'ACTIVE'`.
- [ ] Do not reset, drop, truncate, or delete unrelated data.

### 4. Dependency audit remediation

- [ ] `package.json` / `package-lock.json` - update only the approved direct dependency targets:
  - `next` -> `16.2.7`
  - `eslint-config-next` -> `16.2.7`
  - `prisma` -> `7.8.0`
  - `@prisma/client` -> `7.8.0`
  - `@prisma/adapter-pg` -> `7.8.0`
  - `resend` -> `6.12.4`
- [ ] Do not do broad dependency modernization.
- [ ] If the targeted install reveals a required compatibility issue outside this list, stop and ask reviewer before expanding dependency scope.
- [ ] Re-run npm audit and document remaining findings, including whether remaining findings are dev-only/transitive or production-impacting.

### 5. Bootstrap scripts and tenant-flow documentation

Reviewer preference is to fix the scripts if the change stays small.

- [ ] Add `tsx` as a direct devDependency if needed for reliable TypeScript script execution.
- [ ] `package.json` / `package-lock.json` - add supported script runners:
  - `admin:create`
  - `tenant:create`
  - `storage:setup`
  - `seed:properties`
- [ ] `scripts/create-admin.ts` - replace brittle generated-client `.js` import with a stable TS-compatible import path.
- [ ] `scripts/create-tenant.ts` - same generated-client import fix.
- [ ] `scripts/seed-properties.ts` - same generated-client import fix and keep demo image behavior unchanged unless dependency/script execution requires otherwise.
- [ ] `scripts/setup-storage.ts` - make README/package usage match the supported script path; do not require undocumented `npx tsx` usage.
- [ ] Keep scripts server-side/service-role only, with clear env requirements and no secret printing.
- [ ] `README.md` - document the current tenant flow:
  - Tenant flow is lease-first.
  - Tenant must exist as Supabase/Auth plus app `users` row with role `TENANT`.
  - Tenant can self-register via `/register`, or be created by the supported bootstrap script if the script fix is included.
  - Admin then goes to `/admin/residents` and attaches the existing TENANT user to a lease.
  - Tenant sees the resident portal only after an ACTIVE lease exists.
  - Admin tenant invitation/account creation UI is deferred to a later phase.

## Expected Behavior
- Direct `POST /api/applications` rejects missing, DRAFT, INACTIVE, ARCHIVED, or RENTED property ids with `{ "message": "Property not found" }`.
- Direct `POST /api/applications` still accepts ACTIVE property ids when the rest of the application payload and uploads are valid.
- Unauthenticated `GET /api/properties/[id]/images` returns an unauthorized response.
- Admin image management continues to work.
- The public site no longer exposes the `12345-123` test/demo property as ACTIVE.
- Approved dependency updates remove or reduce direct vulnerable package findings for `next`, Prisma, and `resend`.
- Bootstrap scripts have documented package scripts and no longer rely on a generated `client.js` file that Prisma does not emit.
- README clearly describes the current lease-first tenant/resident flow and defers admin invitation UI.

## Testing
Static/local verification:

```bash
npx prisma validate
npx prisma generate
npx tsc --noEmit
npm run test
npm run lint
npm run build
```

Dependency/audit verification:

```bash
npm audit --json
npm audit --omit=dev --json
```

Record a concise summary of:
- total remaining vulnerabilities
- production versus dev-only findings
- any remaining direct vulnerable package findings
- whether the approved `next`, Prisma, and `resend` direct findings are resolved

Docker verification:

```bash
npm run verify:docker
```

Database check:

```sql
select slug, title, status
from properties
where slug = '12345-123';
```

Expected final state: no row, or `status <> 'ACTIVE'`.

API smoke:
- Non-ACTIVE property application POST rejects with `{ "message": "Property not found" }`.
- ACTIVE property application POST still works with a valid payload/upload flow.
- Unauthenticated `GET /api/properties/[id]/images` rejects.
- Admin image management still works.

Manual UI smoke:
- `/`, `/listings`, and at least one `/listings/[slug]`.
- Application form plus document upload.
- Admin applications/documents.
- Admin residents/leases.
- Tenant dashboard with active lease.
- Tenant dashboard without active lease.
- Maintenance submit/cancel/admin update.

## Out Of Scope
- No rent ledger.
- No billing.
- No rent payments.
- No Stripe/ACH.
- No admin tenant invitation/account creation UI.
- No durable Redis/Upstash rate limiting.
- No Playwright/E2E implementation in this remediation pass.
- No schema changes unless an implementation blocker proves one is absolutely necessary and reviewer approves.
- No broad UI redesign.
- No Supabase RLS/Data API policy changes.
- No Storage behavior changes beyond verifying existing application upload flow.
- No broad dependency modernization outside the approved direct dependency targets.

## Notes
- The public property image GET will become admin-only per reviewer decision. Public listing image rendering should remain unaffected because public pages query ACTIVE property data server-side.
- The `12345-123` data change is a targeted acceptance-data remediation, not a migration. It should be executed only after reviewer approval and recorded with before/after SQL output.
- `npm audit` output should not be hidden. Remaining findings are acceptable only if documented and not launch-blocking per reviewer.
- If script repair becomes larger than the approved small fix, stop and ask reviewer whether to defer service-role bootstrap scripts and document `/register` as the only tenant creation path for this acceptance pass.

Reviewer should approve this plan before implementation or database mutation.
