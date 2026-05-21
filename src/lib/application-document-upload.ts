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

type DescriptorPayload = Omit<ApplicationDocumentDescriptor, "signature">;

export class UploadDescriptorError extends Error {
  status = 400;
}

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

async function assertStorageObjectMatches(descriptor: ApplicationDocumentDescriptor) {
  const lastSlash = descriptor.storagePath.lastIndexOf("/");
  const folder = lastSlash >= 0 ? descriptor.storagePath.slice(0, lastSlash) : "";
  const name = lastSlash >= 0 ? descriptor.storagePath.slice(lastSlash + 1) : descriptor.storagePath;

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.storage
    .from(APPLICATION_DOCUMENTS_BUCKET)
    .list(folder, { limit: 20, search: name });

  if (error) {
    throw new Error(error.message);
  }

  const object = data?.find((item) => item.name === name);
  if (!object) {
    throw new UploadDescriptorError("Uploaded document was not found");
  }

  const metadata = object.metadata as
    | { size?: number; mimetype?: string; mimeType?: string; contentType?: string }
    | null
    | undefined;
  const objectSize = Number(metadata?.size);
  if (Number.isFinite(objectSize) && objectSize !== descriptor.fileSize) {
    throw new UploadDescriptorError("Uploaded document size does not match");
  }

  const objectMimeType = metadata?.mimetype || metadata?.mimeType || metadata?.contentType;
  if (objectMimeType && objectMimeType !== descriptor.mimeType) {
    throw new UploadDescriptorError("Uploaded document type does not match");
  }
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
