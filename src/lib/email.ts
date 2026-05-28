import { Resend } from "resend";

type EmailDeliveryStatus = "sent" | "skipped" | "failed";
type EmailContextValue = string | number | boolean | null | undefined;
type EmailContext = Record<string, EmailContextValue>;

export type EmailDeliveryResult = {
  helper: string;
  status: EmailDeliveryStatus;
  reason?: string;
  context: Record<string, string | number | boolean>;
  error?: string;
};

const fromEmail = "YellowRiver <noreply@yellowriver.com>";

let resendClient: Resend | null = null;
let resendClientKey: string | null = null;

function getResendClient(apiKey: string) {
  if (!resendClient || resendClientKey !== apiKey) {
    resendClient = new Resend(apiKey);
    resendClientKey = apiKey;
  }

  return resendClient;
}

function cleanContext(context: EmailContext = {}) {
  return Object.fromEntries(
    Object.entries(context).filter(([, value]) => value !== null && value !== undefined)
  ) as Record<string, string | number | boolean>;
}

function result(
  helper: string,
  status: EmailDeliveryStatus,
  context: EmailContext,
  reason?: string,
  error?: string
): EmailDeliveryResult {
  return {
    helper,
    status,
    reason,
    context: cleanContext(context),
    error,
  };
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown email provider error";
}

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatMultiline(value: string | null | undefined) {
  return escapeHtml(value).replace(/\r?\n/g, "<br />");
}

function subjectLine(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function appUrl(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  return baseUrl ? `${baseUrl}${path}` : null;
}

export function logEmailDeliveryResult(result: EmailDeliveryResult) {
  if (result.status === "sent") return;

  const details = {
    reason: result.reason,
    context: result.context,
    ...(result.error ? { error: result.error } : {}),
  };

  if (result.status === "skipped") {
    console.warn(`[email] ${result.helper} skipped`, details);
    return;
  }

  console.error(`[email] ${result.helper} failed`, details);
}

async function sendOptionalEmail(params: {
  helper: string;
  to?: string;
  missingRecipientReason?: string;
  subject: string;
  html: string;
  context: EmailContext;
}): Promise<EmailDeliveryResult> {
  if (!params.to) {
    return result(
      params.helper,
      "skipped",
      params.context,
      params.missingRecipientReason || "missing_recipient"
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return result(params.helper, "skipped", params.context, "missing_RESEND_API_KEY");
  }

  try {
    await getResendClient(apiKey).emails.send({
      from: fromEmail,
      to: params.to,
      subject: subjectLine(params.subject),
      html: params.html,
    });

    return result(params.helper, "sent", params.context);
  } catch (error) {
    return result(
      params.helper,
      "failed",
      params.context,
      "provider_send_failed",
      errorMessage(error)
    );
  }
}

export async function sendApplicationConfirmation(params: {
  to: string;
  applicantName: string;
  applicationNumber: string;
  propertyTitle: string;
}) {
  return sendOptionalEmail({
    helper: "sendApplicationConfirmation",
    to: params.to,
    subject: `Application Received - ${params.applicationNumber}`,
    context: {
      applicationNumber: params.applicationNumber,
      recipientRole: "applicant",
    },
    html: `
      <h2>Application Received</h2>
      <p>Dear ${escapeHtml(params.applicantName)},</p>
      <p>Thank you for submitting your rental application for <strong>${escapeHtml(params.propertyTitle)}</strong>.</p>
      <p>Your application number is: <strong>${escapeHtml(params.applicationNumber)}</strong></p>
      <p>We will review your application and get back to you shortly.</p>
      <p>Best regards,<br>YellowRiver Team</p>
    `,
  });
}

export async function sendApplicationStatusUpdate(params: {
  to: string;
  applicantName: string;
  applicationNumber: string;
  newStatus: string;
  propertyTitle: string;
  adminNotes?: string;
}) {
  const statusMessages: Record<string, string> = {
    UNDER_REVIEW: "Your application is now being reviewed by our team.",
    APPROVED: "Congratulations! Your application has been approved. We will contact you with next steps.",
    REJECTED: "We regret to inform you that your application was not approved at this time.",
  };

  return sendOptionalEmail({
    helper: "sendApplicationStatusUpdate",
    to: params.to,
    subject: `Application Update - ${params.applicationNumber}`,
    context: {
      applicationNumber: params.applicationNumber,
      newStatus: params.newStatus,
      recipientRole: "applicant",
    },
    html: `
      <h2>Application Status Update</h2>
      <p>Dear ${escapeHtml(params.applicantName)},</p>
      <p>${escapeHtml(statusMessages[params.newStatus] || `Your application status has been updated to: ${params.newStatus}`)}</p>
      <p>Application: <strong>${escapeHtml(params.applicationNumber)}</strong></p>
      <p>Property: <strong>${escapeHtml(params.propertyTitle)}</strong></p>
      ${params.adminNotes ? `<p>Notes: ${formatMultiline(params.adminNotes)}</p>` : ""}
      <p>Best regards,<br>YellowRiver Team</p>
    `,
  });
}

export async function sendAdminNewApplicationNotification(params: {
  applicationNumber: string;
  applicantName: string;
  propertyTitle: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const applicationsUrl = appUrl("/admin/applications");

  return sendOptionalEmail({
    helper: "sendAdminNewApplicationNotification",
    to: adminEmail,
    missingRecipientReason: "missing_ADMIN_EMAIL",
    subject: `New Application - ${params.applicationNumber}`,
    context: {
      applicationNumber: params.applicationNumber,
      recipientRole: "admin",
    },
    html: `
      <h2>New Rental Application</h2>
      <p>A new application has been submitted:</p>
      <ul>
        <li>Application: <strong>${escapeHtml(params.applicationNumber)}</strong></li>
        <li>Applicant: <strong>${escapeHtml(params.applicantName)}</strong></li>
        <li>Property: <strong>${escapeHtml(params.propertyTitle)}</strong></li>
      </ul>
      ${applicationsUrl ? `<p><a href="${escapeHtml(applicationsUrl)}">View in Admin Panel</a></p>` : ""}
    `,
  });
}

export async function sendAdminContactInquiryNotification(params: {
  inquiryId: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  propertyId: string | null;
}) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const inquiriesUrl = appUrl("/admin/inquiries");

  return sendOptionalEmail({
    helper: "sendAdminContactInquiryNotification",
    to: adminEmail,
    missingRecipientReason: "missing_ADMIN_EMAIL",
    subject: `New Contact Inquiry - ${params.subject}`,
    context: {
      inquiryId: params.inquiryId,
      recipientRole: "admin",
    },
    html: `
      <h2>New Contact Inquiry</h2>
      <p>A new contact inquiry has been submitted:</p>
      <ul>
        <li>Name: <strong>${escapeHtml(params.name)}</strong></li>
        <li>Email: <strong>${escapeHtml(params.email)}</strong></li>
        ${params.phone ? `<li>Phone: <strong>${escapeHtml(params.phone)}</strong></li>` : ""}
        <li>Subject: <strong>${escapeHtml(params.subject)}</strong></li>
        ${params.propertyId ? `<li>Property ID: <strong>${escapeHtml(params.propertyId)}</strong></li>` : ""}
      </ul>
      <p>${formatMultiline(params.message)}</p>
      ${inquiriesUrl ? `<p><a href="${escapeHtml(inquiriesUrl)}">View in Admin Panel</a></p>` : ""}
    `,
  });
}

export async function sendInquiryConfirmation(params: {
  to: string;
  name: string;
  subject: string;
}) {
  return sendOptionalEmail({
    helper: "sendInquiryConfirmation",
    to: params.to,
    subject: `We received your inquiry - ${params.subject}`,
    context: {
      recipientRole: "inquiry_submitter",
    },
    html: `
      <h2>Inquiry Received</h2>
      <p>Dear ${escapeHtml(params.name)},</p>
      <p>Thank you for contacting us. We have received your inquiry and will get back to you within 1-2 business days.</p>
      <p>Best regards,<br>YellowRiver Team</p>
    `,
  });
}
