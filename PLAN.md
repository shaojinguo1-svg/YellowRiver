# Plan: Phase 5 Resident Portal Foundation

## Goal
Create the resident/tenant portal foundation without implementing maintenance requests, billing, or rent payments yet.

Phase 5 should make it possible for:
- admins to manually associate tenant users with a property through a lease/resident relationship;
- the tenant dashboard to become a resident portal when the signed-in user has an active lease/resident relationship;
- the data model to support future maintenance requests, bills, rent ledger, and payments without designing those later tables in this phase.

No business code should be changed until this Phase 5 plan is approved.

## Proposed Data Model
- [ ] `LeaseStatus` — new Prisma enum with `DRAFT`, `ACTIVE`, `ENDED`, and `CANCELLED`.
- [ ] `Lease` — new Prisma model representing a lease for one `Property`.
  - Fields: `id`, `propertyId`, `status`, `startDate`, `endDate`, `rentAmount`, `securityDeposit`, `occupantCount`, `notes`, `createdAt`, `updatedAt`.
  - Use `Decimal` for `rentAmount` and `securityDeposit`.
  - Use optional text for `notes`.
  - Use `Property` as the leased asset. Do not add a `Unit` model in Phase 5.
  - Relations: belongs to `Property`; has many `LeaseResident` rows.
  - Indexes: `propertyId`, `status`, and practical active-lease lookup indexes.
- [ ] `LeaseResident` — join model between `Lease` and `User`.
  - Supports multiple residents per lease at the data model level.
  - Allows one user to have historical leases.
  - Fields: `id`, `leaseId`, `userId`, `isPrimary`, `moveInDate`, `moveOutDate`, `createdAt`, `updatedAt`.
  - Use `isPrimary` only in Phase 5. Do not add resident roles such as guarantor, occupant, or co-resident yet.
  - Relations: belongs to `Lease`; belongs to `User`.
  - Constraints: unique pair of `leaseId` + `userId`; index `userId` and `leaseId`.
  - Active resident relationship is derived from an `ACTIVE` lease plus a resident row whose `moveOutDate` is null or in the future.
- [ ] `User` relation updates — expose lease/resident relationships from the user side for admin and tenant lookups.
- [ ] `Property` relation updates — expose leases from the property side.
- [ ] Prisma migration and generated client updates — include the schema migration and generated Prisma client changes in the Phase 5 implementation.
- [ ] Active lease validation — enforce server-side in admin create/update routes:
  - reject more than one `ACTIVE` lease for the same `Property` at the same time;
  - allow historical leases for a user;
  - reject multiple active leases for the same user unless the user is being attached as a co-resident on the same active lease;
  - add DB-level constraints only if they are straightforward and compatible with Prisma/Postgres migrations; do not add risky custom constraints without testing.
- [ ] Future placeholders only — document that maintenance requests, bills, rent ledger entries, and payment records should later reference `Lease` and likely `Property`/`User`, but do not create those models in Phase 5.

## Admin Workflows
- [ ] Add a focused admin Residents/Leases area at `/admin/residents`.
  - Add `/admin/residents` to admin navigation.
  - Admin can view users with role `TENANT`.
  - Admin can see whether each tenant has an active lease/resident relationship.
  - Admin can see active lease status for tenant users.
  - Avoid fake controls; every shown action must persist or be read-only.
- [ ] Add a compact admin lease/resident assignment flow.
  - Admin can select an existing tenant user.
  - Admin can optionally attach additional tenant users to the same lease.
  - Admin can select an existing property.
  - Admin can create a lease with required lease basics: status, dates, rent amount, security deposit, `occupantCount`, and optional notes.
  - Admin must attach at least one resident user to the lease.
  - Admin can mark one resident as primary with `isPrimary`.
- [ ] Add read/update basics for existing leases only as needed for launch readiness.
  - Admin can see active/inactive lease status.
  - Admin can correct lease basics and resident membership.
  - Admin create/update must enforce the active property and active user conflict rules.
  - Keep the UI operational and compact; no large redesign or marketing-style page.
- [ ] Manual lease creation only in Phase 5.
  - Do not implement approved-application-to-lease conversion in Phase 5.
  - Approved application conversion can be planned as a future phase after the resident model is stable.

## Tenant / Resident Workflows
- [ ] Tenant dashboard remains unchanged for tenants without an active lease/resident relationship.
  - They should still see the current application-focused dashboard behavior.
- [ ] Tenant dashboard becomes a resident portal summary when the signed-in user has an active lease/resident relationship.
  - Show property basics: title/address or city/state, property link if available.
  - Show lease basics: lease status, start/end dates, rent amount, security deposit, `occupantCount`, and primary/resident names if appropriate.
  - Keep the portal summary read-only in Phase 5.
- [ ] Do not add maintenance request UI yet.
- [ ] Do not add billing, rent ledger, rent payment, balance due, Stripe, ACH, or card UI yet.
- [ ] Do not add maintenance, billing, payment, balance, or action buttons.
- [ ] Do not imply actions that are not implemented. Use simple read-only sections rather than fake controls.

## API / Security
- [ ] Admin lease list/create/update endpoints or server actions must require admin authorization server-side.
  - Route shape can be API routes or server actions, but it must cover admin list/create/update for leases and resident associations.
  - Admin create/update must validate active lease conflicts for both property and resident users.
- [ ] Tenant current lease summary endpoint/page query must scope by authenticated user.
  - A tenant can only read leases where they have a `LeaseResident` row.
  - A tenant cannot fetch another tenant's lease by guessing IDs.
  - Tenant queries should return only the current user's active lease summary needed by the dashboard.
  - API protections must not rely on UI hiding.
- [ ] Keep Supabase service role keys server-only.
- [ ] Keep Prisma queries scoped by authenticated user/admin role.
- [ ] Do not expose private application documents or unrelated tenant data through resident portal routes.

## Out of Scope
- Maintenance request implementation.
- Maintenance request admin queues or tenant forms.
- Bill issuing.
- Rent ledger.
- Stripe/payment processing.
- ACH/card storage.
- Payment methods, invoices, receipts, balances, late fees, or rent autopay.
- Approved-application-to-lease conversion.
- `Unit` model or per-unit leasing.
- Resident roles beyond `isPrimary`.
- Settings persistence.
- Large UI redesign.
- Email changes.
- CI changes unless schema/build verification requires a small adjustment.
- Resident portal features beyond read-only lease/property summary and admin lease/resident assignment foundation.
- Reopening Phase 1-4 security, upload, auth, email, Settings, or inquiry reply work.

## Testing
- Run `npx prisma validate`.
- Run `npx prisma generate`.
- Run `npx tsc --noEmit`.
- Run `npm run lint`.
- Run `npm run build`.
- Admin manual test: create a lease/resident relationship linking an existing tenant user to an existing property.
- Admin manual test: attach at least one tenant and optionally an additional tenant to the same lease.
- Admin manual test: verify resident status is visible and persisted.
- Admin/manual negative test: active lease conflict for the same property is rejected.
- Admin/manual negative test: active lease conflict for the same user is rejected when creating a separate active lease.
- Admin manual test: co-resident on the same active lease is allowed.
- Tenant manual test: tenant with an active lease sees the resident portal summary with only property/lease basics.
- Tenant manual test: tenant without an active lease still sees the current application dashboard behavior.
- Security/manual negative test: tenant cannot access another resident's lease data by URL or API request.
- Regression spot-check: existing application dashboard data still renders for non-resident tenants.
- Regression spot-check: admin application/inquiry/listing flows still compile and are not redesigned.

## Risks / Implementation Notes
- Multiple residents are supported at the data model level through `LeaseResident`; Phase 5 UI should stay minimal and only support attaching one or more tenant users without building a full household manager.
- Lease creation is manual-only in Phase 5. Approved-application conversion is intentionally deferred to a future phase.
- `Property` is the leased asset in Phase 5. Because there is no `Unit` model, the implementation must prevent more than one active lease for the same property.
- Users may have historical leases, but Phase 5 should prevent multiple active leases per user except when the user is a co-resident on the same active lease.
- DB-level active-lease constraints are useful only if straightforward in Prisma/Postgres. Prefer tested server-side validation over risky custom constraints.
- `isPrimary` is the only resident role in Phase 5. Richer roles can be introduced when there is a real workflow for guarantors or occupants.
