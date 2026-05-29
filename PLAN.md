# Plan: Security Remediation Stage 2

## Goal
Harden the resident lease foundation after Stage 1.

Stage 2 addresses:
- C3: the "one ACTIVE lease per property" invariant can be broken by concurrent admin requests.
- M3: `updateLease` currently deletes and recreates all `LeaseResident` rows, wiping retained residents' move-in/out and row history.

This plan is for reviewer approval only. Do not change business code until the plan is approved.

## Changes
- [ ] `PLAN.md` — document the approved Stage 2 scope and verification plan.
- [ ] `prisma/migrations/<timestamp>_lease_active_invariant_and_resident_history/migration.sql` — add database protection for one ACTIVE lease per property.
  - Add a pre-migration duplicate detection block before creating the index.
  - Detection should query `leases` grouped by `property_id` where `status = 'ACTIVE'` and fail the migration if any property has more than one ACTIVE lease.
  - The migration must not silently delete, end, cancel, or choose a winning lease if duplicates exist.
  - If duplicates exist, migration should raise a clear error so an admin/reviewer can manually resolve the data first.
  - Add a partial unique index:
    `CREATE UNIQUE INDEX ... ON "leases"("property_id") WHERE "status" = 'ACTIVE';`
  - Keep this as raw SQL because Prisma schema cannot safely represent a partial unique index.
- [ ] `prisma/schema.prisma` — document the raw database invariant if useful.
  - Do not add a Prisma `@@unique([propertyId, status])`, because that would block historical non-ACTIVE leases too broadly.
  - If touched, add only a short schema comment near `Lease` indexes noting that a raw partial unique index enforces one ACTIVE lease per property.
- [ ] `src/lib/resident-leases.ts` — make lease create/update transaction behavior concurrency-safe.
  - Keep `validateActiveLeaseConflicts` for friendly admin validation messages before write.
  - Run `createLease` and `updateLease` transaction bodies with Serializable isolation where Prisma/Postgres supports it.
  - Add a small bounded retry wrapper for serialization conflicts and race outcomes.
  - Treat Prisma serialization conflict errors, such as `P2034`, as retryable.
  - Map the partial unique index violation for ACTIVE property conflicts to `LeaseValidationError("This property already has an active lease")`.
  - Preserve existing 400/404 style validation behavior for known admin input problems.
- [ ] `src/lib/resident-leases.ts` — preserve `LeaseResident` history on `updateLease`.
  - Replace `deleteMany` plus `createMany` with a resident diff.
  - Compute retained, added, and removed resident IDs inside the same transaction.
  - Retained residents:
    - keep existing row `id`, `createdAt`, `moveInDate`, and `moveOutDate`;
    - update `isPrimary` in place;
    - do not reset `moveInDate` just because lease basics changed.
  - Added residents:
    - create new rows with `moveInDate` set to the lease start date, matching current create behavior.
  - Removed residents:
    - represent removal by setting `moveOutDate` to the current timestamp instead of deleting the row.
    - set `isPrimary` to false for removed rows.
    - keep the row for history.
  - Current active-lease lookup already excludes rows with `moveOutDate <= now`, so soft removal should not keep a removed resident active.
  - Re-adding a previously removed resident on the same lease needs a safe strategy because `@@unique([leaseId, userId])` allows only one row:
    - preferred: reactivate the existing row by clearing `moveOutDate` and updating `isPrimary`;
    - do not create a duplicate row for the same `leaseId/userId`.

## Expected Behavior
- The database rejects a second ACTIVE lease for the same property even under concurrent admin requests.
- Existing app-level checks still give admins clear conflict messages in normal non-racy flows.
- Serializable transaction conflicts are retried a bounded number of times before returning a safe error.
- Editing lease rent, dates, notes, or primary resident no longer wipes retained residents' history.
- Removing a resident from a lease preserves their `LeaseResident` row with `moveOutDate`.
- Removed residents no longer appear as active residents for dashboard/current-lease logic.
- Re-adding a removed resident on the same lease reuses the historical row safely.

## Out of Scope
- Billing, rent ledger, payments, Stripe/ACH, invoices, receipts, or balances.
- Maintenance request changes.
- Application document upload/download changes.
- Durable rate limiting or Stage 4 work.
- Stage 3 upload hardening.
- New lease UI redesign.
- New resident roles beyond the existing `isPrimary`.
- Unit model.
- Approved-application-to-lease conversion.
- Public Supabase client reads/writes for lease data.

## Testing
- Run `npx prisma validate`.
- Run `npx prisma generate`.
- Run `npx tsc --noEmit`.
- Run `npm run lint`.
- Run `npm run build`.
- Migration preflight check:
  - run a read-only duplicate query before applying the migration:
    `SELECT property_id, COUNT(*), array_agg(id) FROM leases WHERE status = 'ACTIVE' GROUP BY property_id HAVING COUNT(*) > 1;`
  - confirm zero rows before applying the unique partial index.
  - if rows exist, stop and resolve manually; do not auto-delete or auto-cancel.
- Database verification:
  - after migration, attempt to insert or create a second ACTIVE lease for the same property and confirm the database rejects it.
  - confirm DRAFT/ENDED/CANCELLED historical leases for the same property are still allowed.
- Lease concurrency verification:
  - simulate two concurrent ACTIVE lease creates for the same property.
  - expected result: one succeeds, the other returns a friendly conflict or a safe retry-exhausted error; no duplicate ACTIVE leases exist afterward.
- Lease resident preservation verification:
  - create a lease with residents A and B.
  - edit lease basics without changing residents; confirm A/B `LeaseResident.createdAt`, `moveInDate`, and `moveOutDate` are preserved.
  - change primary resident; confirm retained rows remain and only `isPrimary` changes.
  - remove resident B; confirm B row remains with `moveOutDate` set and no longer appears in current active lease lookup.
  - re-add resident B to the same lease; confirm the existing row is reactivated instead of creating a duplicate.

## Risks / Reviewer Decisions
- The migration will fail if duplicate ACTIVE leases already exist. Reviewer should confirm this fail-fast behavior is preferred over any automatic cleanup.
- Soft-removing residents with `moveOutDate = now` preserves history and matches current active lookup logic. Reviewer should confirm this is the desired Phase 2 behavior.
- Re-adding a removed resident will clear `moveOutDate` on the existing `leaseId/userId` row. Reviewer should confirm this is acceptable given the current unique constraint.
- If Serializable conflicts remain after bounded retries, the endpoint should return a generic safe save failure rather than looping indefinitely.
- Reviewer approval is required before implementation.
