import "server-only";

import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import type {
  ApplicationDocumentCategory,
  ApplicationDocumentDescriptor,
} from "@/validations/application";

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

const CLEANUP_BATCH_SIZE = 25;

type DescriptorPayload = Omit<ApplicationDocumentDescriptor, "signature">;
type StorageObjectRecord = Record<string, unknown>;

export class UploadDescriptorError extends Error {
  status = 400;
}

type CleanupStats = {
  attempted: number;
  removedObjects: number;
  removedTokens: number;
  failed: number;
};

export type ValidatedApplicationDocument = {
  nonce: string;
  category: ApplicationDocumentCategory;
  fileName: string;
  fileType: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
};

function getSigningSecret() {
  const secret = process.env.APPLICATION_UPLOAD_SIGNING_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("APPLICATION_UPLOAD_SIGNING_SECRET is not configured");
  }
  return secret;
}

function canonicalPayload(payload: DescriptorPayload) {
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

function signPayload(payload: DescriptorPayload) {
  return createHmac("sha256", getSigningSecret())
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

export function verifyDescriptorSignature(descriptor: ApplicationDocumentDescriptor) {
  const { signature, ...payload } = descriptor;
  const expected = signPayload(payload);
  if (!signaturesMatch(expected, signature)) {
    throw new UploadDescriptorError("Invalid upload descriptor");
  }
}

function safeFileName(fileName: string) {
  return fileName
    .replace(/[^\w.\- ()]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 255);
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

function logDocumentUploadWarning(
  helper: string,
  message: string,
  context: Record<string, unknown> = {}
) {
  console.warn(`[${helper}] ${message}`, context);
}

function tokenLogContext(token: { id: string; nonce: string; category: string; storagePath: string }) {
  return {
    tokenId: token.id,
    noncePrefix: token.nonce.slice(0, 8),
    category: token.category,
    storagePrefix: token.storagePath.split("/").slice(0, 2).join("/"),
  };
}

function isAllowedDocumentMimeType(
  mimeType: string
): mimeType is (typeof APPLICATION_DOCUMENT_MIME_TYPES)[number] {
  return APPLICATION_DOCUMENT_MIME_TYPES.includes(
    mimeType as (typeof APPLICATION_DOCUMENT_MIME_TYPES)[number]
  );
}

export async function createApplicationDocumentUploadToken(params: {
  uploadSessionId: string;
  category: ApplicationDocumentCategory;
  fileName: string;
  fileSize: number;
  mimeType: (typeof APPLICATION_DOCUMENT_MIME_TYPES)[number];
}) {
  const fileName = safeFileName(params.fileName);
  const nonce = randomUUID().replace(/-/g, "");
  const extension = extensionForMimeType(params.mimeType);
  const storagePath = `${params.uploadSessionId}/${params.category.toLowerCase()}/${nonce}.${extension}`;
  const expiresAt = new Date(Date.now() + APPLICATION_DOCUMENT_UPLOAD_TTL_MS);

  const payload: DescriptorPayload = {
    version: 1,
    uploadSessionId: params.uploadSessionId,
    nonce,
    storagePath,
    category: params.category,
    fileName,
    fileSize: params.fileSize,
    mimeType: params.mimeType,
    expiresAt: expiresAt.toISOString(),
  };
  const signature = signPayload(payload);
  const descriptor: ApplicationDocumentDescriptor = { ...payload, signature };

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.storage
    .from(APPLICATION_DOCUMENTS_BUCKET)
    .createSignedUploadUrl(storagePath);

  if (error) {
    throw new Error(error.message);
  }

  await prisma.applicationUploadToken.create({
    data: {
      uploadSessionId: params.uploadSessionId,
      nonce,
      storagePath,
      category: params.category,
      fileName,
      fileSize: params.fileSize,
      mimeType: params.mimeType,
      signature,
      expiresAt,
    },
  });

  return {
    uploadSessionId: params.uploadSessionId,
    signedUrl: data.signedUrl,
    token: data.token,
    path: data.path,
    descriptor,
  };
}

export async function cleanupExpiredApplicationDocumentUploads(
  limit = CLEANUP_BATCH_SIZE
): Promise<CleanupStats> {
  const cleanupLimit = Math.min(Math.max(limit, 1), CLEANUP_BATCH_SIZE);
  const now = new Date();
  const expiredTokens = await prisma.applicationUploadToken.findMany({
    where: {
      consumedAt: null,
      expiresAt: { lt: now },
    },
    select: {
      id: true,
      nonce: true,
      category: true,
      storagePath: true,
    },
    orderBy: { expiresAt: "asc" },
    take: cleanupLimit,
  });

  const stats: CleanupStats = {
    attempted: expiredTokens.length,
    removedObjects: 0,
    removedTokens: 0,
    failed: 0,
  };

  if (expiredTokens.length === 0) {
    return stats;
  }

  const supabase = createServiceRoleClient();

  for (const token of expiredTokens) {
    const submittedDocument = await prisma.applicationDocument.findFirst({
      where: { storagePath: token.storagePath },
      select: { id: true },
    });

    if (submittedDocument) {
      stats.failed += 1;
      logDocumentUploadWarning(
        "cleanupExpiredApplicationDocumentUploads",
        "Skipping expired token with submitted document",
        tokenLogContext(token)
      );
      continue;
    }

    const { error } = await supabase.storage
      .from(APPLICATION_DOCUMENTS_BUCKET)
      .remove([token.storagePath]);

    if (error) {
      stats.failed += 1;
      logDocumentUploadWarning(
        "cleanupExpiredApplicationDocumentUploads",
        "Failed to remove expired upload object",
        { ...tokenLogContext(token), error: error.message }
      );
      continue;
    }

    stats.removedObjects += 1;

    const deleted = await prisma.applicationUploadToken.deleteMany({
      where: {
        id: token.id,
        consumedAt: null,
      },
    });

    if (deleted.count === 1) {
      stats.removedTokens += 1;
    }
  }

  return stats;
}

export async function assertApplicationUploadSessionQuota(uploadSessionId: string) {
  const pendingCount = await prisma.applicationUploadToken.count({
    where: {
      uploadSessionId,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (pendingCount >= MAX_PENDING_APPLICATION_UPLOAD_TOKENS) {
    throw new UploadDescriptorError("Too many pending document uploads for this application");
  }
}

function assertDescriptorShape(
  uploadSessionId: string,
  descriptor: ApplicationDocumentDescriptor
) {
  if (descriptor.uploadSessionId !== uploadSessionId) {
    throw new UploadDescriptorError("Document upload session does not match this application");
  }
  if (!descriptor.storagePath.startsWith(`${uploadSessionId}/`)) {
    throw new UploadDescriptorError("Document path does not match this application");
  }
  if (Date.parse(descriptor.expiresAt) <= Date.now()) {
    throw new UploadDescriptorError("Document upload descriptor has expired");
  }
  verifyDescriptorSignature(descriptor);
}

function asStorageObjectRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as StorageObjectRecord;
}

function confirmedStorageObjectSize(object: StorageObjectRecord) {
  const metadata = asStorageObjectRecord(object.metadata);
  const candidates = [
    object.size,
    object.contentLength,
    object.content_length,
    metadata?.size,
    metadata?.contentLength,
    metadata?.content_length,
  ];

  for (const candidate of candidates) {
    if (
      typeof candidate === "number" &&
      Number.isSafeInteger(candidate) &&
      candidate >= 0
    ) {
      return candidate;
    }
    if (typeof candidate === "string" && /^\d+$/.test(candidate)) {
      const parsed = Number(candidate);
      if (Number.isSafeInteger(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function confirmedStorageObjectMimeType(object: StorageObjectRecord) {
  const metadata = asStorageObjectRecord(object.metadata);
  const candidates = [
    object.contentType,
    object.content_type,
    metadata?.mimetype,
    metadata?.mimeType,
    metadata?.contentType,
    metadata?.content_type,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate;
    }
  }

  return null;
}

function bytesMatchSignature(bytes: Uint8Array, signature: number[]) {
  if (bytes.length < signature.length) return false;
  return signature.every((byte, index) => bytes[index] === byte);
}

async function assertStorageObjectContentMatches(
  descriptor: ApplicationDocumentDescriptor
) {
  const expectedSignature = DOCUMENT_SIGNATURES[descriptor.mimeType];
  if (!expectedSignature) {
    throw new UploadDescriptorError("Unsupported document type");
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.storage
    .from(APPLICATION_DOCUMENTS_BUCKET)
    .download(descriptor.storagePath);

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new UploadDescriptorError("Uploaded document was not found");
  }

  const bytes = new Uint8Array(await data.arrayBuffer());
  if (bytes.length > MAX_APPLICATION_DOCUMENT_SIZE) {
    throw new UploadDescriptorError("Uploaded document exceeds the size limit");
  }
  if (bytes.length !== descriptor.fileSize) {
    throw new UploadDescriptorError("Uploaded document size does not match");
  }
  if (!bytesMatchSignature(bytes, expectedSignature)) {
    throw new UploadDescriptorError("Uploaded document content does not match the declared type");
  }
}

async function assertStorageObjectMatches(descriptor: ApplicationDocumentDescriptor) {
  const supabase = createServiceRoleClient();
  const { data: object, error } = await supabase.storage
    .from(APPLICATION_DOCUMENTS_BUCKET)
    .info(descriptor.storagePath);

  if (error) {
    throw new Error(error.message);
  }
  if (!object) {
    throw new UploadDescriptorError("Uploaded document was not found");
  }

  const objectRecord = object as StorageObjectRecord;
  const objectSize = confirmedStorageObjectSize(objectRecord);
  if (objectSize === null) {
    throw new UploadDescriptorError("Uploaded document size could not be verified");
  }
  if (objectSize !== descriptor.fileSize) {
    throw new UploadDescriptorError("Uploaded document size does not match");
  }
  if (objectSize > MAX_APPLICATION_DOCUMENT_SIZE) {
    throw new UploadDescriptorError("Uploaded document exceeds the size limit");
  }

  const objectMimeType = confirmedStorageObjectMimeType(objectRecord);
  if (!objectMimeType) {
    throw new UploadDescriptorError("Uploaded document type could not be verified");
  }
  if (!isAllowedDocumentMimeType(objectMimeType)) {
    throw new UploadDescriptorError("Uploaded document type is not allowed");
  }
  if (objectMimeType !== descriptor.mimeType) {
    throw new UploadDescriptorError("Uploaded document type does not match");
  }

  await assertStorageObjectContentMatches(descriptor);
}

export async function validateApplicationDocumentDescriptors(
  uploadSessionId: string,
  descriptors: ApplicationDocumentDescriptor[]
): Promise<ValidatedApplicationDocument[]> {
  const seenNonces = new Set<string>();
  const validated: ValidatedApplicationDocument[] = [];

  for (const descriptor of descriptors) {
    if (seenNonces.has(descriptor.nonce)) {
      throw new UploadDescriptorError("Duplicate document upload descriptor");
    }
    seenNonces.add(descriptor.nonce);

    assertDescriptorShape(uploadSessionId, descriptor);

    const token = await prisma.applicationUploadToken.findUnique({
      where: { nonce: descriptor.nonce },
    });
    if (!token) {
      throw new UploadDescriptorError("Upload descriptor was not issued by the server");
    }
    if (token.consumedAt) {
      throw new UploadDescriptorError("Upload descriptor has already been used");
    }
    if (token.expiresAt.getTime() <= Date.now()) {
      throw new UploadDescriptorError("Upload descriptor has expired");
    }
    if (
      token.uploadSessionId !== descriptor.uploadSessionId ||
      token.storagePath !== descriptor.storagePath ||
      token.category !== descriptor.category ||
      token.fileName !== descriptor.fileName ||
      token.fileSize !== descriptor.fileSize ||
      token.mimeType !== descriptor.mimeType ||
      token.signature !== descriptor.signature
    ) {
      throw new UploadDescriptorError("Upload descriptor does not match server state");
    }
    if (token.fileSize > MAX_APPLICATION_DOCUMENT_SIZE) {
      throw new UploadDescriptorError("Uploaded document exceeds the size limit");
    }
    if (!isAllowedDocumentMimeType(token.mimeType)) {
      throw new UploadDescriptorError("Uploaded document type is not allowed");
    }

    await assertStorageObjectMatches(descriptor);

    validated.push({
      nonce: descriptor.nonce,
      category: descriptor.category,
      fileName: descriptor.fileName,
      fileType: fileTypeFromName(descriptor.fileName),
      fileSize: descriptor.fileSize,
      mimeType: descriptor.mimeType,
      storagePath: descriptor.storagePath,
    });
  }

  return validated;
}
