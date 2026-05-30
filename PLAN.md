# Plan: Explicit Baseline Migration

## Goal
Create a reviewed explicit Prisma baseline migration for the current target Supabase database state, then use it to unblock normal Prisma migration deployment.

Reviewer decision: use remediation path 1.

Target:
- Supabase project host: `lvhmgdoxbkyitqsobukn.supabase.co`
- DB host: `db.lvhmgdoxbkyitqsobukn.supabase.co:5432`
- Database/schema: `postgres` / `public`

This plan is for reviewer approval only. Do not create/apply the baseline, run `prisma migrate resolve`, run `prisma migrate deploy`, change Storage settings, or mutate the DB until reviewer approves this plan.

## Baseline Migration
Planned migration name:

```text
20260521000000_current_supabase_baseline
```

Planned file:

```text
prisma/migrations/20260521000000_current_supabase_baseline/migration.sql
```

Purpose:
- Represent the current target DB schema as it exists before the 5 committed migrations.
- Provide a Prisma migration-history baseline so the existing non-empty DB can safely continue with normal `prisma migrate deploy`.
- Be earlier than `20260521120000_private_application_documents`.
- Contain current DB state only. It must not include Stage 1/2/3 security changes, resident/lease tables, maintenance tables, upload-token tables, or Storage bucket changes.

Current inventory the baseline must represent:
- Existing public tables: `amenities`, `application_documents`, `categories`, `contact_inquiries`, `properties`, `property_amenities`, `property_images`, `rental_applications`, `site_settings`, `users`.
- `_prisma_migrations` does not exist.
- Missing newer tables: `leases`, `lease_residents`, `maintenance_requests`, `application_upload_tokens`.
- `application_documents.url` is currently `NOT NULL`.
- `application_documents.category` is currently missing.
- `contact_inquiries.property_id` exists but currently has no FK to `properties`.
- Existing enums are old app enums only: `ApplicationStatus`, `InquiryStatus`, `LeaseTermType`, `ListingType`, `PropertyStatus`, `PropertyType`, `UserRole`.

## Baseline SQL Generation And Review
Generate the baseline SQL from the current read-only inventory, then review it before committing.

Preferred generation approach:
- Use `prisma migrate diff` from empty to the current target DB URL to generate schema SQL.
- Keep the generated SQL limited to the current app schema state.
- Review the SQL against the Stage 1 inventory before committing it.

Planned generation command:

```bash
BASELINE_NAME=20260521000000_current_supabase_baseline
mkdir -p prisma/migrations/$BASELINE_NAME
set -a; source .env.local; set +a
npx prisma migrate diff --from-empty --to-url "$DIRECT_URL" --script > prisma/migrations/$BASELINE_NAME/migration.sql
```

Fallback generation approach if Prisma diff output is incomplete or noisy:

```bash
BASELINE_NAME=20260521000000_current_supabase_baseline
mkdir -p prisma/migrations/$BASELINE_NAME
set -a; source .env.local; set +a
pg_dump "$DIRECT_URL" \
  --schema-only \
  --schema=public \
  --no-owner \
  --no-privileges \
  --exclude-table=public._prisma_migrations \
  > prisma/migrations/$BASELINE_NAME/migration.sql
```

Review requirements:
- Confirm the baseline creates only the current public app schema objects represented by inventory.
- Confirm it does not create `application_upload_tokens`.
- Confirm it does not create `leases`, `lease_residents`, or `maintenance_requests`.
- Confirm it does not add `application_documents.category`.
- Confirm it does not make `application_documents.url` nullable.
- Confirm it does not add the `contact_inquiries.property_id -> properties.id` FK.
- Confirm it does not add `ApplicationDocumentCategory`, `LeaseStatus`, or maintenance enums.
- Confirm it does not include auth schema objects, storage schema objects, secrets, data rows, or `_prisma_migrations` rows.
- If generated SQL includes unrelated Supabase-managed schemas or partial future changes, stop and revise the baseline SQL before review.

## Exact Command Sequence
After reviewer approves this plan:

1. Add the baseline migration file.

```bash
BASELINE_NAME=20260521000000_current_supabase_baseline
mkdir -p prisma/migrations/$BASELINE_NAME
set -a; source .env.local; set +a
npx prisma migrate diff --from-empty --to-url "$DIRECT_URL" --script > prisma/migrations/$BASELINE_NAME/migration.sql
```

2. Review baseline SQL against the inventory and adjust only if needed to match current DB state.

3. Run local static verification.

```bash
npx prisma validate
npx prisma generate
npx tsc --noEmit
npm run lint
npm run build
```

4. Commit and push the baseline migration for reviewer approval.

```bash
git add prisma/migrations/20260521000000_current_supabase_baseline/migration.sql PLAN.md
git commit -m "Add current Supabase baseline migration"
git push origin codex/phase-1-launch-security
```

5. After reviewer approves the baseline migration commit, mark only the new baseline migration as applied.

```bash
set -a; source .env.local; set +a
npx prisma migrate resolve --applied 20260521000000_current_supabase_baseline
```

6. Run required pre-deploy checks.

7. Deploy the existing 5 committed migrations.

```bash
set -a; source .env.local; set +a
npx prisma migrate deploy
```

8. Record final migration status.

```bash
set -a; source .env.local; set +a
npx prisma migrate status
```

Do not mark any of the existing 5 migrations as applied manually.

## Pre-Deploy Checks
Run these checks after resolving the baseline as applied and before `prisma migrate deploy`.

Confirm pending migration status:

```bash
set -a; source .env.local; set +a
npx prisma migrate status
```

Expected:
- `20260521000000_current_supabase_baseline` is applied.
- These 5 migrations are still pending:
  - `20260521120000_private_application_documents`
  - `20260528110000_resident_portal_foundation`
  - `20260528160000_maintenance_request_foundation`
  - `20260529100000_security_remediation_stage_1`
  - `20260529170000_lease_active_invariant_and_resident_history`

Confirm `application_documents.category` is still missing:

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'application_documents'
  AND column_name = 'category';
```

Confirm `application_upload_tokens` is still missing:

```sql
SELECT to_regclass('public.application_upload_tokens') AS application_upload_tokens;
```

Confirm resident/maintenance tables are still missing:

```sql
SELECT
  to_regclass('public.leases') AS leases,
  to_regclass('public.lease_residents') AS lease_residents,
  to_regclass('public.maintenance_requests') AS maintenance_requests;
```

If `leases` already exists unexpectedly before deploy, run the Stage 2 duplicate ACTIVE lease preflight before applying the active-lease partial unique index migration:

```sql
SELECT property_id, COUNT(*), array_agg(id)
FROM leases
WHERE status = 'ACTIVE'
GROUP BY property_id
HAVING COUNT(*) > 1;
```

If any pre-deploy check does not match expectations, stop and ask reviewer before deploying migrations.

## Post-Deploy Checks
After `prisma migrate deploy`, verify:

- All 5 existing committed migrations are applied.
- `npx prisma migrate status` reports database schema is up to date.
- `application_upload_tokens` exists.
- `application_documents.category` exists.
- `application_documents.url` is nullable.
- `leases` exists.
- `lease_residents` exists.
- `maintenance_requests` exists.
- RLS is enabled and direct `anon`/`authenticated` grants are revoked for:
  - `leases`
  - `lease_residents`
  - `maintenance_requests`
- `contact_inquiries.property_id -> properties.id` FK exists with `ON DELETE SET NULL` and `ON UPDATE CASCADE`.
- Active lease partial unique index exists:
  - `leases_one_active_per_property_key`

Suggested SQL:

```sql
SELECT migration_name, finished_at
FROM public._prisma_migrations
ORDER BY started_at;
```

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'application_upload_tokens',
    'leases',
    'lease_residents',
    'maintenance_requests'
  )
ORDER BY table_name;
```

```sql
SELECT column_name, is_nullable, udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'application_documents'
  AND column_name IN ('url', 'category')
ORDER BY column_name;
```

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

```sql
SELECT conname, conrelid::regclass::text AS table_name, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
  AND conrelid = 'public.contact_inquiries'::regclass
ORDER BY conname;
```

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'leases'
  AND indexname = 'leases_one_active_per_property_key';
```

## Storage Step After Migration
After migrations are applied and post-deploy DB checks pass, make `application-documents` private.

Preferred path:
- Supabase Dashboard → Storage → Buckets → `application-documents` → Settings.
- Turn off public bucket access.
- Keep existing size limit and allowed MIME types unless reviewer approves a change.
- Record before/after bucket settings and time of change.

Controlled SQL fallback if reviewer approves direct SQL:

```sql
UPDATE storage.buckets
SET public = false
WHERE id = 'application-documents'
RETURNING id, name, public, file_size_limit, allowed_mime_types;
```

Verify:

```sql
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'application-documents';
```

Then verify server-side paths still work:
- Application document signed upload URL can be issued.
- Application submit validates Storage object size/MIME/magic bytes.
- Admin signed document download URL works.
- Admin signed URL forces attachment/download behavior.
- No public bucket access or public Supabase client document read path is required.

## Resume Pre-Acceptance Verification
After the baseline is resolved, migrations are deployed, and the Storage bucket is private, resume the approved pre-acceptance checklist:

```bash
npx prisma validate
npx prisma generate
npx tsc --noEmit
npm run lint
npm run build
```

Then continue manual/security checks for:
- Public listings and property API.
- Inquiries.
- Leases/residents.
- Maintenance requests.
- Application document upload/download hardening.
- Auth/browser fixtures.
- Email best-effort behavior.

## Out Of Scope
- No Stage 4 durable rate limiting.
- No business feature changes.
- No UI redesign.
- No reset/drop/truncate/destructive DB action.
- No marking the existing 5 migrations as applied manually.
- No Supabase Storage change before baseline/migration reviewer approval.
- No schema change other than adding the reviewed baseline migration file and then applying existing committed migrations.

## Testing
This planning step changes only `PLAN.md`; no code tests are required now.

When the baseline migration file is created in the next approved step, run:
- `npx prisma validate`
- `npx prisma generate`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`

After migration deployment, run:
- `npx prisma migrate status`
- post-deploy SQL checks listed above
- full resumed pre-acceptance verification checklist

## Reviewer Decision Requested
Reviewer should approve this explicit baseline migration plan before creating the baseline migration file, marking the baseline as applied, deploying existing migrations, changing `application-documents` bucket privacy, or resuming final acceptance verification.
