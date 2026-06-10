# Plan: Make the Email Sender Address Configurable (`EMAIL_FROM`)

## Goal
Today the Resend "from" address is hard-coded in `src/lib/email.ts:15`
(`YellowRiver <noreply@yellowriver.com>`). That domain is not verified in
Resend, so every send fails until either the domain is verified or the code is
edited. Make the sender address configurable via an `EMAIL_FROM` environment
variable so the owner can switch sending identity (test sender now, verified
domain later) without a code change.

Chosen path for now: **test mode** using Resend's `onboarding@resend.dev`
sender (no domain verification required).

The email-sending code itself is already complete (Resend client, HTML
escaping, graceful skip/fail handling, all templates, wired into the
applications and inquiries APIs). This change is configuration plumbing only —
no new templates, no new send sites.

## Changes
- [ ] `src/lib/email.ts`
  - Replace the module-level `const fromEmail = "..."` with a resolver read at
    send time inside `sendOptionalEmail`, e.g.:
    `const DEFAULT_FROM = "YellowRiver <noreply@yellowriver.com>";`
    `function resolveFromAddress() { return process.env.EMAIL_FROM?.trim() || DEFAULT_FROM; }`
  - Use `resolveFromAddress()` as the `from` in the `emails.send(...)` call.
  - Reading at send time (not module load) keeps it test-friendly and avoids
    freezing the value at import.
- [ ] `.env.example`
  - Add `EMAIL_FROM=YellowRiver <noreply@yellowriver.com>` with a comment
    documenting: test mode = `onboarding@resend.dev`; production = an address
    on a Resend-verified domain.
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
  applicant address) will be rejected/undelivered in test mode — that is
  expected until a real domain is verified. The realistic test is the **admin
  notification** to your own inbox.

## Testing
- `npx tsc --noEmit` && `npm run lint` && `npm run test` && `npm run build`
- With the env set, submit a contact inquiry at `/contact`:
  - Expect an email at `ADMIN_EMAIL` (your Resend signup inbox).
  - Server log shows no `[email] ... failed/skipped` line for
    `sendAdminContactInquiryNotification` (a successful send logs nothing).
- Negative/diagnostic check: temporarily unset `RESEND_API_KEY` → log shows
  `[email] sendAdminContactInquiryNotification skipped … missing_RESEND_API_KEY`
  (confirms the wiring and the graceful-skip path).
- `EMAIL_FROM` unset → falls back to `DEFAULT_FROM` (no crash).

## Out of Scope / Follow-up
- Domain verification + production `EMAIL_FROM` (separate step once a sending
  domain is available).
- Calling `sendInquiryConfirmation` (defined but currently unused) — that is a
  product decision tracked separately, not part of this config change.
- Any change to which events trigger email.

Reviewer/owner approve before implementation.
