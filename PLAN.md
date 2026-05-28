# Plan: Phase 5 Resident Portal Foundation

## Goal
Create the resident/tenant portal foundation without implementing maintenance requests, billing, or rent payments yet.

Phase 5 should make it possible for:
- admins to associate a user/tenant with a property through a lease or resident relationship;
- the tenant dashboard to become a resident portal when the signed-in user has an active lease/resident relationship;
- the data model to support future maintenance requests, bills, rent ledger, and payments without designing those payment tables in this phase.

No business code should be changed until this Phase 5 plan is approved.

## Proposed Data Model
- [ ] `Lease` — new Prisma model representing a lease for one property and one or more residents.
  - Fields: `id`, `propertyId`, `status`, `startDate`, `endDate`, `rentAmount`, `securityDeposit`, `occupants`, `notes`, `createdAt`, `updatedAt`.
  - Status enum: `DRAFT`, `ACTIVE`, `ENDED`, `CANCELLED`.
  - Relations: belongs to `Property`; has many `LeaseResident` rows.
  - Indexes: `propertyId`, `status`, and a practical lookup for active leases by property/status.
- [ ] `LeaseResident` — join model between `Lease` and `User` so multiple residents can share one lease and one user can have historical leases.
  - Fields: `id`, `leaseId`, `userId`, `isPrimary`, `moveInDate`, `moveOutDate`, `createdAt`, `updatedAt`.
  - Relations: belongs to `Lease`; belongs to `User`.
  - Constraints: unique pair of `leaseId` + `userId`; index `userId` and `leaseId`.
  - Active resident relationship is derived from an `ACTIVE` lease plus a resident row whose `moveOutDate` is null or in the future.
- [ ] `User` relation updates — expose lease/resident relationships from the user side for admin and tenant lookups.
- [ ] `Property` relation updates — expose leases from the property side.
- [ ] Future placeholders only — document that maintenance requests, bills, rent ledger entries, and payment records should later reference `Lease` and likely `Property`/`User`, but do not create those models in Phase 5.

## Admin Workflows
- [ ] Add a minimal admin tenants/residents view or extend the existing admin area with a focused page for user/tenant lookup.
  - Admin can view users with role `TENANT`.
  - Admin can see whether each tenant has an active lease/resident relationship.
  - Avoid fake controls; every shown action must persist or be read-only.
- [ ] Add a minimal admin lease/resident assignment flow.
  - Admin can select an existing tenant user.
  - Admin can select an existing property.
  - Admin can create a lease with required lease basics: status, dates, rent amount, security deposit, occupants, notes.
  - Admin can attach at least one resident user to the lease.
  - Admin can mark one resident as primary if multiple residents are supported in the implementation.
- [ ] Add read/update basics for existing leases only as needed for launch readiness.
  - Admin can see active/inactive lease status.
  - Admin can correct lease basics and resident membership.
  - Keep the UI operational and compact; no large redesign or marketing-style page.
- [ ] Keep approved applications separate in Phase 5 unless reviewer approves conversion.
  - Manual lease creation is the default plan.
  - Approved-application-to-lease conversion is a reviewer question, not assumed implementation.

## Tenant / Resident Workflows
- [ ] Tenant dashboard remains unchanged for tenants without an active lease/resident relationship.
  - They should still see the current application-focused dashboard behavior.
- [ ] Tenant dashboard becomes a resident portal summary when the signed-in user has an active lease/resident relationship.
  - Show property basics: title/address or city/state, property link if available.
  - Show lease basics: lease status, start/end dates, rent amount, security deposit, occupants, and primary resident/resident names if appropriate.
  - Keep the portal summary read-only in Phase 5.
- [ ] Do not add maintenance request UI yet.
- [ ] Do not add billing, rent ledger, rent payment, balance due, Stripe, ACH, or card UI yet.
- [ ] Do not imply actions that are not implemented. Use simple read-only sections or disabled-free layouts rather than fake buttons.

## API / Security
- [ ] Admin routes must enforce admin authorization server-side before creating or updating leases and resident associations.
- [ ] Tenant/resident routes must enforce ownership server-side.
  - A tenant can only read leases where they have a `LeaseResident` row.
  - A tenant cannot fetch another tenant's lease by guessing IDs.
  - API protections must not rely on UI hiding.
- [ ] Add route/API shape only as needed for Phase 5.
  - Admin create/update/list lease associations.
  - Tenant read current active lease/resident summary.
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
- Admin manual test: create or assign a lease/resident relationship linking an existing tenant user to an existing property.
- Admin manual test: verify resident status is visible and persisted.
- Tenant manual test: tenant with an active lease sees the resident portal summary with only property/lease basics.
- Tenant manual test: tenant without an active lease still sees the current application dashboard behavior.
- Security/manual negative test: tenant cannot access another tenant's lease/resident data by URL or API request.
- Regression spot-check: existing application dashboard data still renders for non-resident tenants.
- Regression spot-check: admin application/inquiry/listing flows still compile and are not redesigned.

## Risks / Reviewer Questions
- Should Phase 5 support multiple residents per lease immediately? Recommended default is yes at the data model level via `LeaseResident`, while keeping UI minimal enough to add one or more residents without building a full household manager.
- Should lease creation be manual-only, or should admins convert approved applications into leases? Recommended default is manual-only in Phase 5; conversion can be a later workflow once the resident model is stable.
- What is the minimum admin UI for assigning a resident without overbuilding? Recommended default is a compact admin page or section that lists tenants and provides a persisted create/edit lease form for required lease basics.
- Do we need a `Unit` model, or is `Property` enough for now? Recommended default is `Property` only for Phase 5, unless current property data clearly represents multi-unit buildings that need per-unit leases before launch.
- Should `LeaseResident` include a resident role such as primary, co-resident, guarantor, or occupant? Recommended default is `isPrimary` only in Phase 5; richer resident roles can wait.
- Should a user be allowed more than one active lease at a time? Recommended default is allow historical leases but avoid multiple active leases per user through validation unless reviewer identifies a real multi-property scenario.
