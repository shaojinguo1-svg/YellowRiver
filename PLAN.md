# Plan: Pre-Acceptance Verification

## Goal
Create a final verification checklist before acceptance for the work completed through Security Remediation Stage 3.

This plan covers environment readiness, Prisma/Supabase migration deployment, Supabase Storage/Auth configuration, and end-to-end product/security checks. Stage 4 durable rate limiting remains intentionally deferred until Redis/Upstash/deployment infrastructure is chosen.

This plan is for reviewer approval only. Do not deploy, run final acceptance testing, or change business code until the plan is approved.

## Changes
- [x] `PLAN.md` — replace the Stage 3 implementation plan with a pre-acceptance verification plan.
- [ ] Business code — no changes in this planning step.
- [ ] Database/schema — no changes in this planning step.
- [ ] CI/workflow — no changes in this planning step.

## Environment Verification
- Confirm `.env.local` exists only locally and is not committed.
- Confirm secrets are configured for the intended local/staging environment:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `DATABASE_URL`
  - `DIRECT_URL`
  - `RESEND_API_KEY`
  - `ADMIN_EMAIL`
  - `APPLICATION_UPLOAD_SIGNING_SECRET`
  - `NEXT_PUBLIC_APP_URL`
  - `NEXT_PUBLIC_APP_NAME`
- Confirm no secret values appear in tracked files, logs, shell history snippets committed to the repo, or GitHub Actions output.
- Confirm Node.js 22 is active for local verification.
- Confirm dependencies are installed from the lockfile with `npm ci` or an already clean equivalent install state.
- Confirm Prisma commands use the intended Supabase database, not a stale local or preview database.

## Migration Deployment Verification
- Apply all pending Prisma migrations to the intended Supabase database before acceptance testing.
- Before applying the Stage 2 active-lease uniqueness migration, run this duplicate preflight:

```sql
SELECT property_id, COUNT(*), array_agg(id)
FROM leases
WHERE status = 'ACTIVE'
GROUP BY property_id
HAVING COUNT(*) > 1;
```

- If the duplicate preflight returns any rows, stop the migration and resolve duplicates manually. Do not silently auto-pick, merge, or delete leases.
- Confirm required tables exist after migration:
  - `leases`
  - `lease_residents`
  - `maintenance_requests`
  - `application_upload_tokens`
  - `application_documents`
  - `contact_inquiries`
- Confirm the Stage 2 partial unique index exists and enforces one `ACTIVE` lease per `property_id`.
- Confirm RLS is enabled and direct `anon`/`authenticated` table access is revoked for:
  - `leases`
  - `lease_residents`
  - `maintenance_requests`
- Confirm application code still accesses these protected tables through server-side Prisma/API paths only.

## Supabase Storage Verification
- Confirm private buckets exist:
  - `property-images`
  - `application-documents`
- Confirm `application-documents` is private.
- Confirm application document signed upload works through the server API.
- Confirm admin document signed download works through the server API.
- Confirm admin document signed URLs force attachment/download behavior.
- Confirm no public bucket policy or client-side public read path was added for application documents.

## Auth/User Verification
- Create or confirm one admin user.
- Create or confirm one tenant user.
- Confirm admin role is stored in the app database and not trusted from user-editable `user_metadata`.
- Confirm tenant login works.
- Confirm admin login works.
- Confirm service-role keys remain server-only and are not available to browser code.

## Public Listing / Security Verification
- Confirm an `ACTIVE` property slug loads publicly.
- Confirm `DRAFT`, `INACTIVE`, `ARCHIVED`, and `RENTED` property slugs return not-found/noindex behavior.
- Confirm anonymous `GET /api/properties/[id]` is rejected.
- Confirm admin `GET /api/properties/[id]` works.
- Confirm the tenant dashboard only shows rental applications linked by `applicantId`, not by free-text email matching.

## Inquiry Verification
- Confirm a contact inquiry can be submitted for an `ACTIVE` property.
- Confirm a contact inquiry for a non-existent property id is rejected.
- Confirm a contact inquiry for a non-`ACTIVE` property id is rejected.
- Confirm saving an internal admin reply note on an `ARCHIVED` inquiry keeps it `ARCHIVED` unless an explicit valid status is changed.
- Confirm admin contact inquiry notification is best-effort: provider/env failures are logged concisely and do not break inquiry submission.

## Lease/Resident Verification
- Confirm admin can create a `DRAFT` lease.
- Confirm admin can create an `ACTIVE` lease.
- Confirm the database rejects a second `ACTIVE` lease for the same property.
- Confirm concurrent `ACTIVE` lease create/update attempts do not produce duplicate active leases.
- Confirm `updateLease` preserves retained `LeaseResident` rows, including historical fields.
- Confirm removed residents receive `moveOutDate` and no longer appear active.
- Confirm re-added residents reuse the same `leaseId`/`userId` row and clear `moveOutDate`.
- Confirm a tenant with an active lease sees the read-only resident summary.
- Confirm a tenant without an active lease keeps the existing dashboard behavior.
- Confirm a tenant cannot access another resident's lease data.

## Maintenance Verification
- Confirm an active tenant can submit a maintenance request.
- Confirm a tenant sees only their own submitted requests for their current active lease.
- Confirm tenant maintenance payloads never include `adminNotes`.
- Confirm a tenant can cancel only their own `OPEN` request.
- Confirm admin can list/filter/paginate maintenance requests.
- Confirm admin can update status, priority, category, and internal `adminNotes`.
- Confirm `resolvedAt` is set when status becomes `RESOLVED`.
- Confirm `cancelledAt` is set when status becomes `CANCELLED`.
- Confirm tenant route/API access cannot reveal another resident's maintenance data by guessed id.

## Application Document Verification
- Confirm valid PDF upload and submit succeeds.
- Confirm valid JPEG upload and submit succeeds.
- Confirm valid PNG upload and submit succeeds.
- Confirm disguised HTML/SVG/text content with allowed MIME/extension is rejected at submit.
- Confirm an oversized object is rejected at submit.
- Confirm more than 10 unconsumed pending upload tokens for the same `uploadSessionId` are blocked.
- Confirm expired unconsumed cleanup removes orphan Storage objects and token rows.
- Confirm cleanup never deletes consumed/submitted `ApplicationDocument` objects.
- Confirm cleanup logs only non-secret context.

## Email Verification
- With `RESEND_API_KEY` and `ADMIN_EMAIL` configured, confirm application confirmation/admin notification delivery is attempted.
- With `RESEND_API_KEY` and `ADMIN_EMAIL` configured, confirm contact inquiry admin notification delivery is attempted.
- Confirm missing optional email env causes skipped-delivery logs rather than import-time crashes or request failures.
- Confirm provider/send failures are logged with helper name and non-secret context only.
- Confirm no email API keys, recipient secrets, or provider response secrets appear in logs.

## Build/CI Verification
- Run `npx prisma validate`.
- Run `npx prisma generate`.
- Run `npx tsc --noEmit`.
- Run `npm run lint`.
- Run `npm run build`.
- Confirm GitHub CI is passing on `codex/phase-1-launch-security`.
- Confirm CI uses dummy/non-secret environment values where real secrets are not required.

## Testing
- Use the sections above as the final manual/security acceptance checklist after reviewer approval.
- Record the target Supabase project/database used for verification.
- Record the deployed migration status before and after applying migrations.
- Record CI run URL and result.
- Record any manual browser/auth test that cannot be completed because a real session, seeded user, or deployed environment is unavailable.

## Open Risks / Deferred
- Stage 4 durable rate limiting remains deferred until Redis/Upstash/deployment infrastructure is selected.
- Manual browser/auth tests require a real `.env.local`, migrated database, Supabase Auth users, and private Storage buckets.
- Production launch requires secrets configured in the hosting provider, not just local `.env.local`.
- Application document cleanup/quota tests require real Supabase Storage objects and migrated `application_upload_tokens`.
- Final acceptance should stop if migrations fail, duplicate active leases exist, or protected tables are reachable directly by `anon`/`authenticated`.

## Reviewer Decision Requested
Reviewer should approve this pre-acceptance verification plan before any deployment or final acceptance testing begins.
