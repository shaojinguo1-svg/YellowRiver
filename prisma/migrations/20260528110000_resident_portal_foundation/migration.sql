-- Phase 5 resident portal foundation: leases and lease residents.
-- Active lease conflicts are enforced in application code for this phase.

CREATE TYPE "LeaseStatus" AS ENUM (
  'DRAFT',
  'ACTIVE',
  'ENDED',
  'CANCELLED'
);

CREATE TABLE "leases" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "property_id" uuid NOT NULL,
  "status" "LeaseStatus" NOT NULL DEFAULT 'DRAFT',
  "start_date" timestamp(3) NOT NULL,
  "end_date" timestamp(3),
  "rent_amount" numeric(10, 2) NOT NULL,
  "security_deposit" numeric(10, 2),
  "occupant_count" integer NOT NULL DEFAULT 1,
  "notes" text,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL,

  CONSTRAINT "leases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lease_residents" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "lease_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "is_primary" boolean NOT NULL DEFAULT false,
  "move_in_date" timestamp(3),
  "move_out_date" timestamp(3),
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL,

  CONSTRAINT "lease_residents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "leases_property_id_idx"
  ON "leases"("property_id");

CREATE INDEX "leases_status_idx"
  ON "leases"("status");

CREATE INDEX "leases_property_id_status_idx"
  ON "leases"("property_id", "status");

CREATE UNIQUE INDEX "lease_residents_lease_id_user_id_key"
  ON "lease_residents"("lease_id", "user_id");

CREATE INDEX "lease_residents_lease_id_idx"
  ON "lease_residents"("lease_id");

CREATE INDEX "lease_residents_user_id_idx"
  ON "lease_residents"("user_id");

ALTER TABLE "leases"
  ADD CONSTRAINT "leases_property_id_fkey"
  FOREIGN KEY ("property_id")
  REFERENCES "properties"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

ALTER TABLE "lease_residents"
  ADD CONSTRAINT "lease_residents_lease_id_fkey"
  FOREIGN KEY ("lease_id")
  REFERENCES "leases"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "lease_residents"
  ADD CONSTRAINT "lease_residents_user_id_fkey"
  FOREIGN KEY ("user_id")
  REFERENCES "users"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lease_residents ENABLE ROW LEVEL SECURITY;

-- Lease data is only accessed through server-side Prisma/API paths in Phase 5.
-- Direct Supabase Data API access for anon/authenticated roles stays closed.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE public.leases FROM anon;
    REVOKE ALL ON TABLE public.lease_residents FROM anon;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE public.leases FROM authenticated;
    REVOKE ALL ON TABLE public.lease_residents FROM authenticated;
  END IF;
END $$;
