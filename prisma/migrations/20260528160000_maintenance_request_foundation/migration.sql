-- Phase 6 maintenance request foundation.
-- Maintenance data is accessed through server-side Prisma/API paths only.

CREATE TYPE "MaintenanceRequestStatus" AS ENUM (
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED',
  'CANCELLED'
);

CREATE TYPE "MaintenanceRequestPriority" AS ENUM (
  'LOW',
  'NORMAL',
  'HIGH',
  'URGENT'
);

CREATE TYPE "MaintenanceRequestCategory" AS ENUM (
  'GENERAL',
  'PLUMBING',
  'ELECTRICAL',
  'HVAC',
  'APPLIANCE',
  'OTHER'
);

CREATE TABLE "maintenance_requests" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "lease_id" uuid NOT NULL,
  "property_id" uuid NOT NULL,
  "submitted_by_id" uuid NOT NULL,
  "status" "MaintenanceRequestStatus" NOT NULL DEFAULT 'OPEN',
  "priority" "MaintenanceRequestPriority" NOT NULL DEFAULT 'NORMAL',
  "category" "MaintenanceRequestCategory" NOT NULL DEFAULT 'GENERAL',
  "title" text NOT NULL,
  "description" text NOT NULL,
  "location" text,
  "admin_notes" text,
  "submitted_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolved_at" timestamp(3),
  "cancelled_at" timestamp(3),
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL,

  CONSTRAINT "maintenance_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "maintenance_requests_lease_id_idx"
  ON "maintenance_requests"("lease_id");

CREATE INDEX "maintenance_requests_property_id_idx"
  ON "maintenance_requests"("property_id");

CREATE INDEX "maintenance_requests_submitted_by_id_idx"
  ON "maintenance_requests"("submitted_by_id");

CREATE INDEX "maintenance_requests_status_idx"
  ON "maintenance_requests"("status");

CREATE INDEX "maintenance_requests_priority_idx"
  ON "maintenance_requests"("priority");

CREATE INDEX "maintenance_requests_category_idx"
  ON "maintenance_requests"("category");

CREATE INDEX "maintenance_requests_created_at_idx"
  ON "maintenance_requests"("created_at");

CREATE INDEX "maintenance_requests_property_id_status_idx"
  ON "maintenance_requests"("property_id", "status");

CREATE INDEX "maintenance_requests_status_priority_idx"
  ON "maintenance_requests"("status", "priority");

ALTER TABLE "maintenance_requests"
  ADD CONSTRAINT "maintenance_requests_lease_id_fkey"
  FOREIGN KEY ("lease_id")
  REFERENCES "leases"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

ALTER TABLE "maintenance_requests"
  ADD CONSTRAINT "maintenance_requests_property_id_fkey"
  FOREIGN KEY ("property_id")
  REFERENCES "properties"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

ALTER TABLE "maintenance_requests"
  ADD CONSTRAINT "maintenance_requests_submitted_by_id_fkey"
  FOREIGN KEY ("submitted_by_id")
  REFERENCES "users"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE public.maintenance_requests FROM anon;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE public.maintenance_requests FROM authenticated;
  END IF;
END $$;
