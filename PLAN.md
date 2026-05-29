# Plan: Security Vulnerability Remediation

## Goal
Fix the verified vulnerability list without changing unrelated product scope or reopening Phase 1-6 feature work.

The implementation should be staged so the highest-risk data exposure and integrity issues are reviewed first, followed by lease concurrency/history hardening, application document upload hardening, and infrastructure-dependent rate limiting.

## Findings Check
- [x] C1 verified — public listing detail fetches by `slug` without `status: "ACTIVE"`.
- [x] C2 verified — `GET /api/properties/[id]` is unauthenticated, returns non-ACTIVE properties, and includes creator email. I found no current frontend caller for this GET route.
- [x] C3 verified — active lease conflicts are check-then-write with no partial unique index and no serializable transaction/retry.
- [x] H1 verified — tenant dashboard matches applications by `applicantId` OR untrusted application email.
- [x] M1 partially verified — upload descriptors are server-signed and submit-time validation checks Storage object metadata against issued token data, so the current code is not only trusting the submitted descriptor. However, it still lacks magic-byte/content sniffing and admin signed downloads are not forced as attachments.
- [x] M2 verified — anonymous upload URL issuance is allowed and there is no cleanup path for expired, unconsumed upload-token objects.
- [x] M3 verified — `updateLease` deletes and recreates all `LeaseResident` rows, wiping retained resident metadata/history.
- [x] M4 verified — sign-out POST has no Origin/Referer same-origin check.
- [x] M5 verified — contact inquiry `propertyId` is UUID-format-only and has no FK relation to `Property`.
- [x] L1 verified — in-memory rate limiter trusts `x-forwarded-for` and is non-durable.
- [x] L2 verified — saving only `adminReply` forces status to `REPLIED`, including from `ARCHIVED`.

## Stage 1: Public Data Exposure and Small Server-Side Guards
- [ ] `src/app/(public)/listings/[slug]/page.tsx` — restrict public listing detail to ACTIVE properties.
  - Replace `findUnique({ where: { slug } })` with an ACTIVE-scoped lookup.
  - Non-ACTIVE slugs should return `notFound()` and non-indexable metadata.
- [ ] `src/app/api/properties/[id]/route.ts` — close the unauthenticated by-id property leak.
  - Since no current caller needs public by-id property detail, make GET admin-only with `requireAdmin()`.
  - Keep admin-facing data as needed, but do not expose this route publicly.
  - Preserve PATCH/DELETE behavior.
- [ ] `src/app/(tenant)/dashboard/page.tsx` — stop showing applications matched only by email.
  - Query tenant applications by `applicantId: user.id` only.
  - Do not try to infer ownership from a free-text public application email.
  - Leave explicit application-to-account claiming/conversion for a later phase.
- [ ] `src/app/api/auth/signout/route.ts` — add same-origin CSRF guard.
  - Validate `Origin` or `Referer` against `request.nextUrl.origin`.
  - Reject cross-origin sign-out attempts with `{ message: "Forbidden" }` and `403`.
  - Preserve same-origin sign-out redirect behavior.
- [ ] `src/app/api/inquiries/[id]/route.ts` — avoid unarchiving inquiries when saving internal notes.
  - Only auto-set `REPLIED` when the current status is `NEW` or `READ`.
  - Leave `ARCHIVED` and existing terminal statuses unchanged unless an explicit valid status is sent.
- [ ] `src/app/api/inquiries/route.ts` and `prisma/schema.prisma` — validate and model contact inquiry property links.
  - For public inquiry POST, accept `propertyId` only if the property exists and is ACTIVE.
  - Add an optional `ContactInquiry.property` relation to `Property`.
  - Add a migration that nulls any dangling existing `contact_inquiries.property_id` values before adding the FK.
  - Use `ON DELETE SET NULL` so deleting a property does not delete historical inquiries.

## Stage 2: Lease Invariants and Resident History
- [ ] `prisma/schema.prisma` and a new Prisma migration — add database backing for one ACTIVE lease per property.
  - Add SQL partial unique index: unique `leases(property_id)` where `status = 'ACTIVE'`.
  - Keep the app-level friendly validation error for admin UX.
  - Document the raw partial index because Prisma schema cannot fully represent it.
- [ ] `src/lib/resident-leases.ts` — make lease create/update transactions concurrency-safe.
  - Run create/update transaction work at Serializable isolation.
  - Retry serialization conflicts a small bounded number of times.
  - Continue returning friendly `LeaseValidationError` messages for known conflicts.
  - Let DB unique conflicts from the ACTIVE property index map to the same friendly property-conflict error.
- [ ] `src/lib/resident-leases.ts` — preserve `LeaseResident` rows on update.
  - Diff residents instead of `deleteMany` plus `createMany`.
  - Keep retained residents' `createdAt`, `moveInDate`, and `moveOutDate`.
  - Add new residents with `moveInDate` based on the lease start date.
  - Remove residents not in the payload; if the product wants historical removal later, defer soft move-out semantics to a future phase.
  - Update `isPrimary` in place for all retained/new residents.

## Stage 3: Application Document Upload Hardening
- [ ] `src/lib/application-document-upload.ts` — strengthen submit-time object validation.
  - Re-check allowed MIME type and `MAX_APPLICATION_DOCUMENT_SIZE` against the issued token and Storage object metadata.
  - Add server-side magic-byte sniffing for PDF, JPEG, and PNG before accepting a document.
  - Keep existing server-signed descriptor and token matching.
  - Return existing `{ message: "..." }` error format through `UploadDescriptorError`.
- [ ] `src/app/api/applications/[id]/documents/[documentId]/signed-url/route.ts` — force admin document downloads.
  - Pass Supabase Storage signed URL `download` option using the stored/sanitized filename.
  - Keep admin authorization required.
  - Keep short-lived signed URLs and `Cache-Control: no-store`.
- [ ] `src/lib/application-document-upload.ts` and `src/app/api/application-documents/upload-url/route.ts` — clean expired unconsumed upload objects.
  - Add a server-only cleanup helper that finds expired, unconsumed `ApplicationUploadToken` rows in small batches.
  - Remove corresponding Storage objects with the service-role client.
  - Delete or mark cleaned token rows after successful/best-effort object cleanup.
  - Invoke cleanup opportunistically from upload URL issuance so no new scheduler or secret is required in this stage.
- [ ] `src/app/api/application-documents/upload-url/route.ts` — add small quota guard for anonymous upload URL issuance.
  - Keep anonymous application submissions supported.
  - Limit unconsumed, unexpired upload tokens per `uploadSessionId`.
  - Keep the existing IP rate limit; durable global rate limiting is Stage 4.

## Stage 4: Durable Rate Limiting
- [ ] `src/lib/rate-limit.ts` — replace or supplement the in-memory limiter with a durable store.
  - Preferred implementation depends on deployment choice, such as Upstash Redis or another managed Redis.
  - Do not commit secrets.
  - Keep public POST endpoints protected even across instances/restarts.
- [ ] IP derivation — stop blindly trusting arbitrary `x-forwarded-for`.
  - Define which proxy/runtime header is trusted in production.
  - Fall back conservatively when the trusted header is absent.
  - Keep `secondaryKey` support for authenticated per-user limits.

## Expected Behavior
- Public users cannot view DRAFT, INACTIVE, ARCHIVED, or RENTED property details by guessing slugs or IDs.
- The by-id property API no longer leaks creator email or non-public listing data to anonymous users.
- Tenants only see applications explicitly linked to their account.
- Cross-site POSTs cannot force a user sign-out.
- Contact inquiries cannot persist dangling or inactive property references.
- Saving an internal inquiry reply note does not silently unarchive archived inquiries.
- Concurrent admin lease operations cannot create multiple ACTIVE leases for the same property.
- Retained lease residents keep their row history when lease basics are edited.
- Uploaded application documents are accepted only when metadata, issued token data, and file signatures agree.
- Expired unsubmitted upload objects are cleaned up without adding a new scheduler in this stage.
- Rate limiting hardening is planned separately because it depends on deployment infrastructure.

## Out of Scope
- Resident portal feature expansion.
- Maintenance request feature changes.
- Billing, rent ledger, rent payments, Stripe/ACH, invoices, receipts, or balances.
- Settings persistence.
- Email behavior changes.
- Large UI redesign.
- Application-to-account claiming flow.
- CAPTCHA unless explicitly approved as a later anti-abuse feature.
- Adding public Supabase client reads/writes for protected data.

## Testing
- Run `npx prisma validate`.
- Run `npx prisma generate`.
- Run `npx tsc --noEmit`.
- Run `npm run lint`.
- Run `npm run build`.
- Manual public test: ACTIVE listing slug renders; DRAFT/INACTIVE/ARCHIVED/RENTED listing slug returns not found.
- Manual API test: anonymous `GET /api/properties/[id]` is unauthorized; admin access still works if the route is retained.
- Manual tenant test: a tenant sees only applications linked by `applicantId`, not applications sharing the same email string.
- Manual sign-out test: same-origin POST signs out; cross-origin Origin/Referer is rejected.
- Manual inquiry test: saving an internal note on NEW/READ marks note saved; saving one on ARCHIVED keeps ARCHIVED unless status is explicit.
- Migration test: dangling `contact_inquiries.property_id` rows are nulled before FK creation.
- Lease concurrency test: concurrent ACTIVE lease creation for the same property yields one success and one friendly conflict.
- Lease update test: changing rent/status without changing residents preserves retained `LeaseResident` row timestamps and dates.
- Upload validation test: valid PDF/JPEG/PNG passes; mismatched extension/MIME/signature bytes fail.
- Upload cleanup test: expired unconsumed tokens remove associated Storage objects in bounded batches.
- Rate limit Stage 4 test: verify limits survive process restart and cannot be bypassed by spoofing untrusted headers.

## Notes
- Stage 1 is the safest first patch because it closes direct privacy leaks with small, reviewable changes.
- Stage 2 needs a Prisma migration and careful conflict handling because it changes database invariants.
- Stage 3 touches Supabase Storage behavior; use the installed `@supabase/storage-js` API's `download` option for signed URLs and keep service-role use server-only.
- Stage 4 should be reviewed separately because it needs an infrastructure decision for durable storage.
- Prefer separate commits per stage so reviewer can approve or roll back riskier database/storage changes independently.
