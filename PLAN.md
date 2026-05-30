# Plan: Phase 7 CI/Test Hardening

## Goal
Add a practical automated test foundation that improves launch confidence without requiring production secrets, a live Supabase project, Resend, or a real database in CI.

Phase 7 should keep the current CI quality gate intact:

- `npm ci`
- `npx prisma validate`
- `npx prisma generate`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`

Then add a small, reliable test layer focused on pure server helper behavior first. The goal is not broad coverage; it is fast feedback on security-sensitive parsing, validation, status transitions, and rate-limit behavior that can run locally and in GitHub Actions with dummy environment values.

## Changes
- [ ] `package.json` - add test scripts:
  - `test`: run the unit/integration suite once.
  - `test:watch`: run tests in watch mode for local development.
- [ ] `package-lock.json` - update after adding test dependencies.
- [ ] `vitest.config.ts` or equivalent - configure Vitest for Node environment tests.
- [ ] `.github/workflows/ci.yml` - preserve all existing CI steps and add `npm run test` after `npx tsc --noEmit` and before `npm run lint` or after lint if reviewer prefers.
- [ ] `src/lib/application-document-upload.ts` and/or a new helper module - expose or extract pure document validation helpers for testing without Supabase Storage or Prisma.
- [ ] `src/app/api/inquiries/[id]/route.ts` and/or a new helper module - extract inquiry update/status transition logic into a pure function.
- [ ] `src/lib/resident-leases.ts` and/or a new helper module - keep lease payload validation testable without real DB access.
- [ ] `src/lib/rate-limit.ts` - make limiter state/time behavior testable without weakening production behavior.
- [ ] `src/**/*.test.ts` or `tests/**/*.test.ts` - add focused tests for the approved helper scope.

Preferred framework:
- Use Vitest.
- Rationale: small setup, TypeScript-friendly, fast Node environment tests, good fake timer support, and no browser/E2E assumptions.

## Proposed Test Scope
Application document validation:
- Validate allowed MIME/extension mapping:
  - PDF -> `pdf`
  - JPEG -> `jpg`
  - PNG -> `png`
  - unsupported type throws the existing upload descriptor error
- Validate file type extraction from file names.
- Add or expose a pure magic-byte matcher for PDF/JPEG/PNG and test:
  - valid PDF/JPEG/PNG signatures pass
  - disguised HTML/SVG/text content fails
  - too-short content fails

Upload descriptor/token behavior:
- Test descriptor signature verification with a dummy `APPLICATION_UPLOAD_SIGNING_SECRET`.
- Test tampered descriptors fail signature validation.
- If refactored, test pure descriptor shape checks:
  - upload session mismatch
  - storage path outside upload session
  - expired descriptor
  - duplicate descriptor nonce detection if kept in a pure helper
- Do not call Supabase Storage, Prisma, or service-role clients in these tests.

Inquiry status transition behavior:
- Extract a pure helper for building update data from current inquiry status and request body.
- Test:
  - saving `adminReply` on `NEW` auto-sets `REPLIED`
  - saving `adminReply` on `READ` auto-sets `REPLIED`
  - saving `adminReply` on `ARCHIVED` keeps `ARCHIVED` unless explicit valid status is sent
  - explicit valid status is respected
  - invalid status is rejected
  - empty patch body returns a no-change validation result

Lease payload validation:
- Test `parseLeasePayload` or an extracted pure equivalent:
  - defaults missing status to `DRAFT`
  - rejects invalid status
  - rejects missing property, start date, rent amount, residents
  - rejects end date before start date
  - rejects malformed money
  - deduplicates resident IDs
  - rejects primary resident not attached to the lease
- Keep live active-lease conflict checks out of unit tests unless they can be modeled with a lightweight mocked transaction client. Do not introduce a test database in this phase.

Rate-limit helper behavior:
- Test first request allowed.
- Test remaining count decreases.
- Test limit boundary returns limited result and retry-after.
- Test buckets reset after the configured window using fake timers or an injected clock.
- Test `secondaryKey` isolates authenticated user buckets.
- If needed, add a small internal reset/testing hook or factory so tests do not leak module-level bucket state between cases.

## Expected Behavior
- CI continues to pass without real Supabase, Resend, service-role, or database secrets.
- The new test suite runs quickly and deterministically in Node.
- Tests cover behavior that has previously carried security or correctness risk.
- No browser/E2E dependencies are introduced in this phase.
- Existing runtime behavior remains unchanged except for small refactors that preserve observable behavior.

## CI Workflow
Keep existing triggers and env strategy:
- `push` to `codex/**`
- `push` to `main` / `develop`
- `pull_request` to `main` / `develop`
- `workflow_dispatch`
- Node 22
- Dummy CI env values only

Proposed CI order:

```yaml
- run: npm ci
- run: npx prisma validate
- run: npx prisma generate
- run: npx tsc --noEmit
- run: npm run test
- run: npm run lint
- run: npm run build
```

The test step must not require:
- real `NEXT_PUBLIC_SUPABASE_URL`
- real `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- real `SUPABASE_SERVICE_ROLE_KEY`
- real `DATABASE_URL` / `DIRECT_URL`
- real `RESEND_API_KEY`
- real `ADMIN_EMAIL`

If a signing secret is needed for tests, use a deterministic dummy test env value only, for example:

```text
APPLICATION_UPLOAD_SIGNING_SECRET=ci_test_signing_secret_32_chars_minimum
```

## Testing
Local verification after implementation:

```bash
npm run test
npm run lint
npm run build
```

Full local confidence check:

```bash
npx prisma validate
npx prisma generate
npx tsc --noEmit
npm run test
npm run lint
npm run build
```

CI verification:
- Confirm GitHub Actions includes the existing quality steps plus `npm run test`.
- Confirm CI passes on `codex/phase-1-launch-security` or the Phase 7 branch after push.

## Out Of Scope
- No Playwright/E2E/browser automation in Phase 7 implementation.
- No real Supabase project access in tests.
- No real database or test database in CI.
- No Resend calls or email delivery tests requiring network/secrets.
- No schema changes or Supabase migrations.
- No auth behavior changes.
- No billing/payments work.
- No maintenance feature changes.
- No lease feature changes beyond pure validation extraction if needed.
- No UI redesign.
- No Stage 4 durable rate limiting work.

## Risks / Reviewer Questions
- Vitest is the proposed default. Reviewer should confirm there is no repo-specific preference for Jest or Node's built-in test runner.
- Some useful helpers currently live in modules that import `server-only`, Prisma, or Supabase clients. Implementation may need small extraction modules to keep tests pure and avoid import-time server/runtime coupling.
- Rate-limit tests may need either a factory/reset hook or fake timer discipline to avoid shared module-state leakage.
- Inquiry status transition tests likely require extracting inline route logic into a pure helper. Reviewer should confirm this small refactor is acceptable.
- Application document magic-byte tests likely require exposing a pure matcher or moving it to a pure validation helper. Reviewer should confirm that exporting these helpers is acceptable if they remain internal to `src/lib`.
- Playwright/E2E should be a later separately approved stage once CI secrets, test fixtures, and browser runtime expectations are defined.

Reviewer should approve this Phase 7 plan before any test framework, CI, or helper refactor implementation.
