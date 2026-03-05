import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = "YellowRiver <noreply@yellowriver.com>";

export async function sendApplicationConfirmation(params: {
  to: string;
  applicantName: string;
  applicationNumber: string;
  propertyTitle: string;
}) {
  await resend.emails.send({
    from: fromEmail,
    to: params.to,
    subject: `Application Received - ${params.applicationNumber}`,
    html: `
      <h2>Application Received</h2>
      <p>Dear ${params.applicantName},</p>
      <p>Thank you for submitting your rental application for <strong>${params.propertyTitle}</strong>.</p>
      <p>Your application number is: <strong>${params.applicationNumber}</strong></p>
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

  await resend.emails.send({
    from: fromEmail,
    to: params.to,
    subject: `Application Update - ${params.applicationNumber}`,
    html: `
      <h2>Application Status Update</h2>
      <p>Dear ${params.applicantName},</p>
      <p>${statusMessages[params.newStatus] || `Your application status has been updated to: ${params.newStatus}`}</p>
      <p>Application: <strong>${params.applicationNumber}</strong></p>
      <p>Property: <strong>${params.propertyTitle}</strong></p>
      ${params.adminNotes ? `<p>Notes: ${params.adminNotes}</p>` : ""}
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
  if (!adminEmail) return;

  await resend.emails.send({
    from: fromEmail,
    to: adminEmail,
    subject: `New Application - ${params.applicationNumber}`,
    html: `
      <h2>New Rental Application</h2>
      <p>A new application has been submitted:</p>
      <ul>
        <li>Application: <strong>${params.applicationNumber}</strong></li>
        <li>Applicant: <strong>${params.applicantName}</strong></li>
        <li>Property: <strong>${params.propertyTitle}</strong></li>
      </ul>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/applications">View in Admin Panel</a></p>
    `,
  });
}

export async function sendInquiryConfirmation(params: {
  to: string;
  name: string;
  subject: string;
}) {
  await resend.emails.send({
    from: fromEmail,
    to: params.to,
    subject: `We received your inquiry - ${params.subject}`,
    html: `
      <h2>Inquiry Received</h2>
      <p>Dear ${params.name},</p>
      <p>Thank you for contacting us. We have received your inquiry and will get back to you within 1-2 business days.</p>
      <p>Best regards,<br>YellowRiver Team</p>
    `,
  });
}
