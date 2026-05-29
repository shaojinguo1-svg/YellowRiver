-- Security remediation stage 1: model valid contact inquiry property links.
-- Existing dangling references must be nulled before adding the FK.

UPDATE "contact_inquiries" AS ci
SET "property_id" = NULL
WHERE ci."property_id" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "properties" AS p
    WHERE p."id" = ci."property_id"
  );

CREATE INDEX "contact_inquiries_property_id_idx"
  ON "contact_inquiries"("property_id");

ALTER TABLE "contact_inquiries"
  ADD CONSTRAINT "contact_inquiries_property_id_fkey"
  FOREIGN KEY ("property_id")
  REFERENCES "properties"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
