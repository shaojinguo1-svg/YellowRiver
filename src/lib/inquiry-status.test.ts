import { describe, expect, it } from "vitest";
import { buildInquiryUpdateData } from "@/lib/inquiry-status";

const now = new Date("2026-05-30T12:00:00.000Z");

describe("buildInquiryUpdateData", () => {
  it("marks NEW inquiries as REPLIED when saving an internal note", () => {
    const result = buildInquiryUpdateData("NEW", { adminReply: "Follow up by phone" }, now);

    expect(result).toEqual({
      ok: true,
      data: {
        adminReply: "Follow up by phone",
        repliedAt: now,
        status: "REPLIED",
      },
    });
  });

  it("marks READ inquiries as REPLIED when saving an internal note", () => {
    const result = buildInquiryUpdateData("READ", { adminReply: "Left voicemail" }, now);

    expect(result).toEqual({
      ok: true,
      data: {
        adminReply: "Left voicemail",
        repliedAt: now,
        status: "REPLIED",
      },
    });
  });

  it("does not unarchive ARCHIVED inquiries when saving an internal note", () => {
    const result = buildInquiryUpdateData("ARCHIVED", { adminReply: "Archived note" }, now);

    expect(result).toEqual({
      ok: true,
      data: {
        adminReply: "Archived note",
        repliedAt: now,
      },
    });
  });

  it("allows explicit valid status changes", () => {
    const result = buildInquiryUpdateData(
      "ARCHIVED",
      { adminReply: "Reopening", status: "READ" },
      now
    );

    expect(result).toEqual({
      ok: true,
      data: {
        adminReply: "Reopening",
        repliedAt: now,
        status: "READ",
      },
    });
  });

  it("rejects invalid statuses and empty updates", () => {
    expect(buildInquiryUpdateData("NEW", { status: "SENT" }, now)).toEqual({
      ok: false,
      message: "Invalid status: SENT. Valid statuses: NEW, READ, REPLIED, ARCHIVED",
      status: 400,
    });

    expect(buildInquiryUpdateData("NEW", {}, now)).toEqual({
      ok: false,
      message: "No changes to apply",
      status: 400,
    });
  });
});
