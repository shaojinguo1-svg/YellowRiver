# Plan: Phase 6 Maintenance Request Foundation

## Goal
Add the resident maintenance request foundation on top of the Phase 5 resident portal.

Phase 6 should make it possible for:
- active residents to submit maintenance requests for their current leased property;
- active residents to view their own submitted maintenance requests;
- admins to view and manage maintenance requests from residents;
- the data model to support a future richer maintenance workflow without adding billing, payments, notifications, or attachments now.

No business code should be changed until this Phase 6 plan is approved.

## Proposed Data Model
- [ ] `MaintenanceRequestStatus` — new Prisma enum with `OPEN`, `IN_PROGRESS`, `RESOLVED`, and `CANCELLED`.
  - These four statuses are enough for launch: submitted, being worked, closed successfully, or closed by cancellation.
- [ ] `MaintenanceRequestPriority` — new Prisma enum with `LOW`, `NORMAL`, `HIGH`, and `URGENT`.
  - Default to `NORMAL`.
  - Admin can adjust priority after submission.
- [ ] `MaintenanceRequestCategory` — new Prisma enum with a small launch set such as `GENERAL`, `PLUMBING`, `ELECTRICAL`, `HVAC`, `APPLIANCE`, and `OTHER`.
  - Keep categories simple and operational; do not build category management.
- [ ] `MaintenanceRequest` — new Prisma model representing a resident-submitted request.
  - Tie each request to `Lease`, `Property`, and submitting `User`.
  - Proposed decision: use all three links, not `Lease` only.
    - `leaseId` proves the resident relationship at submission time.
    - `propertyId` makes admin lists and future reporting straightforward.
    - `submittedById` scopes tenant views and preserves who submitted it when a lease has multiple residents.
  - Server-side validation must ensure the `propertyId` matches the selected/current active lease and the submitting user is an active resident on that lease.
  - Fields: `id`, `leaseId`, `propertyId`, `submittedById`, `status`, `priority`, `category`, `title`, `description`, `location`, `adminNotes`, `submittedAt`, `resolvedAt`, `cancelledAt`, `createdAt`, `updatedAt`.
  - `title`, `description`, and optional `location` are tenant-facing.
  - `adminNotes` is internal-only in Phase 6 and must never be returned to tenant routes.
  - Do not add tenant-visible admin response/comment fields in Phase 6; defer that to a future communication phase.
  - Indexes: `leaseId`, `propertyId`, `submittedById`, `status`, `priority`, `category`, `createdAt`, and practical compound indexes for admin status queues.
- [ ] Relation updates.
  - `Lease` has many maintenance requests.
  - `Property` has many maintenance requests.
  - `User` has many submitted maintenance requests.
- [ ] Prisma migration and generated client updates.
  - Include schema migration and generated Prisma client refresh in implementation.
- [ ] Database permission hardening.
  - Enable RLS on new maintenance request table(s).
  - Revoke direct `anon` and `authenticated` table access unless a future phase intentionally uses Supabase Data API.
  - Do not add permissive Supabase Data API policies in Phase 6.
  - Keep access through server-side Prisma/API paths only.

## Admin Workflow
- [ ] Add a focused admin maintenance area, preferably `/admin/maintenance`.
  - Add it to admin navigation.
  - Keep the UI compact and operational, matching the existing admin tool style.
- [ ] Admin can view maintenance requests.
  - Show request title, status, priority, category, property, submitting resident, submitted date, and updated date.
  - Provide simple filters for status and maybe priority/category if the list needs it.
- [ ] Admin can manage request state.
  - Update status among `OPEN`, `IN_PROGRESS`, `RESOLVED`, and `CANCELLED`.
  - Update priority/category if needed.
  - Add/edit internal `adminNotes`.
  - Set `resolvedAt` when status becomes `RESOLVED`; set `cancelledAt` when status becomes `CANCELLED`.
- [ ] Admin notes are internal-only.
  - Do not show `adminNotes` in tenant APIs or tenant UI.
  - Do not label internal notes as messages or replies.
- [ ] No fake controls.
  - Every shown control must persist through an admin-only API/server action.
  - Do not add assignment, scheduling, vendor, invoice, or communication controls unless they are actually implemented.

## Tenant / Resident Workflow
- [ ] Only active residents can submit requests.
  - A tenant without an active lease keeps the current dashboard behavior and cannot access maintenance submission.
  - A tenant with an active lease sees a simple maintenance request entry point in the resident portal.
- [ ] Resident request form.
  - Fields: title, description, optional location, category, and priority.
  - The server derives `leaseId`, `propertyId`, and `submittedById`; tenants should not choose or submit arbitrary IDs.
  - After a successful submission, the resident sees the request in their own list.
- [ ] Resident request list.
  - Tenant can view their own submitted requests for their current active lease.
  - Do not show co-residents' requests in Phase 6.
  - Show tenant-facing fields only: title, description, location, category, priority, status, submitted date, and resolved/cancelled date if present.
  - Do not show internal admin notes.
- [ ] Tenant cancellation.
  - Proposed decision: tenants may cancel their own `OPEN` requests only.
  - Tenants cannot cancel requests that are `IN_PROGRESS`, `RESOLVED`, or already `CANCELLED`.
  - Cancellation must be enforced server-side, not only hidden in UI.
- [ ] No tenant-visible admin response in Phase 6.
  - Status changes are visible.
  - A future phase can add resident/admin comments or tenant-visible response fields with notification and audit expectations.

## API / Security Requirements
- [ ] Admin APIs or server actions must require admin authorization server-side.
  - Proposed route shape:
    - `GET /api/admin/maintenance-requests`
    - `PATCH /api/admin/maintenance-requests/[id]`
  - Admin responses may include internal `adminNotes`.
- [ ] Tenant APIs must require an authenticated user and scope all data by that user.
  - Proposed route shape:
    - `GET /api/tenant/maintenance-requests`
    - `POST /api/tenant/maintenance-requests`
    - `PATCH /api/tenant/maintenance-requests/[id]` for own-open-request cancellation only
  - Tenant `GET` must filter by `submittedById = currentUser.id` and verify the request belongs to a lease where the user is/was a resident as needed for the current resident portal.
  - Tenant `POST` must use the authenticated user's active lease from the server and derive `leaseId` and `propertyId`.
  - Tenant `PATCH` must reject guessed IDs, other residents' requests, and non-open status cancellation.
- [ ] Do not rely on UI hiding.
  - Every route must enforce admin role or tenant ownership.
  - Tenants must never fetch another resident's maintenance request by guessed ID.
- [ ] Keep service role keys server-only.
- [ ] Do not add client-side Supabase reads or writes for maintenance tables.
- [ ] Keep RLS/direct access hardening in the migration, consistent with Phase 5 lease table hardening.
- [ ] API errors should continue using `{ message: "..." }` format.

## Out of Scope
- Maintenance attachments/photos/images.
- File upload, storage buckets, signed URLs, thumbnails, or virus scanning for maintenance.
- Tenant/admin comment threads.
- Tenant-visible admin response text.
- Email/SMS/push notifications.
- Vendor assignment, scheduling, work orders, inspections, or technician workflows.
- Billing, rent ledger, rent payment, Stripe, ACH, invoices, receipts, balances, late fees, or reimbursements.
- Settings persistence.
- Public Supabase Data API access to maintenance tables.
- Major UI redesign or landing page work.
- Approved-application-to-lease conversion.
- Unit model.
- Reopening Phase 1-5 security, upload, auth, email, Settings, inquiry reply, or lease foundation scope except where required to connect active resident checks.

## Testing Strategy
- Run `npx prisma validate`.
- Run `npx prisma generate`.
- Run `npx tsc --noEmit`.
- Run `npm run lint`.
- Run `npm run build`.
- Admin manual test: admin can view submitted maintenance requests.
- Admin manual test: admin can update status, priority/category, and internal notes.
- Admin manual test: resolving a request sets `resolvedAt`; cancelling sets `cancelledAt`.
- Tenant manual test: active resident can submit a maintenance request and sees it in their own list.
- Tenant manual test: tenant without an active lease cannot submit a maintenance request and keeps existing dashboard behavior.
- Tenant manual test: tenant can cancel their own `OPEN` request.
- Tenant/manual negative test: tenant cannot cancel `IN_PROGRESS`, `RESOLVED`, or another resident's request.
- Security/manual negative test: tenant cannot fetch another resident's request by guessed ID.
- Security/manual negative test: tenant response payload does not include `adminNotes`.
- Database review: migration enables RLS and revokes direct `anon`/`authenticated` access for new maintenance table(s).
- Regression spot-check: Phase 5 resident portal lease summary still renders for active residents.
- Regression spot-check: admin residents/leases area still compiles and remains unchanged except for navigation additions if needed.

## Risks / Reviewer Decisions Needed
- Proposed tie strategy: each request should link to `Lease`, `Property`, and submitting `User`. This is slightly redundant but clearer for security, admin queues, and future reporting.
- Proposed cancellation rule: tenants can cancel only their own `OPEN` requests. Admin can cancel any request.
- Proposed launch statuses: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CANCELLED`.
- Proposed notes rule: `adminNotes` is internal-only.
- Proposed tenant communication rule: tenant-visible admin response/commenting is deferred.
- Proposed attachments rule: photos/files are deferred. They need upload limits, storage policy, signed URL handling, moderation/security review, and UI states, so they should not be folded into the foundation phase.
- RLS/direct access hardening should mirror Phase 5. Because Phase 6 uses server-side Prisma/API only, the implementation should enable RLS and revoke direct `anon`/`authenticated` access without adding broad Supabase Data API policies.
- Multi-resident leases create a privacy choice: Phase 6 proposes that tenants see only requests they personally submitted, not all requests on the shared lease.
