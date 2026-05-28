# Plan: Phase 4 Email Delivery and Build/CI Readiness

## Goal
Make launch verification less fragile by removing the email layer's import-time dependency on `RESEND_API_KEY`, clarifying what email delivery is and is not supported, and giving GitHub a minimal CI path that can validate future branches without relying only on local builds.

No business code should be changed until this Phase 4 plan is approved.

## Changes
- [ ] `src/lib/email.ts` — lazy-create the Resend client inside email delivery functions instead of constructing `new Resend(process.env.RESEND_API_KEY)` at module import time. Importing this module must be build-safe when `RESEND_API_KEY` is missing.
- [ ] `src/lib/email.ts` — add a small shared delivery helper or guard that classifies email configuration failures clearly. Missing `RESEND_API_KEY` should never crash build/import. Optional fire-and-forget notifications should skip delivery and log a concise warning; explicit user-requested email sends in future work should fail closed and surface an error.
- [ ] `src/lib/email.ts` — make application email behavior explicit:
  - application confirmation to applicant remains fire-and-forget after successful application creation;
  - admin new-application notification remains fire-and-forget and is skipped if `ADMIN_EMAIL` or `RESEND_API_KEY` is missing;
  - application status update email remains fire-and-forget after a valid status change;
  - all delivery failures should be logged with helper name and non-secret context, without blocking the database mutation.
- [ ] `src/app/api/applications/route.ts` and `src/app/api/applications/[id]/route.ts` — keep application email side effects non-blocking, but route logging should distinguish skipped configuration from provider/send failures so launch debugging is less ambiguous.
- [ ] `src/app/api/inquiries/route.ts` and `src/lib/email.ts` — decide and implement the contact inquiry boundary for this phase. Recommended minimum: after a contact inquiry is saved, send a fire-and-forget admin notification when `ADMIN_EMAIL` and `RESEND_API_KEY` are configured; skip and log when email configuration is absent. Keep the public API response tied to database persistence, not email delivery.
- [ ] `src/lib/email.ts` — keep or adjust the existing inquiry confirmation helper only if the reviewer chooses user confirmation emails for contact forms. Recommended default: do not send user inquiry confirmation in Phase 4 unless reviewer explicitly wants both admin notification and user confirmation.
- [ ] `src/app/admin/inquiries/inquiries-client.tsx` and `src/app/api/inquiries/[id]/route.ts` — preserve Phase 3 semantics: admin inquiry reply remains a saved internal reply note only. Do not reintroduce "Send Reply" UI copy or outbound reply behavior in this phase.
- [ ] `.github/workflows/ci.yml` — update CI so it can run on reviewable branches and pull requests. Minimum recommended trigger: `pull_request` to `main`/`develop`, `push` to `main`/`develop`/`codex/**`, plus `workflow_dispatch`.
- [ ] `.github/workflows/ci.yml` — run the launch-readiness checks in CI: `npm ci`, `npx prisma validate`, `npx prisma generate`, `npx tsc --noEmit`, `npm run lint`, and `npm run build`.
- [ ] `.github/workflows/ci.yml` — use dummy non-secret env values for build-only checks, including placeholder Supabase URLs/keys, placeholder `DATABASE_URL`, placeholder `RESEND_API_KEY`, placeholder `ADMIN_EMAIL`, and `NEXT_PUBLIC_APP_URL`. CI must not require real production secrets.
- [ ] `.env.example` — only update if needed to document optional email behavior or add a missing non-secret variable description. Do not commit real secrets.

## Expected Behavior
- `npm run build` can collect route data without a real `RESEND_API_KEY`; importing `src/lib/email.ts` no longer throws.
- Missing email configuration does not block application submission, application status updates, or contact inquiry persistence. Those flows should still return based on database success.
- Optional notification delivery is transparent in logs: skipped configuration and provider failures are distinguishable.
- Application emails remain a best-effort notification layer, not the source of truth for application state.
- Contact inquiry submission remains database-first. If Phase 4 includes admin notification, it is best-effort and does not change the public success response.
- Admin inquiry reply stays honest: it saves an internal note and does not imply an email was sent.
- GitHub can run the same minimum validation expected locally, including Prisma validation, TypeScript, ESLint, and production build.
- CI succeeds without real Resend, Supabase, or database secrets.

## Out of Scope
- Do not implement real admin inquiry reply email in Phase 4. If this is added later, it must include a Resend helper, explicit send action, delivery failure handling, accurate UI copy/status, and tests/manual verification for failed delivery.
- Do not change the inquiry DB enum or application status model.
- Do not make email delivery transactional with database writes.
- Do not add persisted Settings management, analytics, marketing copy, large UI redesign, or new admin dashboards.
- Do not reopen Phase 1/Phase 2 security, upload, auth, signed URL, recovery, rate-limit, or storage work unless it directly blocks CI/build.
- Do not add real secrets to `.env.example`, CI YAML, code, logs, or commits.
- Do not require a live database or real Resend account for CI.

## Testing
- Run `npx prisma validate`.
- Run `npx prisma generate`.
- Run `npx tsc --noEmit`.
- Run `npm run lint`.
- Run `npm run build` with no real `RESEND_API_KEY` and confirm build no longer fails at route data collection.
- Run `npm run build` with dummy CI-style env values and confirm it passes.
- Manually exercise application submission with email env present and absent:
  - database record is created in both cases;
  - missing email config logs a skipped notification;
  - provider failure logs an email failure without changing the successful API response.
- Manually exercise application status update with email env present and absent:
  - valid status change persists in both cases;
  - email send remains best-effort and does not mask the database update response.
- If contact inquiry admin notification is included, manually submit contact form with email env present and absent:
  - inquiry is saved in both cases;
  - admin notification sends when configured;
  - missing config logs a skip and does not change the public success response.
- Confirm admin inquiry "Save Reply Note" still only saves `adminReply`, keeps Phase 3 copy, and does not send email.
- After pushing Phase 4 implementation, confirm GitHub Actions runs on the branch and reports all required checks.

## Risks / Reviewer Questions
- Should Phase 4 send only admin notifications for contact inquiries, or both admin notification and user confirmation? Recommended default is admin notification only to keep scope small and avoid new user-facing delivery promises.
- Should missing `RESEND_API_KEY` be logged as `console.warn` with a skipped result, or should helpers reject with a typed configuration error that callers catch? Recommended default is a shared optional-delivery wrapper that logs skips once per attempted email path and resolves with a skipped result.
- Application status update email is currently fire-and-forget. Should admins see an inline delivery warning when status email fails, or is server logging enough for launch? Recommended default is server logging only, because the status change itself is the committed action.
- CI currently exists but did not trigger for the Phase 3 branch. Should CI run on all `codex/**` pushes, or only PRs plus manual dispatch? Recommended default is `codex/**` push coverage so reviewer branches get immediate feedback.
- Should CI use Node 22, matching the existing workflow, or move to Node 24 to match the local runtime used by Codex verification? Recommended default is keep Node 22 unless project engines or Next.js requirements force a change.
- Do we want a later Phase 5 for explicit admin inquiry reply email? If yes, it should be planned separately so Phase 3's honest internal-note UI is not quietly reversed.
