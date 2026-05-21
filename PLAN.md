# Plan: Launch Safety and Flow Closure

## Goal
Fix the reviewer-blocking launch risks before production: remove exposed credentials, make sensitive document storage private and server-trusted, close auth/build blockers, and align admin UI behavior with what the system actually does.

No business code should be changed until this revised plan is approved.

## Changes

### Phase 1 - P0 Security: Credentials, Private Documents, Storage Policy
- [ ] `scripts/create-admin.ts` — replace hardcoded admin email/password/name with environment variables or required CLI input, validate missing values, and never print passwords.
- [ ] `scripts/create-tenant.ts` — replace hardcoded tenant email/password/name with environment variables or required CLI input, validate missing values, and never print passwords.
- [ ] `scripts/seed-properties.ts` — replace the hardcoded admin lookup email with `SEED_ADMIN_EMAIL` or `ADMIN_EMAIL`.
- [ ] `.env.example` — document the new script variables and mark all credentials as caller-provided.
- [ ] Supabase project outside this repo — rotate the exposed admin and tenant passwords immediately after script changes are approved.

- [ ] `prisma/schema.prisma` — update `ApplicationDocument` so permanent public URLs are no longer required. Preferred shape: make `url` nullable/deprecated, keep `storagePath` as the source of truth, and add a document category/type field for `GOVERNMENT_ID`, `PROOF_OF_INCOME`, and `ADDITIONAL`.
- [ ] `prisma/migrations/...` — add a migration for the `ApplicationDocument` changes. Existing public `url` values should be migrated to nullable/deprecated data without deleting `storagePath`; any irreversible cleanup of old public objects should be handled by a separate audited script.
- [ ] `scripts/setup-storage.ts` — create/configure `application-documents` as `public: false`, remove any public read policy for that bucket, and tighten `property-images` so public read remains available but authenticated write/update/delete policies are removed.
- [ ] Storage/data audit outside this repo — check whether `application-documents` already exists as public, inspect existing `storage.objects` policies, find existing `ApplicationDocument.url` public URLs, and document/delete/migrate any previously public sensitive objects.

- [ ] `src/lib/supabase/server.ts` or a new server storage helper — add a server-only service-role Supabase client for Storage operations. This helper must never be imported by client components.
- [ ] `src/app/api/application-documents/upload-url/route.ts` — add a dedicated public-but-constrained endpoint for application document signed upload URLs. It should validate file name, MIME type, extension, size, and required document category, then return a short-lived signed upload URL plus a server-trusted descriptor.
- [ ] Application document descriptor mechanism — use an explicit `uploadSessionId` plus HMAC-signed descriptor. The descriptor should include `uploadSessionId`, storage path, category, original file name, MIME type, file size, expiry, and nonce. The application submit API must reject descriptors with invalid signatures, expiry, duplicate nonce, path/category mismatch, missing object, or mismatched object metadata.
- [ ] `src/components/application/steps/documents-step.tsx` — stop direct browser uploads with the anon Supabase client; call the dedicated application document upload endpoint, upload to the returned signed URL, preserve descriptor/category metadata, and show required-file errors before submit.
- [ ] `src/components/application/application-form.tsx` — submit document descriptors rather than public URLs, include `uploadSessionId`, and require Government ID plus Proof of Income before final submit.
- [ ] `src/validations/application.ts` — add `propertyId` UUID validation and documents validation requiring Government ID and Proof of Income descriptors.
- [ ] `src/app/api/applications/route.ts` — validate the full payload including `propertyId`, `uploadSessionId`, and signed document descriptors; verify objects exist in the private bucket, paths match the descriptor, categories are present, MIME/size are allowed, and descriptors belong to this submission before creating `ApplicationDocument` rows.
- [ ] `src/app/api/applications/[id]/documents/[documentId]/signed-url/route.ts` — add a dedicated admin-only signed read URL endpoint with TTL 60-300 seconds, `Cache-Control: no-store`, ownership checks, and no batch signed URL return from the normal application GET.
- [ ] `src/app/api/applications/[id]/route.ts` — return document metadata only; do not include public document URLs or batch signed URLs.
- [ ] `src/app/admin/applications/[id]/page.tsx` — replace direct `doc.url` links with calls to the admin-only signed URL route.

- [ ] `src/app/api/property-images/upload-url/route.ts` or an admin-only image upload handler — create a dedicated admin-only endpoint for property image signed upload URLs.
- [ ] `src/hooks/use-image-upload.ts` — route property image uploads through the admin-only image upload endpoint rather than direct anon-client Storage writes.
- [ ] `src/app/api/properties/[id]/images/route.ts` — verify `storagePath` exists and is under `${propertyId}/...` in `property-images` before persisting the image record.
- [ ] `src/app/api/properties/[id]/images/[imageId]/route.ts` — keep delete server-controlled and compatible with tightened Storage policies.

- [ ] Rate limiting / abuse control — add a small shared server-side limiter and apply it at minimum to public inquiry submit, application submit, and application document signed-upload-url generation. The limiter should constrain by IP plus a stable secondary key when available, and return `{ message: "..." }` with 429.

### Phase 2 - P1 Auth and Build Blockers
- [ ] `src/middleware.ts` — fail closed for `/admin` when `SUPABASE_SERVICE_ROLE_KEY` or `NEXT_PUBLIC_SUPABASE_URL` is missing, returning/redirecting away instead of skipping role verification.
- [ ] `src/app/(auth)/forgot-password/page.tsx` — redirect password reset emails to a dedicated reset page instead of the generic callback destination.
- [ ] `src/app/(auth)/auth/callback/route.ts` — preserve normal login/signup callbacks but route password-recovery sessions to the reset-password page.
- [ ] `src/app/(auth)/reset-password/page.tsx` — add a real password reset form that updates the Supabase password, validates confirmation, and redirects after success.
- [ ] `src/validations/auth.ts` — add reset-password schema for new password and confirmation.

- [ ] `src/app/layout.tsx` — replace `next/font/google` with local fonts or another build-safe font strategy so production builds do not require outbound Google font access.
- [ ] `package.json` / Next config if needed — add or document a reliable production build path so `npm run build` is stable in local/CI environments without Google font network access.
- [ ] `src/middleware.ts` or the Next 16 routing file — keep the middleware deprecation item in scope; execute it in this phase only if it blocks build/runtime.

### Phase 3 - P2 Product Polish and Cleanup
- [ ] `src/app/api/inquiries/[id]/route.ts` — either send the reply email via Resend and report delivery failure, or rename the API behavior to “save reply” only. Minimum approved behavior: UI must not claim “Send Reply” unless an email is actually sent.
- [ ] `src/app/admin/inquiries/inquiries-client.tsx` — align button labels, success/error messages, and loading states with the chosen inquiry behavior.
- [ ] `src/lib/email.ts` — add a real inquiry reply email helper only if the product decision is to actually send replies.

- [ ] `src/app/admin/settings/page.tsx` — remove/disable the fake static form as the minimum fix, or wire it to persisted `SiteSettings` if time allows.
- [ ] `src/app/api/settings/route.ts` or equivalent server action — if wiring settings, add admin-only GET/PATCH with Zod validation.
- [ ] `src/validations/settings.ts` — if wiring settings, add validation for site name, tagline, phone, email, and address.
- [ ] Files flagged by lint — remove existing unused imports while touching the corresponding files.

## Expected Behavior
- Admin/tenant bootstrap scripts no longer contain or print real credentials, and exposed passwords are rotated in Supabase.
- `application-documents` is private, has no public read policy, and sensitive documents are never stored or returned as permanent public URLs.
- Anonymous and tenant application uploads are allowed only through constrained, signed descriptors that the application submit endpoint can verify.
- Admin document viewing uses a dedicated short-lived signed URL endpoint with `no-store`; normal application reads return metadata only.
- Applicants cannot submit without required Government ID and Proof of Income, and invalid or missing `propertyId` returns 400 instead of risking 500.
- `property-images` remains public-read for listings but write/delete is admin/server controlled; paths must stay under `${propertyId}/...`.
- Public abuse surfaces have rate limiting: inquiries, application submit, and application document upload URL generation.
- Missing admin role-check environment variables block `/admin` instead of allowing a logged-in non-admin through.
- Forgot-password links lead to a working password update flow.
- `npm run build` can pass in the approved local/CI environment without relying on outbound Google font fetches.
- Inquiry reply and Settings UI no longer misrepresent unfinished behavior.

## Testing
- Run `npx tsc --noEmit`.
- Run `npm run lint` and confirm unused-import warnings are fixed.
- Run `npm run build` with the approved build path and confirm no external Google font dependency is required.
- Manually test script validation for missing credentials and confirm scripts never print passwords.
- Manually verify Supabase buckets/policies: `application-documents` is private with no public read; `property-images` has public read but no authenticated write/update/delete policies.
- Manually test application document upload URL generation with valid files, oversized files, unsupported MIME types, expired descriptors, tampered descriptors, duplicate descriptors, missing objects, and foreign/reused `storagePath`.
- Manually test application submission with zero docs, one required doc missing, invalid `propertyId`, valid docs, and reused/foreign descriptors.
- Manually test admin application review document viewing and confirm signed read URLs expire, are `no-store`, and are not returned in batch by application GET.
- Manually test property image upload/delete/reorder as admin and confirm a tenant cannot write/delete Storage objects directly.
- Manually test rate limiting on inquiries, application submit, and document upload URL generation.
- Manually test admin and tenant login redirects, `/admin` access with and without service-role env, and tenant dashboard access.
- Manually test forgot-password email callback through the new reset page and successful password update.
- Manually test inquiry reply/save behavior and settings disabled/persisted behavior.

## Notes
- Reviewer approval is requested for Phase 1 first; later phases can proceed after Phase 1 lands unless reviewer asks to batch them differently.
- Code changes cannot invalidate exposed credentials. Supabase password rotation is a required external operational step.
- The document descriptor should use a dedicated signing secret if available; otherwise add one to `.env.example`. Do not rely on client-supplied `storagePath` or `url` without server verification.
- Existing `ApplicationDocument.url` values should be treated as legacy. If the column remains for compatibility, it should be nullable and should not hold public sensitive URLs going forward.
- `property-images` can stay public-read for listing display, but every write/delete path must be service-role/admin controlled.
- Settings has a real `SiteSettings` model already, so wiring it is feasible; disabling the fake form is the smaller safe fix.
- Generated Prisma files under `src/generated/` are ignored build artifacts and should not be edited directly.
