# Plan: Phase 2 Auth and Build Blockers

## Goal
Fix the approved Phase 2 P1 blockers after Phase 1 launch-security review: fail closed on admin auth misconfiguration, complete the password reset flow, and make production builds stable without outbound Google font access.

No business code should be changed until this Phase 2 plan is approved.

## Changes
- [ ] `src/middleware.ts` — fail closed for `/admin` when required auth env is missing. Required env should include `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`; missing service-role/admin-check config must redirect away instead of skipping role verification.
- [ ] `src/middleware.ts` — make admin role verification strict: non-OK Supabase REST responses, malformed JSON, missing rows, or any role other than `ADMIN` should block `/admin`. Keep tenant `/dashboard` session protection unchanged.
- [ ] `src/middleware.ts` or Next 16 routing file — keep the middleware deprecation item scoped to this phase. Only rename/migrate to the Next 16 replacement file if `npm run build` or runtime behavior is blocked; otherwise leave a note for a later cleanup.

- [ ] `src/app/(auth)/forgot-password/page.tsx` — send reset emails to a dedicated recovery callback path, using a safe redirect such as `/auth/callback?next=/reset-password` instead of sending users to a generic dashboard callback.
- [ ] `src/app/(auth)/auth/callback/route.ts` — after exchanging the Supabase code, honor only safe relative `next` destinations. Password-recovery links should land on `/reset-password`; normal login/signup callbacks should keep the existing role-based redirect.
- [ ] `src/app/(auth)/reset-password/page.tsx` — add a real client-side reset form using the active Supabase recovery session, with new password, confirm password, loading/error/success states, and redirect after a successful `updateUser({ password })`.
- [ ] `src/validations/auth.ts` — add a reset-password Zod schema with password length and confirmation matching.

- [ ] `src/app/layout.tsx` — remove `next/font/google` imports and generated font classes so builds no longer fetch Google Fonts.
- [ ] `src/app/globals.css` — define build-safe font CSS variables for `font-sans`, `font-display`, and `font-mono` using local/system fallback families. Preserve the project convention that headings use `font-display` and body text uses `font-sans`.
- [ ] `package.json` — if the local/CI Next 16 build still fails on the default Turbopack path, pin the production build script to the stable webpack path, for example `next build --webpack`. Do not change the dev script unless needed.

## Expected Behavior
- `/admin` never opens because of missing service-role/admin-check env. A logged-in non-admin, a failed role lookup, or malformed role response is redirected away.
- `/dashboard` tenant protection behaves as before.
- Forgot-password emails create a recovery session and take the user to `/reset-password`, not straight to a dashboard.
- The reset page actually updates the Supabase password and gives clear validation/error states.
- Normal auth callbacks still redirect admins to `/admin/dashboard` and other users to `/dashboard`.
- `npm run build` can complete in the approved local/CI environment without outbound Google font access.
- If Next 16 middleware deprecation is only a warning, it stays documented rather than expanding this phase.

## Testing
- Run `npx prisma validate`.
- Run `npx tsc --noEmit`.
- Run `npm run lint`; existing tenant unused-import warnings may remain deferred unless touched by this phase.
- Run `npm run build` and confirm it does not attempt to fetch Google Fonts.
- Manually test `/admin` with missing `SUPABASE_SERVICE_ROLE_KEY`, invalid role-check response, non-admin user, and admin user.
- Manually test tenant `/dashboard` unauthenticated and authenticated access.
- Manually test forgot-password from email submission through callback to `/reset-password`, then confirm password update succeeds and the new password works at login.
- Manually test an expired or invalid reset link and confirm it redirects/shows a safe error path.

## Notes
- Phase 1 implementation and reviewer fixes are complete; this plan should not reopen private bucket, HMAC descriptor, token single-use, or storage policy work.
- The reset callback should only accept relative internal `next` values to avoid open redirects.
- Middleware cannot use Prisma in the Edge runtime, so the admin role check should continue using Supabase REST or another Edge-safe method.
- Build/font changes should prefer the smallest reliable fix. If real brand font files are later supplied, they can be wired with `next/font/local` in a separate polish pass.
- Do not handle Phase 3 items in this phase: inquiry reply behavior, Settings UI, tenant unused imports outside touched files, rate limit upgrades, orphan upload cleanup, or signed URL proxy/referrer policy.
