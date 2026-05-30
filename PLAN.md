# Plan: Supabase Data API Lockdown Remediation

## Goal
Close direct Supabase Data API access for public app tables that should only be reached through server-side Prisma/API routes.

Reviewer acceptance found that anon REST probes currently return `200` for sensitive public tables:

- `users`
- `rental_applications`
- `application_documents`
- `application_upload_tokens`
- `contact_inquiries`
- `properties`
- `_prisma_migrations`

Newer resident and maintenance tables already have the intended posture:

- `leases`
- `lease_residents`
- `maintenance_requests`

This remediation should make the older public tables match the newer defense-in-depth model: no direct `anon` / `authenticated` table grants, RLS enabled, and app access continuing through server-side Prisma and Next API/server routes.

No DB mutation, migration deploy, business code change, Stage 4 rate limiting work, reset, drop, truncate, or Supabase-managed schema change should happen until reviewer approves this plan.

## Findings To Confirm Before Implementation
- [ ] Re-run code search for Supabase database client access:
  - `rg -n "\\.from\\(" src prisma scripts --glob '!node_modules'`
  - Expected: no `.from("users")`, `.from("properties")`, `.from("rental_applications")`, `.from("application_documents")`, `.from("application_upload_tokens")`, `.from("contact_inquiries")`, `.from("site_settings")`, or Prisma migration table Data API reads/writes.
  - Existing `.from(...)` calls are expected for Supabase Storage buckets such as `property-images` and `application-documents`; those are not table Data API access and should remain unchanged.
- [ ] Confirm public listing, contact inquiry, application, admin, tenant, resident, and maintenance workflows use Next server routes / Prisma for table data.
- [ ] Confirm `_prisma_migrations` exists in the target DB before applying lockdown SQL.
- [ ] Confirm target remains:
  - Supabase project host: `lvhmgdoxbkyitqsobukn.supabase.co`
  - DB host: `db.lvhmgdoxbkyitqsobukn.supabase.co:5432`
  - Database/schema: `postgres` / `public`

## Changes
- [ ] `PLAN.md` - record this reviewer-approved lockdown plan.
- [ ] `prisma/migrations/<timestamp>_supabase_data_api_lockdown/migration.sql` - add a Prisma migration that explicitly locks down direct Data API table access for current public app tables.

Planned protected public tables:

- `users`
- `properties`
- `property_images`
- `property_amenities`
- `amenities`
- `categories`
- `rental_applications`
- `application_documents`
- `application_upload_tokens`
- `contact_inquiries`
- `site_settings`
- `leases`
- `lease_residents`
- `maintenance_requests`
- `_prisma_migrations`

Migration behavior:

- Enable RLS on each listed public table as defense in depth.
- Revoke direct table privileges from `anon` and `authenticated` on each listed table.
- Include `_prisma_migrations` so migration metadata is not readable through Supabase REST.
- Do not create permissive RLS policies.
- Do not change Supabase-managed schemas such as `auth`, `storage`, `realtime`, `vault`, or `extensions`.
- Do not change Supabase Storage bucket settings in this remediation.
- Do not change app data, truncate tables, delete rows, or reset the DB.
- Preserve server-side Prisma access by limiting the revokes to Supabase API roles (`anon`, `authenticated`) rather than the database owner / Prisma connection role.

Planned SQL shape:

```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.users FROM anon, authenticated;

-- Repeat for each protected table, including public._prisma_migrations.
```

The implementation should prefer an explicit table list over broad schema-wide revokes so the diff is reviewable and does not accidentally affect future objects outside this plan.

## Expected Behavior
- Supabase Data API direct table probes using the public anon key no longer return `200` for protected app tables.
- Public website flows still work because they are served through Next server components/API routes and Prisma.
- Admin and tenant authenticated app flows still work because app authorization remains enforced in Next server/API logic, not client-side Supabase table access.
- Supabase Auth and Storage keep working:
  - Auth remains in Supabase-managed `auth` schema and is not changed.
  - Storage bucket operations continue through existing Storage APIs and server-side helpers.
- Server-side Prisma migrations and runtime queries continue to work through `DATABASE_URL` / `DIRECT_URL`.

## Verification
Run static verification after adding the migration:

```bash
npx prisma validate
npx prisma generate
npx tsc --noEmit
npm run lint
npm run build
```

Before DB deploy:

```bash
npx prisma migrate status
```

After reviewer approval and migration deploy:

```bash
npx prisma migrate deploy
npx prisma migrate status
```

SQL verification:

```sql
SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN (
    'users',
    'properties',
    'property_images',
    'property_amenities',
    'amenities',
    'categories',
    'rental_applications',
    'application_documents',
    'application_upload_tokens',
    'contact_inquiries',
    'site_settings',
    'leases',
    'lease_residents',
    'maintenance_requests',
    '_prisma_migrations'
  )
  AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee, privilege_type;
```

Expected: no rows.

```sql
SELECT c.relname, c.relrowsecurity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN (
    'users',
    'properties',
    'property_images',
    'property_amenities',
    'amenities',
    'categories',
    'rental_applications',
    'application_documents',
    'application_upload_tokens',
    'contact_inquiries',
    'site_settings',
    'leases',
    'lease_residents',
    'maintenance_requests',
    '_prisma_migrations'
  )
ORDER BY c.relname;
```

Expected: every listed table has `relrowsecurity = true`.

REST probe verification with anon key:

- `users` no longer returns `200`.
- `properties` no longer returns `200`.
- `rental_applications` no longer returns `200`.
- `application_documents` no longer returns `200`.
- `application_upload_tokens` no longer returns `200`.
- `contact_inquiries` no longer returns `200`.
- `_prisma_migrations` no longer returns `200`.
- Existing locked tables stay blocked:
  - `leases`
  - `lease_residents`
  - `maintenance_requests`

Product flow verification after deploy:

- ACTIVE public listing slug still renders through Next server route.
- Non-ACTIVE public listing slug still returns not found / noindex behavior.
- Public contact inquiry for an ACTIVE property still submits through Next API.
- Public rental application submit flow still works through Next API.
- Application document signed upload/download flow still works through server-side Storage helpers.
- Admin login/session still works.
- Tenant login/session still works.
- Admin lease/resident workflows still work.
- Tenant resident portal still works.
- Authenticated maintenance workflows still work.

## Out Of Scope
- No Stage 4 durable Redis/Upstash rate limiting.
- No new public Supabase policies unless implementation finds a real client-side Data API use and reviewer approves the exact policy.
- No business feature changes.
- No public Supabase client table reads/writes.
- No Supabase Auth schema changes.
- No Supabase Storage schema or bucket changes.
- No reset, drop, truncate, or destructive data cleanup.
- No Settings persistence, billing, payments, maintenance feature expansion, or UI redesign.

## Risks / Reviewer Decisions Needed
- Enabling RLS and revoking `anon` / `authenticated` direct grants is intentionally strict. If any hidden client-side Data API table use exists, the affected UI will fail until it is moved behind a server route or reviewer approves a minimal policy.
- `_prisma_migrations` lockdown should not affect Prisma when using the server-side DB connection role, but it must be verified with `prisma migrate status` after deploy.
- Public `properties`, `categories`, `amenities`, and property image data will no longer be accessible through Supabase REST. This is expected because the app already serves public listing data through Next/Prisma.
- Reviewer should approve this plan before creating/applying the lockdown migration or mutating the target DB.
