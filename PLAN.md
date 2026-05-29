# Plan: Security Remediation Stage 3

## Goal
Harden application document upload and admin download handling after Stage 1 and Stage 2.

Stage 3 addresses:
- M1: application document validation still relies too much on uploaded metadata and needs server-side content verification where feasible.
- M2: anonymous signed upload URL issuance can leave orphaned private Storage objects when upload tokens expire unconsumed.

This plan is for reviewer approval only. Do not change business code until the plan is approved.

## Current State
- Upload URLs are issued by `POST /api/application-documents/upload-url` into the private `application-documents` bucket.
- Upload descriptors are server-signed and persisted in `ApplicationUploadToken`.
- Application submit validates descriptor signature, token existence, expiry, consumed status, Storage object size, and Storage object MIME metadata.
- Admin document downloads require admin auth and use short-lived signed URLs.
- Missing hardening:
  - submitted object content bytes are not sniffed;
  - signed admin download URLs do not force attachment download;
  - expired unconsumed upload tokens/objects are not cleaned;
  - per-upload-session unconsumed object count is not capped.

## Changes
- [ ] `PLAN.md` — document the approved Stage 3 scope and verification plan.
- [ ] `src/lib/application-document-upload.ts` — strengthen submit-time validation.
  - Keep the existing private bucket, service-role server-side flow, server-signed descriptor, and DB token matching.
  - Re-check object size against `MAX_APPLICATION_DOCUMENT_SIZE` in addition to descriptor/token equality.
  - Re-check object MIME/content type against `APPLICATION_DOCUMENT_MIME_TYPES`.
  - Download a small prefix or the full object server-side using the service-role client only during application submit validation.
  - Add magic-byte sniffing for allowed types:
    - PDF: starts with `%PDF-`.
    - JPEG: starts with `FF D8 FF`.
    - PNG: starts with the PNG signature bytes.
  - Reject mismatches with `UploadDescriptorError` so API responses keep the existing `{ message: "..." }` shape.
  - Log only helper name plus non-secret context such as token id/nonce prefix, category, and storage path prefix when validation fails unexpectedly.
  - Do not trust browser `contentType` alone.
- [ ] `src/app/api/applications/route.ts` — preserve current submit error handling.
  - Continue catching `UploadDescriptorError` and returning `{ message: error.message }`.
  - Do not change application submission product flow beyond stricter document acceptance.
- [ ] `src/app/api/applications/[id]/documents/[documentId]/signed-url/route.ts` — force admin downloads as attachments.
  - Include stored `fileName` in the document query.
  - Use the current `@supabase/storage-js` signed URL `download` option, which is available in the installed package, preferably `download: safe file name`.
  - Keep admin authorization required.
  - Keep the bucket private and use short-lived signed URLs.
  - Do not expose service-role keys or create public bucket policies.
- [ ] `src/lib/application-document-upload.ts` — add orphan upload cleanup helper.
  - Add a server-only helper that finds expired, unconsumed `ApplicationUploadToken` rows in bounded batches.
  - Remove corresponding Storage objects from the private bucket using the service-role client.
  - Delete cleaned token rows after best-effort object removal, or leave token rows if object removal fails so cleanup can retry later.
  - Never clean tokens with `consumedAt` set.
  - Never delete submitted `ApplicationDocument` objects.
  - Log non-secret context only: count attempted, count removed, count failed, token id/nonce prefix if needed.
- [ ] `src/app/api/application-documents/upload-url/route.ts` — run safe opportunistic cleanup and enforce session quota.
  - Preferred cleanup path for Stage 3: opportunistic cleanup at the start of upload URL issuance.
  - Keep it bounded so public requests cannot trigger expensive cleanup work.
  - Keep existing IP rate limiting.
  - Add a small per-`uploadSessionId` cap for unconsumed, unexpired upload tokens, such as 10.
  - Count tokens by `uploadSessionId`, `consumedAt: null`, and `expiresAt > now`.
  - If quota is exceeded, return a clear `{ message: "Too many pending document uploads for this application" }` style 400/429 response.
  - If the client does not provide an `uploadSessionId`, generate one first and apply the quota to that generated session before issuing the token.
- [ ] `scripts/*` — optional only if reviewer prefers manual cleanup over opportunistic cleanup.
  - Default Stage 3 implementation should not require a script.
  - If a script is added, it must use the same cleanup helper and must not print secrets.
- [ ] `prisma/schema.prisma` / migration — not expected.
  - Existing `ApplicationUploadToken` fields are sufficient: `uploadSessionId`, `storagePath`, `expiresAt`, `consumedAt`.
  - No schema migration should be added unless implementation reveals a concrete need.

## Expected Behavior
- Valid PDF/JPEG/PNG documents continue to upload and submit successfully.
- Files with allowed extensions/MIME metadata but invalid magic bytes, such as disguised HTML/SVG, are rejected at application submit.
- Objects over `MAX_APPLICATION_DOCUMENT_SIZE` are rejected even if descriptor/token data is manipulated or Storage metadata differs.
- Admin document links open signed URLs that force download/attachment behavior.
- Expired, unconsumed upload objects are cleaned in bounded batches without deleting consumed/submitted documents.
- Excessive unconsumed upload tokens for one application upload session are blocked with a clear error.
- Existing public application submission flow remains anonymous-capable and private-bucket based.

## Out of Scope
- Billing, rent ledger, payments, Stripe/ACH, invoices, receipts, or balances.
- Lease changes or Stage 2 follow-up.
- Maintenance request changes.
- Durable rate limiting or Stage 4 work.
- CAPTCHA, except as a future anti-abuse option.
- Public bucket access.
- Public Supabase client reads/writes for application documents.
- Tenant/resident portal changes.
- Admin UI redesign.
- Email behavior changes.

## Testing
- Run `npx prisma validate`.
- Run `npx prisma generate`.
- Run `npx tsc --noEmit`.
- Run `npm run lint`.
- Run `npm run build`.
- Manual valid upload test:
  - upload and submit a valid PDF;
  - upload and submit a valid JPEG;
  - upload and submit a valid PNG.
- Manual disguised-content test:
  - upload HTML/SVG/text content while claiming an allowed filename/MIME where possible;
  - submit should fail with `{ message: "..." }` and no `ApplicationDocument` row should be created.
- Manual size test:
  - upload an object larger than `MAX_APPLICATION_DOCUMENT_SIZE` or manipulate descriptor metadata if feasible;
  - submit should reject it.
- Manual admin download test:
  - as admin, request document signed URL;
  - confirm redirected signed URL includes/uses attachment download behavior.
- Manual cleanup test:
  - create or seed expired unconsumed upload tokens with objects;
  - trigger bounded cleanup;
  - confirm expired unconsumed objects/tokens are removed;
  - confirm consumed tokens and submitted `ApplicationDocument.storagePath` objects remain.
- Manual quota test:
  - request upload URLs repeatedly with the same `uploadSessionId`;
  - confirm the per-session cap blocks excessive pending unconsumed uploads while existing rate limiting remains in place.

## Risks / Reviewer Decisions
- Reviewer should confirm opportunistic cleanup on upload URL issuance is preferred over a script/admin-only endpoint for Stage 3.
- Reviewer should confirm the per-uploadSessionId pending-token cap. Proposed default: 10 pending unconsumed tokens.
- Server-side byte sniffing requires downloading object bytes with the service-role client during submit validation. Reviewer should confirm this is acceptable for the current 10MB max file size.
- If Storage object metadata is missing or inconsistent, the safer behavior is to reject submission rather than accept a document.
- Reviewer approval is required before implementation.
