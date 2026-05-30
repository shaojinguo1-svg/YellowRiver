import { describe, expect, it } from "vitest";
import {
  UploadDescriptorError,
  assertApplicationDocumentDescriptorShape,
  assertUniqueDocumentDescriptorNonces,
  documentBytesMatchMimeType,
  extensionForMimeType,
  fileTypeFromName,
  signApplicationDocumentDescriptor,
  verifyDescriptorSignature,
  type ApplicationDocumentDescriptorPayload,
} from "@/lib/application-document-validation";
import type { ApplicationDocumentDescriptor } from "@/validations/application";

const signingSecret = "unit_test_signing_secret_32_chars_min";
const uploadSessionId = "11111111-1111-4111-8111-111111111111";

function makeDescriptor(
  overrides: Partial<ApplicationDocumentDescriptorPayload> = {}
): ApplicationDocumentDescriptor {
  const payload: ApplicationDocumentDescriptorPayload = {
    version: 1,
    uploadSessionId,
    nonce: "a".repeat(32),
    storagePath: `${uploadSessionId}/government_id/${"a".repeat(32)}.pdf`,
    category: "GOVERNMENT_ID",
    fileName: "government-id.pdf",
    fileSize: 12,
    mimeType: "application/pdf",
    expiresAt: "2030-01-01T00:00:00.000Z",
    ...overrides,
  };

  return {
    ...payload,
    signature: signApplicationDocumentDescriptor(payload, signingSecret),
  };
}

describe("application document validation helpers", () => {
  it("maps allowed MIME types and file names", () => {
    expect(extensionForMimeType("application/pdf")).toBe("pdf");
    expect(extensionForMimeType("image/jpeg")).toBe("jpg");
    expect(extensionForMimeType("image/png")).toBe("png");
    expect(fileTypeFromName("proof.of.income.PNG")).toBe("png");
    expect(fileTypeFromName("no-extension")).toBe("no-extension");
    expect(() => extensionForMimeType("text/html")).toThrow(UploadDescriptorError);
  });

  it("sniffs PDF, JPEG, and PNG magic bytes", () => {
    expect(documentBytesMatchMimeType("application/pdf", new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]))).toBe(true);
    expect(documentBytesMatchMimeType("image/jpeg", new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe(true);
    expect(
      documentBytesMatchMimeType(
        "image/png",
        new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      )
    ).toBe(true);

    expect(documentBytesMatchMimeType("application/pdf", new TextEncoder().encode("<html>"))).toBe(false);
    expect(documentBytesMatchMimeType("image/png", new TextEncoder().encode("<svg></svg>"))).toBe(false);
    expect(documentBytesMatchMimeType("image/jpeg", new Uint8Array([0xff, 0xd8]))).toBe(false);
  });

  it("validates descriptor signatures and rejects tampering", () => {
    const descriptor = makeDescriptor();
    expect(() => verifyDescriptorSignature(descriptor, signingSecret)).not.toThrow();

    expect(() =>
      verifyDescriptorSignature({ ...descriptor, fileName: "tampered.pdf" }, signingSecret)
    ).toThrow(UploadDescriptorError);
  });

  it("validates descriptor shape for the intended upload session", () => {
    const descriptor = makeDescriptor();

    expect(() =>
      assertApplicationDocumentDescriptorShape(uploadSessionId, descriptor, {
        now: Date.parse("2026-01-01T00:00:00.000Z"),
        signingSecret,
      })
    ).not.toThrow();

    expect(() =>
      assertApplicationDocumentDescriptorShape("22222222-2222-4222-8222-222222222222", descriptor, {
        now: Date.parse("2026-01-01T00:00:00.000Z"),
        signingSecret,
      })
    ).toThrow("Document upload session does not match this application");

    expect(() =>
      assertApplicationDocumentDescriptorShape(
        uploadSessionId,
        makeDescriptor({ storagePath: `other-session/government_id/${"a".repeat(32)}.pdf` }),
        {
          now: Date.parse("2026-01-01T00:00:00.000Z"),
          signingSecret,
        }
      )
    ).toThrow("Document path does not match this application");

    expect(() =>
      assertApplicationDocumentDescriptorShape(uploadSessionId, descriptor, {
        now: Date.parse("2031-01-01T00:00:00.000Z"),
        signingSecret,
      })
    ).toThrow("Document upload descriptor has expired");
  });

  it("rejects duplicate descriptor nonces", () => {
    expect(() =>
      assertUniqueDocumentDescriptorNonces([
        { nonce: "duplicate" },
        { nonce: "duplicate" },
      ])
    ).toThrow(UploadDescriptorError);
  });
});
