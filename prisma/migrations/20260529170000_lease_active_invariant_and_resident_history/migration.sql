-- Security remediation stage 2: enforce one ACTIVE lease per property.
-- Fail fast if existing data violates the invariant. Do not silently choose
-- or mutate duplicate ACTIVE leases.

DO $$
DECLARE
  duplicate_count integer;
BEGIN
  SELECT COUNT(*)
  INTO duplicate_count
  FROM (
    SELECT "property_id"
    FROM "leases"
    WHERE "status" = 'ACTIVE'
    GROUP BY "property_id"
    HAVING COUNT(*) > 1
  ) AS duplicate_properties;

  IF duplicate_count > 0 THEN
    RAISE EXCEPTION
      'Cannot add leases_one_active_per_property_key: % properties have duplicate ACTIVE leases. Resolve duplicate ACTIVE leases before applying this migration.',
      duplicate_count;
  END IF;
END $$;

CREATE UNIQUE INDEX "leases_one_active_per_property_key"
  ON "leases"("property_id")
  WHERE "status" = 'ACTIVE';
