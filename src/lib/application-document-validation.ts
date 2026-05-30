import { createHmac, timingSafeEqual } from "crypto";
import type { ApplicationDocumentDescriptor } from "@/validations/application";

export const APPLICATION_DOCUMENTS_BUCKET = "application-documents";
export const MAX_APPLICATION_DOCUMENT_SIZE = 10 * 1024 * 1024;
export const APPLICATION_DOCUMENT_UPLOAD_TTL_MS = 30 * 60 * 1000;
export const APPLICATION_DOCUMENT_READ_TTL_SECONDS = 120;
export const MAX_PENDING_APPLICATION_UPLOAD_TOKENS = 10;

export const APPLICATION_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

const MIME_TO_EXTENSION: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

const DOCUMENT_SIGNATURES: Record<string, number[]> = {
  "application/pdf": [0x25, 0x50, 0x44, 0x46, 0x2d],
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
};

export type ApplicationDocumentDescriptorPayload = Omit<
  ApplicationDocumentDescriptor,
  "signature"
>;

export class UploadDescriptorError extends Error {
  status = 400;
}

function getSigningSecret() {
  const secret = process.env.APPLICATION_UPLOAD_SIGNING_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("APPLICATION_UPLOAD_SIGNING_SECRET is not configured");
  }
  return secret;
}

function canonicalPayload(payload: ApplicationDocumentDescriptorPayload) {
  return JSON.stringify({
    version: payload.version,
    uploadSessionId: payload.uploadSessionId,
    nonce: payload.nonce,
    storagePath: payload.storagePath,
    category: payload.category,
    fileName: payload.fileName,
    fileSize: payload.fileSize,
    mimeType: payload.mimeType,
    expiresAt: payload.expiresAt,
  });
}

export function signApplicationDocumentDescriptor(
  payload: ApplicationDocumentDescriptorPayload,
  secret = getSigningSecret()
) {
  return createHmac("sha256", secret)
    .update(canonicalPayload(payload))
    .digest("base64url");
}

function signaturesMatch(expected: string, actual: string) {
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);
  return (
    expectedBuffer.length === actualBuffer.length &&
    timingSafeEqual(expectedBuffer, actualBuffer)
  );
}

export function verifyDescriptorSignature(
  descriptor: ApplicationDocumentDescriptor,
  secret = getSigningSecret()
) {
  const { signature, ...payload } = descriptor;
  const expected = signApplicationDocumentDescriptor(payload, secret);
  if (!signaturesMatch(expected, signature)) {
    throw new UploadDescriptorError("Invalid upload descriptor");
  }
}

export function extensionForMimeType(mimeType: string) {
  const extension = MIME_TO_EXTENSION[mimeType];
  if (!extension) {
    throw new UploadDescriptorError("Unsupported document type");
  }
  return extension;
}

export function fileTypeFromName(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() || "unknown";
}

export function isAllowedDocumentMimeType(
  mimeType: string
): mimeType is (typeof APPLICATION_DOCUMENT_MIME_TYPES)[number] {
  return APPLICATION_DOCUMENT_MIME_TYPES.includes(
    mimeType as (typeof APPLICATION_DOCUMENT_MIME_TYPES)[number]
  );
}

export function documentBytesMatchMimeType(mimeType: string, bytes: Uint8Array) {
  const signature = DOCUMENT_SIGNATURES[mimeType];
  if (!signature || bytes.length < signature.length) return false;
  return signature.every((byte, index) => bytes[index] === byte);
}

export function assertApplicationDocumentDescriptorShape(
  uploadSessionId: string,
  descriptor: ApplicationDocumentDescriptor,
  options: { now?: number; signingSecret?: string } = {}
) {
  if (descriptor.uploadSessionId !== uploadSessionId) {
    throw new UploadDescriptorError("Document upload session does not match this application");
  }
  if (!descriptor.storagePath.startsWith(`${uploadSessionId}/`)) {
    throw new UploadDescriptorError("Document path does not match this application");
  }
  if (Date.parse(descriptor.expiresAt) <= (options.now ?? Date.now())) {
    throw new UploadDescriptorError("Document upload descriptor has expired");
  }
  verifyDescriptorSignature(descriptor, options.signingSecret);
}

export function assertUniqueDocumentDescriptorNonces(
  descriptors: Pick<ApplicationDocumentDescriptor, "nonce">[]
) {
  const seenNonces = new Set<string>();

  for (const descriptor of descriptors) {
    if (seenNonces.has(descriptor.nonce)) {
      throw new UploadDescriptorError("Duplicate document upload descriptor");
    }
    seenNonces.add(descriptor.nonce);
  }
}
