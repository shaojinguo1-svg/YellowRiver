import "server-only";

import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
  APPLICATION_DOCUMENT_MIME_TYPES,
  APPLICATION_DOCUMENT_UPLOAD_TTL_MS,
  APPLICATION_DOCUMENTS_BUCKET,
  MAX_APPLICATION_DOCUMENT_SIZE,
  MAX_PENDING_APPLICATION_UPLOAD_TOKENS,
  UploadDescriptorError,
  assertApplicationDocumentDescriptorShape,
  documentBytesMatchMimeType,
  extensionForMimeType,
  fileTypeFromName,
  isAllowedDocumentMimeType,
  signApplicationDocumentDescriptor,
} from "@/lib/application-document-validation";
import type {
  ApplicationDocumentCategory,
  ApplicationDocumentDescriptor,
} from "@/validations/application";

export {
  APPLICATION_DOCUMENT_MIME_TYPES,
  APPLICATION_DOCUMENT_READ_TTL_SECONDS,
  APPLICATION_DOCUMENT_UPLOAD_TTL_MS,
  APPLICATION_DOCUMENTS_BUCKET,
  MAX_APPLICATION_DOCUMENT_SIZE,
  MAX_PENDING_APPLICATION_UPLOAD_TOKENS,
  UploadDescriptorError,
  extensionForMimeType,
  fileTypeFromName,
  verifyDescriptorSignature,
} from "@/lib/application-document-validation";

const CLEANUP_BATCH_SIZE = 25;

type DescriptorPayload = Omit<ApplicationDocumentDescriptor, "signature">;
type StorageObjectRecord = Record<string, unknown>;

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

function safeFileName(fileName: string) {
  return fileName
    .replace(/[^\w.\- ()]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 255);
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
  const signature = signApplicationDocumentDescriptor(payload);
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

async function assertStorageObjectContentMatches(
  descriptor: ApplicationDocumentDescriptor
) {
  if (!isAllowedDocumentMimeType(descriptor.mimeType)) {
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
  if (!documentBytesMatchMimeType(descriptor.mimeType, bytes)) {
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

    assertApplicationDocumentDescriptorShape(uploadSessionId, descriptor);

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
