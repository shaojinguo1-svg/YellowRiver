# Plan: Pre-Acceptance Blocker Remediation

## Goal
Resolve the blockers found during pre-acceptance verification without changing business code or silently mutating production-like data.

Current target:
- Supabase project host: `lvhmgdoxbkyitqsobukn.supabase.co`
- DB host: `db.lvhmgdoxbkyitqsobukn.supabase.co:5432`
- Database/schema: `postgres` / `public`

Known blockers:
- `prisma migrate deploy` fails with `P3005` because the target DB schema is non-empty and not baselined in `_prisma_migrations`.
- All 5 committed Prisma migrations remain pending.
- `application-documents` Storage bucket is currently `public=true`; acceptance requires it to be private.
- Lease/resident, maintenance, upload token cleanup/quota, RLS/revoke, document E2E, and browser/auth fixture checks are blocked until migrations and Storage posture are fixed.

This plan is for reviewer approval only. Do not change business code, apply migrations, baseline Prisma migration history, or change Supabase Storage settings until this plan is approved.

## Safety Rules
- Do not reset, drop, truncate, overwrite, or recreate the target database unless the owner explicitly approves that as a separate decision.
- Do not blindly mark all migrations as applied.
- Do not mark a migration as applied unless the target DB already contains the exact schema/data posture represented by that migration.
- Do not silently resolve duplicate or conflicting production data.
- Stop and request reviewer/owner decision if the current schema does not cleanly match a safe baseline path.
- Do not expose private tables or Storage buckets to public Supabase client/Data API access.
- Do not start Stage 4 durable rate limiting.
- Do not add business features or product UI changes.

## Changes
- [x] `PLAN.md` — document the blocker remediation plan.
- [ ] Business code — no changes in this remediation plan.
- [ ] Prisma schema/migration files — no new schema changes planned; only existing committed migrations may be deployed after safe baseline approval.
- [ ] Supabase database — after approval, perform controlled inventory, optional Prisma migration baseline, and migration deploy only if the schema match is confirmed.
- [ ] Supabase Storage — after approval, make `application-documents` private and verify signed server-side upload/download still works.

## Stage 1: Read-Only Database Inventory
Before any migration or baseline action, record the current state of the target DB.

Commands to record:
```bash
node -v
npm -v
git rev-parse --short HEAD
git status --short --branch
set -a; source .env.local; set +a; npx prisma migrate status
```

Record existing public tables:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Record whether Prisma migration history exists:
```sql
SELECT to_regclass('public._prisma_migrations') AS prisma_migrations_table;
```

Record row counts before any migration/baseline action. If a table is missing, record it as missing rather than creating it:
```sql
SELECT 'users' AS table_name, COUNT(*)::bigint AS row_count FROM public.users
UNION ALL SELECT 'properties', COUNT(*)::bigint FROM public.properties
UNION ALL SELECT 'property_images', COUNT(*)::bigint FROM public.property_images
UNION ALL SELECT 'rental_applications', COUNT(*)::bigint FROM public.rental_applications
UNION ALL SELECT 'application_documents', COUNT(*)::bigint FROM public.application_documents
UNION ALL SELECT 'contact_inquiries', COUNT(*)::bigint FROM public.contact_inquiries;
```

If the newer tables already exist, also record:
```sql
SELECT 'leases' AS table_name, COUNT(*)::bigint AS row_count FROM public.leases
UNION ALL SELECT 'lease_residents', COUNT(*)::bigint FROM public.lease_residents
UNION ALL SELECT 'maintenance_requests', COUNT(*)::bigint FROM public.maintenance_requests
UNION ALL SELECT 'application_upload_tokens', COUNT(*)::bigint FROM public.application_upload_tokens;
```

Record current schema shape for comparison with committed migrations:
```sql
SELECT table_name, column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

Record existing indexes and constraints:
```sql
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

```sql
SELECT
  conname,
  conrelid::regclass::text AS table_name,
  contype,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
ORDER BY table_name, conname;
```

Record current enum values:
```sql
SELECT t.typname, e.enumlabel
FROM pg_type t
JOIN pg_enum e ON e.enumtypid = t.oid
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
ORDER BY t.typname, e.enumsortorder;
```

Record RLS and direct grants for relevant tables if they exist:
```sql
SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN (
    'leases',
    'lease_residents',
    'maintenance_requests',
    'application_upload_tokens',
    'application_documents',
    'contact_inquiries'
  )
ORDER BY c.relname;
```

```sql
SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated')
  AND table_name IN (
    'leases',
    'lease_residents',
    'maintenance_requests',
    'application_upload_tokens',
    'application_documents',
    'contact_inquiries'
  )
ORDER BY table_name, grantee, privilege_type;
```

Record Storage bucket posture:
```sql
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id IN ('property-images', 'application-documents')
ORDER BY id;
```

## Stage 2: Schema Match And Baseline Decision
Compare the read-only inventory against the committed Prisma schema and the 5 committed migrations:
- `20260521120000_private_application_documents`
- `20260528110000_resident_portal_foundation`
- `20260528160000_maintenance_request_foundation`
- `20260529100000_security_remediation_stage_1`
- `20260529170000_lease_active_invariant_and_resident_history`

Use the inventory to determine which migrations, if any, are already represented in the target DB.

Safe baseline rule:
- If a migration's full effect is already present in the DB, it may be marked as applied with `prisma migrate resolve --applied <migration_name>`.
- If a migration's effect is not present, do not mark it as applied.
- If a migration is partially present, stop and request reviewer decision before continuing.

Expected likely outcome based on initial verification:
- The DB appears to contain an older pre-migration app schema.
- `_prisma_migrations` appears to be missing.
- Newer tables such as `leases`, `lease_residents`, `maintenance_requests`, and `application_upload_tokens` appear to be missing.
- If confirmed, no existing committed migration should be marked applied unless its changes are already present.

If no committed migration cleanly matches the current DB state, stop and ask the reviewer/owner to choose one remediation path:
- Create and review an explicit initial baseline migration representing the current DB state, then deploy the 5 committed migrations.
- Use a fresh empty Supabase database for acceptance, then run `prisma migrate deploy`.
- Approve a controlled manual application/baseline sequence for the existing DB.
- Approve a destructive reset/drop only as a separate explicit owner decision.

Do not proceed with `prisma migrate resolve` or `prisma migrate deploy` if the chosen baseline path is unclear.

## Stage 3: Prisma Baseline And Migration Deploy
Only after Stage 1 inventory is recorded and Stage 2 confirms a safe baseline path:

If one or more migrations are already fully represented in DB, mark only those exact matching migrations as applied:
```bash
set -a; source .env.local; set +a; npx prisma migrate resolve --applied <migration_name>
```

Before applying the Stage 2 active lease invariant migration, run the duplicate ACTIVE lease preflight if `leases` exists:
```sql
SELECT property_id, COUNT(*), array_agg(id)
FROM leases
WHERE status = 'ACTIVE'
GROUP BY property_id
HAVING COUNT(*) > 1;
```

If any rows are returned:
- Stop immediately.
- Record the conflicting `property_id` values and lease ids.
- Do not auto-pick, merge, delete, cancel, or edit leases without explicit owner approval.

If the baseline is safe and the duplicate preflight is clear, deploy remaining migrations:
```bash
set -a; source .env.local; set +a; npx prisma migrate deploy
```

Record after-state:
```bash
set -a; source .env.local; set +a; npx prisma migrate status
```

Confirm expected tables exist:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'leases',
    'lease_residents',
    'maintenance_requests',
    'application_upload_tokens',
    'application_documents',
    'contact_inquiries'
  )
ORDER BY table_name;
```

Confirm the active lease partial unique index exists:
```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'leases'
  AND indexdef ILIKE '%WHERE%status%ACTIVE%';
```

Confirm RLS/revoke posture for resident and maintenance tables:
```sql
SELECT c.relname, c.relrowsecurity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('leases', 'lease_residents', 'maintenance_requests')
ORDER BY c.relname;
```

```sql
SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated')
  AND table_name IN ('leases', 'lease_residents', 'maintenance_requests')
ORDER BY table_name, grantee, privilege_type;
```

Expected direct grants result for these tables: no rows unless the app intentionally uses Supabase Data API for them, which Phase 5/6 did not.

## Stage 4: Make `application-documents` Bucket Private
After approval, make the bucket private through one controlled path.

Preferred Dashboard path:
- Supabase Dashboard → Storage → Buckets → `application-documents` → Settings.
- Turn off public bucket access.
- Do not change allowed MIME types or file size limit unless they already differ from the app's expected values.
- Record the dashboard change time and before/after bucket settings.

Controlled SQL fallback if reviewer approves direct SQL:
```sql
UPDATE storage.buckets
SET public = false
WHERE id = 'application-documents'
RETURNING id, name, public, file_size_limit, allowed_mime_types;
```

Controlled API fallback if reviewer approves service-role API:
```bash
node scripts-or-oneoff-storage-private-check.js
```

If using an API helper, it must:
- Use `SUPABASE_SERVICE_ROLE_KEY` server-side only.
- Preserve existing bucket size/MIME settings.
- Print only bucket id/name/public status, not secrets.

Verify after change:
```sql
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'application-documents';
```

Then verify server-side document paths:
- Signed upload URL can still be issued through `/api/application-documents/upload-url`.
- Application submit can validate Storage object size/type/magic bytes.
- Admin signed document URL still works.
- Admin signed document URL still forces attachment/download behavior.
- No public URL or client-side Supabase read path is required.

## Stage 5: Resume Pre-Acceptance Verification
After migrations are deployed/baselined and `application-documents` is private, resume the approved pre-acceptance checklist.

Re-run static verification:
```bash
npx prisma validate
npx prisma generate
npx tsc --noEmit
npm run lint
npm run build
```

Re-check GitHub CI on `codex/phase-1-launch-security`.

Resume manual/security checks:
- Public listing and property API checks.
- Inquiry active/non-active property checks.
- Archived inquiry internal note status preservation.
- Lease/resident create/update/history/concurrency checks.
- Maintenance submit/list/cancel/admin update checks.
- Application document valid/disguised/oversized/quota/cleanup/download checks.
- Auth/browser checks for admin and tenant sessions.
- Email best-effort and missing-env behavior checks without logging secrets.

Record for the reviewer:
- Target Supabase project/database.
- Before/after migration status.
- Before/after Storage bucket privacy.
- Exact commands and SQL run.
- Any dashboard changes made.
- Completed manual checks.
- Blocked checks and exact reason.

## Testing
This planning step has no code tests because it changes only `PLAN.md`.

After reviewer approves remediation and the DB/Storage changes are performed, verify:
- `npx prisma validate`
- `npx prisma generate`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npx prisma migrate status`
- Storage bucket privacy query for `application-documents`
- The full resumed pre-acceptance manual/security checklist

## Out Of Scope
- Stage 4 durable rate limiting.
- Business feature changes.
- UI redesign.
- Schema changes beyond applying existing committed migrations after a safe baseline path is approved.
- New migrations unless reviewer decides an explicit baseline migration is required.
- Destructive DB reset, drop, truncate, or overwrite without separate explicit owner approval.
- Public Supabase client reads/writes for protected tables or application documents.

## Notes
- The current blocker is not a code build failure; CI and local static verification are already green.
- Prisma `P3005` is a migration-history/baseline problem on a non-empty DB.
- If current DB state does not exactly match any committed migration boundary, the safest next action is to stop and get a reviewer/owner decision rather than forcing `migrate resolve`.
- Making `application-documents` private is required for acceptance and should be verified independently from Prisma migration deployment.

## Reviewer Decision Requested
Reviewer should approve this blocker remediation plan before any Prisma baseline action, migration deployment, Supabase Storage privacy change, or resumed final acceptance testing.
