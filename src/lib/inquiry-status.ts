export const INQUIRY_STATUSES = ["NEW", "READ", "REPLIED", "ARCHIVED"] as const;

export type InquiryStatusValue = (typeof INQUIRY_STATUSES)[number];

export type InquiryUpdateData = {
  status?: InquiryStatusValue;
  adminReply?: string;
  repliedAt?: Date;
};

export type InquiryUpdateResult =
  | { ok: true; data: InquiryUpdateData }
  | { ok: false; message: string; status: 400 };

export function isInquiryStatus(value: string): value is InquiryStatusValue {
  return INQUIRY_STATUSES.includes(value as InquiryStatusValue);
}

export function buildInquiryUpdateData(
  existingStatus: InquiryStatusValue,
  body: Record<string, unknown>,
  now = new Date()
): InquiryUpdateResult {
  const status = typeof body.status === "string" ? body.status : undefined;
  const adminReply = typeof body.adminReply === "string" ? body.adminReply : undefined;
  const updateData: InquiryUpdateData = {};

  if (status) {
    if (!isInquiryStatus(status)) {
      return {
        ok: false,
        message: `Invalid status: ${status}. Valid statuses: ${INQUIRY_STATUSES.join(", ")}`,
        status: 400,
      };
    }
    updateData.status = status;
  }

  if (adminReply !== undefined) {
    updateData.adminReply = adminReply;
    updateData.repliedAt = now;

    if (!status && (existingStatus === "NEW" || existingStatus === "READ")) {
      updateData.status = "REPLIED";
    }
  }

  if (Object.keys(updateData).length === 0) {
    return { ok: false, message: "No changes to apply", status: 400 };
  }

  return { ok: true, data: updateData };
}
