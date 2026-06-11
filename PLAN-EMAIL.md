# Plan: Make the Email Sender Address Configurable (`EMAIL_FROM`)

> **Status: APPROVED with amendments (review incorporated below).**
> Review findings replaced two parts of the original draft:
> (1) a required bug fix — the Resend SDK never throws on API errors, so the
> existing try/catch is dead code and every provider rejection was reported
> as "sent"; (2) missing `EMAIL_FROM` now SKIPS with a logged reason instead
> of falling back to the unverified default domain.

## Goal
Today the Resend "from" address is hard-coded in `src/lib/email.ts:15`
(`YellowRiver <noreply@yellowriver.com>`). That domain is not verified in
Resend, so every send fails until either the domain is verified or the code is
edited. Make the sender address configurable via an `EMAIL_FROM` environment
variable so the owner can switch sending identity (test sender now, verified
domain later) without a code change — and make provider failures actually
visible (today they are silently swallowed, see amendment 1a).

Chosen path for now: **test mode** using Resend's `onboarding@resend.dev`
sender (no domain verification required).

The email-sending code itself is already complete (Resend client, HTML
escaping, graceful skip/fail handling, all templates, wired into the
applications and inquiries APIs). This change is configuration plumbing plus
one error-reporting bug fix — no new templates, no new send sites.

## Changes
- [ ] `src/lib/email.ts` — three changes:
  - **(1a) REQUIRED BUG FIX:** `emails.send()` resolves with a
    `{ data, error }` union and never throws on API errors (verified against
    installed resend 6.9.3: `ErrorResponse = { message, statusCode, name }`).
    The existing try/catch is dead code — provider rejections (unverified
    domain, test-mode recipient restriction, quota) were reported as "sent"
    and logged nowhere. In `sendOptionalEmail`, destructure `error` from the
    resolved value and return a "failed" result carrying `error.name` and
    `error.message`. Keep the surrounding try/catch for unexpected throws.
  - **(1b) Configurable sender, skip-on-missing (NOT a fallback):** remove
    the module-level `const fromEmail`. Do NOT fall back to the unverified
    yellowriver.com default. Resolve at send time inside `sendOptionalEmail`:
    trimmed `process.env.EMAIL_FROM`, and if unset/blank return a "skipped"
    result with reason `missing_EMAIL_FROM` — mirroring the existing
    `missing_RESEND_API_KEY` / `missing_ADMIN_EMAIL` skip taxonomy and
    avoiding doomed provider calls. No CR/LF stripping or "Name <addr>"
    shape validation: the value is operator-controlled, goes into a JSON API
    body, and Resend validates sender addresses server-side.
  - **(1c) Async hardening:** add `.catch((err) => console.error("[email]
    unexpected", err))` to the three fire-and-forget chains
    (`src/app/api/applications/route.ts` ~248,
    `src/app/api/applications/[id]/route.ts` ~203,
    `src/app/api/inquiries/route.ts` ~107). The helpers shouldn't reject,
    but an unhandled rejection is process-fatal on Node >= 15.
- [ ] `.env.example`
  - Add under the Resend section, with the test-mode value as the example:
    `EMAIL_FROM=onboarding@resend.dev`, documenting: test mode delivers ONLY
    to the Resend account owner's email; production = an address on a
    Resend-verified domain (e.g. `"YellowRiver <noreply@yourdomain.com>"`);
    unset ⇒ sends are skipped and logged as `missing_EMAIL_FROM`.
  - Extend the existing `ADMIN_EMAIL` comment: warn that `ADMIN_EMAIL` is
    ALSO the bootstrap admin login identity used by `scripts/create-admin.ts`
    and the seed fallback in `scripts/seed-properties.ts` — in test mode it
    must equal the Resend signup email for notifications to arrive, and
    re-running `create-admin.ts` afterwards will create/promote an admin
    under that address.
- [ ] `src/lib/email.test.ts` (new; vitest is configured — follow
  `src/lib/rate-limit.test.ts` conventions). Mock the `resend` module and
  assert:
  - `EMAIL_FROM` set ⇒ its trimmed value is passed as `from`;
  - `EMAIL_FROM` unset/blank ⇒ result is skipped / `missing_EMAIL_FROM`, no
    send call made;
  - send resolving `{ data: null, error: { name, message, statusCode } }` ⇒
    result is "failed" with that error name and message (pins bug fix 1a);
  - send resolving `{ data: { id }, error: null }` ⇒ result is "sent".
  - Reset `process.env` between tests.
- [ ] No schema, API, or template changes.

## Owner configuration (not committed — done by hand in `.env.local`)
Set these three and restart the dev server (env changes are not hot-reloaded):

```
RESEND_API_KEY=re_<real key from resend.com → API Keys>
EMAIL_FROM=onboarding@resend.dev
ADMIN_EMAIL=<the email you signed up to Resend with>
```

## ⚠️ Test-mode constraints (important, will shape the test result)
- `onboarding@resend.dev` can only deliver to the email address that owns the
  Resend account. So in test mode, **`ADMIN_EMAIL` must equal your Resend
  signup email**, or the admin notifications will not arrive.
- Applicant-facing emails (`sendApplicationConfirmation` to an arbitrary
  applicant address) will be REJECTED by Resend in test mode — after fix 1a
  this now correctly produces a logged `[email] … failed` line instead of
  silently reporting "sent". That rejection is the end-to-end proof of error
  propagation.

## Testing
- `npx tsc --noEmit` && `npm run lint` && `npm run test` && `npm run build`
- Live positive (owner env set): submit a contact inquiry at `/contact` —
  confirm the email arrives at `ADMIN_EMAIL` AND appears as delivered in the
  Resend dashboard Emails log (log-absence alone is not proof of success).
- Live negative (proves 1a end-to-end): with `EMAIL_FROM=onboarding@resend.dev`,
  trigger a send to any non-owner recipient (e.g. submit a rental application
  with an arbitrary applicant email) ⇒ expect a console line
  `[email] sendApplicationConfirmation failed` carrying Resend's
  testing-restriction message — previously silent.
- Negative: unset `RESEND_API_KEY` ⇒ `[email] … skipped` with
  `missing_RESEND_API_KEY`; unset `EMAIL_FROM` ⇒ skipped with
  `missing_EMAIL_FROM` (replaces the old "falls back to DEFAULT_FROM"
  expectation).

## Sequencing
PLAN.md's resend bump 6.9.3 → 6.12.4 is non-breaking for this change
(constructor params additive; send signature and `{ data, error }` shape
unchanged) — land in either order.

## Out of Scope / Follow-up
- Domain verification + production `EMAIL_FROM` (separate step once a sending
  domain is available).
- Calling `sendInquiryConfirmation` (defined but currently unused) — product
  decision tracked separately.
- A dedicated notification-recipient env var separate from `ADMIN_EMAIL`
  (documented follow-up).
- Any change to which events trigger email.
