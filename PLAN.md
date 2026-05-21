# Plan: Phase 3 Product Polish and Cleanup

## Goal
Close the remaining P2 product trust gaps after Phase 1 and Phase 2: make inquiry reply behavior match what the system actually does, remove the misleading Settings fake form, and clean up known lint warnings without expanding into deferred architecture work.

No business code should be changed until this Phase 3 plan is approved.

## Changes
- [ ] `src/app/admin/inquiries/inquiries-client.tsx` — rename reply UI from “Send Reply” to save-only language, such as “Save Reply Note” / “Update Reply Note”, because the current API only stores `adminReply` in the database.
- [ ] `src/app/admin/inquiries/inquiries-client.tsx` — update success and error copy from “send” wording to “save” wording, and preserve the existing retry behavior that keeps unsaved text when the API fails.
- [ ] `src/app/admin/inquiries/inquiries-client.tsx` — adjust the inquiry status badge label for `REPLIED` if needed so the admin UI does not imply an email was delivered.
- [ ] `src/app/api/inquiries/[id]/route.ts` — keep the route save-only for this phase, but align comments/error messages with “save reply” behavior. Do not add Resend delivery in Phase 3 unless reviewer explicitly requests it.

- [ ] `src/app/admin/settings/page.tsx` — remove or disable the fake editable form and the fake “Save Changes” button. Minimum approved behavior: the page must not present editable controls that appear to persist when they do not.
- [ ] `src/app/admin/settings/page.tsx` — keep the admin navigation target valid with a small non-editable settings/status view, rather than wiring a half-complete form that is not consumed by the public site.

- [ ] `src/app/(tenant)/dashboard/page.tsx` — remove unused `CardHeader` and `CardTitle` imports flagged by lint.
- [ ] `src/app/(tenant)/layout.tsx` — remove unused `createClient` import flagged by lint.

## Expected Behavior
- Admin inquiry replies are clearly treated as saved internal/admin reply notes, not outbound emails.
- Saving or updating a reply note still updates inquiry state, preserves failed draft text, and shows accurate success/error feedback.
- The UI no longer claims “Send Reply” unless a real email is sent in a future phase.
- Settings no longer shows a fake form or a fake save action.
- Existing tenant lint warnings are gone without changing tenant dashboard behavior.

## Testing
- Run `npx prisma validate`.
- Run `npx tsc --noEmit`.
- Run `npm run lint` and confirm the existing three tenant unused-import warnings are gone.
- Run `npm run build`; Next 16 middleware/proxy and SWC fallback warnings may remain as already-approved non-blocking warnings.
- Manually test admin inquiry expand, mark-as-read, save reply note, update reply note, failed save retry, and status badge copy.
- Manually review Settings page and confirm there are no editable fake fields or fake save actions.
- Manually spot-check tenant dashboard still renders after unused import cleanup.

## Notes
- Real outbound inquiry reply email remains deferred. Adding it later should include a Resend helper, delivery error handling, and UI copy that only says “Send” when delivery is attempted.
- Full persisted Settings management remains deferred. The `SiteSettings` model exists, but wiring a form that saves values not consumed by the public site would still be misleading.
- Do not reopen Phase 1 or Phase 2 work in this phase: private document storage, HMAC descriptors, token single-use, admin fail-closed, reset password, build/font, recovery marker, rate limit upgrades, orphan cleanup, signed URL proxy/referrer policy, and Next 16 middleware rename remain out of scope unless they block verification.
