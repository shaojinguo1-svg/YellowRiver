# Plan: Launch Safety and Flow Closure

## Goal
Fix the reviewer-blocking launch risks before production: remove hardcoded credentials, move sensitive uploads behind server-controlled private storage, make backend validation match the UI, fail closed for admin access, complete password reset, and align admin actions with their real behavior.

No business code should be changed until this plan is approved.

## Changes
- [ ] `scripts/create-admin.ts` — replace hardcoded admin email/password/name with environment variables or required CLI input, validate missing values, and never print passwords.
- [ ] `scripts/create-tenant.ts` — replace hardcoded tenant email/password/name with environment variables or required CLI input, validate missing values, and never print passwords.
- [ ] `scripts/seed-properties.ts` — replace the hardcoded admin lookup email with an environment variable such as `SEED_ADMIN_EMAIL` or reuse `ADMIN_EMAIL`.
- [ ] `.env.example` — document the new script variables and mark credentials as caller-provided.
- [ ] Supabase project outside this repo — rotate the exposed admin and tenant passwords immediately after the script changes are approved.

- [ ] `scripts/setup-storage.ts` — create/configure `application-documents` as a private bucket and tighten `property-images` policies so public read remains available but write/delete are not open to every authenticated user.
- [ ] `src/lib/supabase/server.ts` or a new server storage helper — add a service-role Supabase client for server-only storage operations.
- [ ] `src/app/api/upload/route.ts` — split upload intent by use case, require admin for property images, allow application document upload only through a constrained server-generated path/token, validate MIME type, extension, size, and path prefix.
- [ ] `src/components/application/steps/documents-step.tsx` — stop direct browser uploads with the anon Supabase client; request a server-created signed upload URL, preserve category metadata, and show clear required-file errors before submit.
- [ ] `src/components/application/application-form.tsx` — submit only server-trusted document descriptors and include required document categories in the payload.
- [ ] `src/validations/application.ts` — add `propertyId` UUID validation and documents validation requiring Government ID and Proof of Income.
- [ ] `src/app/api/applications/route.ts` — validate the full payload including `propertyId` and documents; verify uploaded files exist in the private bucket, match the generated path/category/mime/size, and belong to the current application submission before creating `ApplicationDocument` rows.
- [ ] `src/app/api/applications/[id]/route.ts` — return document metadata without permanent public URLs and provide or support short-lived signed URLs for admins only.
- [ ] `src/app/admin/applications/[id]/page.tsx` — replace direct `doc.url` links with admin-only signed document viewing links or buttons.

- [ ] `src/hooks/use-image-upload.ts` — route property image uploads through the server/admin signed upload flow rather than direct anon-client Storage writes.
- [ ] `src/app/api/properties/[id]/images/route.ts` — verify `storagePath` belongs to the property and exists in `property-images` before persisting the image record.
- [ ] `src/app/api/properties/[id]/images/[imageId]/route.ts` — keep delete server-controlled and compatible with tightened Storage policies.

- [ ] `src/middleware.ts` — fail closed for `/admin` when `SUPABASE_SERVICE_ROLE_KEY` or `NEXT_PUBLIC_SUPABASE_URL` is missing, returning/redirecting away instead of skipping role verification.
- [ ] `src/app/(auth)/forgot-password/page.tsx` — redirect password reset emails to a dedicated reset page instead of the generic callback destination.
- [ ] `src/app/(auth)/auth/callback/route.ts` — preserve normal login/signup callbacks but route password-recovery sessions to the reset-password page.
- [ ] `src/app/(auth)/reset-password/page.tsx` — add a real password reset form that updates the Supabase password, validates confirmation, and redirects to login/dashboard after success.
- [ ] `src/validations/auth.ts` — add reset-password schema for new password and confirmation.

- [ ] `src/app/api/inquiries/[id]/route.ts` — either send the reply email via Resend and report delivery failure, or rename the API behavior to “save reply” only.
- [ ] `src/app/admin/inquiries/inquiries-client.tsx` — align button labels, success/error messages, and loading states with the chosen inquiry behavior.
- [ ] `src/lib/email.ts` — add a real inquiry reply email helper if the product decision is to actually send replies.

- [ ] `src/app/admin/settings/page.tsx` — remove the fake static form or wire it to persisted `SiteSettings`.
- [ ] `src/app/api/settings/route.ts` or equivalent server action — if wiring settings, add admin-only GET/PATCH with Zod validation.
- [ ] `src/validations/settings.ts` — if wiring settings, add validation for site name, tagline, phone, email, and address.

- [ ] `src/app/layout.tsx` — replace `next/font/google` with local fonts or another build-safe font strategy so production builds do not require outbound Google font access.
- [ ] `package.json` / Next config if needed — add a webpack build script or document the CI build path if Turbopack remains blocked by native SWC availability.
- [ ] `src/middleware.ts` or Next 16 routing file — address the Next 16 middleware deprecation path if the build/runtime warning requires renaming to the newer convention.
- [ ] Files flagged by lint — remove the existing unused imports reported by `npm run lint`.

## Expected Behavior
- Admin/tenant bootstrap scripts no longer contain or print real credentials.
- Sensitive application documents are never publicly readable; admins get short-lived signed access only after admin authorization.
- Applicants cannot submit without required Government ID and Proof of Income, and invalid or missing `propertyId` returns a 400 instead of risking a 500.
- Ordinary authenticated tenants cannot mutate property image storage directly.
- Missing admin role-check environment variables block `/admin` instead of allowing a logged-in non-admin through.
- Forgot-password links lead to a working password update flow.
- Inquiry reply UI truthfully reflects whether it sends email or only saves an internal response.
- Settings either persist to `SiteSettings` or are clearly removed until implemented.
- Production build no longer depends on unavailable Google font network access.

## Testing
- Run `npx tsc --noEmit`.
- Run `npm run lint` and confirm unused-import warnings are fixed.
- Run production build with the approved build mode after the font/build changes.
- Manually test admin and tenant login redirects, `/admin` access with and without service-role env, and tenant dashboard access.
- Manually test application submission with zero docs, one required doc missing, invalid `propertyId`, valid docs, oversized file, unsupported MIME type, and reused/foreign `storagePath`.
- Manually test admin application review document viewing and confirm document URLs expire or require regeneration.
- Manually test property image upload/delete/reorder as admin and confirm a tenant cannot write/delete Storage objects directly.
- Manually test forgot-password email callback through the new reset page and successful password update.
- Manually test inquiry reply behavior, including Resend failure handling if replies are sent.
- Manually test settings persistence or confirm the placeholder form is gone.

## Notes
- The exposed credentials must be rotated in Supabase; code changes alone do not invalidate the leaked passwords.
- The strongest document-upload design is a two-step flow: server creates a constrained signed upload path, client uploads to that path, then application submit verifies the file exists and matches the expected metadata before DB insert.
- Existing `ApplicationDocument.url` currently assumes permanent URLs. Prefer storing only `storagePath` plus metadata and generating signed URLs at read time; if the column remains, it should not hold public sensitive URLs.
- `property-images` can stay public-read for listing display, but write/delete should be service-role/admin controlled.
- Settings has a real `SiteSettings` model already, so wiring it is feasible; hiding the form is faster but leaves the model unused.
- Generated Prisma files under `src/generated/` are ignored build artifacts and should not be edited directly.
