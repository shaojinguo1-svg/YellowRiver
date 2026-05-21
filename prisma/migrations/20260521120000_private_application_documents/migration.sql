-- Phase 1 launch security: application documents are private objects.
-- Permanent public URLs are legacy-only; storage_path is the source of truth.

CREATE TYPE "ApplicationDocumentCategory" AS ENUM (
  'GOVERNMENT_ID',
  'PROOF_OF_INCOME',
  'ADDITIONAL'
);

ALTER TABLE "application_documents"
  ADD COLUMN "category" "ApplicationDocumentCategory" NOT NULL DEFAULT 'ADDITIONAL';

ALTER TABLE "application_documents"
  ALTER COLUMN "url" DROP NOT NULL;

CREATE INDEX "application_documents_category_idx"
  ON "application_documents"("category");

CREATE TABLE "application_upload_tokens" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "upload_session_id" uuid NOT NULL,
  "nonce" text NOT NULL,
  "storage_path" text NOT NULL,
  "category" "ApplicationDocumentCategory" NOT NULL,
  "file_name" text NOT NULL,
  "file_size" integer NOT NULL,
  "mime_type" text NOT NULL,
  "signature" text NOT NULL,
  "expires_at" timestamp(3) NOT NULL,
  "consumed_at" timestamp(3),
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "application_upload_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "application_upload_tokens_nonce_key"
  ON "application_upload_tokens"("nonce");

CREATE UNIQUE INDEX "application_upload_tokens_storage_path_key"
  ON "application_upload_tokens"("storage_path");

CREATE INDEX "application_upload_tokens_upload_session_id_idx"
  ON "application_upload_tokens"("upload_session_id");

CREATE INDEX "application_upload_tokens_expires_at_idx"
  ON "application_upload_tokens"("expires_at");
