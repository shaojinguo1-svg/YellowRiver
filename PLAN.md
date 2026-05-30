# Plan: Dockerized Verification Environment

## Goal
Add a small, reproducible Docker-based verification path for YellowRiver so final local checks can run in a Node 22 Linux container that is closer to GitHub CI and less dependent on a developer's macOS or local Node/SWC behavior.

This phase is about verification only. It should not change production deployment, application behavior, schema, Supabase posture, or business features.

## Changes
- [ ] `Dockerfile.verify` - add a local verification image based on Node 22 that installs dependencies and can run the existing quality gates.
- [ ] `docker-compose.verify.yml` - add an optional one-command wrapper for the verification container with deterministic dummy environment values matching CI.
- [ ] `.dockerignore` - add or update ignore rules so Docker builds do not copy `.next`, `node_modules`, local env files, logs, or other machine-specific artifacts.
- [ ] `package.json` - optionally add a script such as `verify:docker` if reviewer wants a discoverable npm entry point.
- [ ] `README.md` or `docs/verification.md` - document when to use Docker verification, what it does, and what it intentionally does not cover.

The Docker verification command should run the same static quality gates as CI:

```bash
npm ci
npx prisma validate
npx prisma generate
npx tsc --noEmit
npm run test
npm run lint
npm run build
```

## Expected Behavior
- A developer can run one documented Docker command and get the same core quality signal as GitHub CI.
- Docker verification uses Node 22 and deterministic dummy environment values.
- Docker verification does not require real Supabase, database, Resend, service-role, or production secrets.
- Current GitHub CI remains the source of truth for branch acceptance.
- The Docker path is clearly separate from production containerization or deployment.

Proposed dummy environment values should mirror CI where possible:

```text
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder
SUPABASE_SERVICE_ROLE_KEY=placeholder
DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
DIRECT_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
RESEND_API_KEY=re_ci_placeholder
ADMIN_EMAIL=admin@example.com
APPLICATION_UPLOAD_SIGNING_SECRET=ci_test_signing_secret_32_chars_min
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=YellowRiver
```

## Testing
Plan-only verification:

```bash
git diff -- PLAN.md
```

Implementation verification after reviewer approval:

```bash
npm run lint
npm run build
```

Docker verification after implementation:

```bash
docker compose -f docker-compose.verify.yml run --rm verify
```

or, if reviewer prefers npm discoverability:

```bash
npm run verify:docker
```

The container should complete:

```bash
npm ci
npx prisma validate
npx prisma generate
npx tsc --noEmit
npm run test
npm run lint
npm run build
```

CI verification:
- No GitHub CI change is required for the first implementation unless reviewer explicitly asks for it.
- Existing GitHub CI should continue passing unchanged.

## Out Of Scope
- No business logic changes.
- No schema changes or Prisma migrations.
- No Supabase RLS, Storage, Auth, or Data API changes.
- No Supabase local stack in this phase.
- No real database, service-role key, Resend key, or production secrets in Docker verification.
- No production Docker image or deployment workflow.
- No billing, payments, maintenance, lease, inquiry, application, auth, or UI feature changes.
- No Playwright/E2E/browser test setup.
- No Stage 4 durable rate limiting work.

## Notes
- Docker will improve reproducibility for static verification, but it will not replace manual browser/auth/Supabase acceptance checks against a real configured project.
- The Docker build context must avoid copying `.env.local` or any secrets.
- If Docker verification runs `npm ci` inside the container, it may be slower than local checks but should be more reproducible.
- Docker layer caching can be considered, but the first implementation should stay simple and readable.
- If host filesystem permissions create noisy generated files, keep Prisma generation inside the container filesystem or document cleanup expectations.

Reviewer decisions requested:
- Should this be documented as the recommended final local acceptance step before pushing, or as an optional troubleshooting tool?
- Should implementation add an npm script (`verify:docker`) or keep the command as raw `docker compose -f docker-compose.verify.yml run --rm verify`?
- Should Docker verification stay local-only for now, with no GitHub CI changes?
- Should Supabase local stack remain deferred to a later separately planned phase?

Reviewer should approve this plan before any Docker files, scripts, or documentation changes are implemented.
