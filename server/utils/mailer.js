

const ADMIN_URL = `${process.env.FRONTEND_URL}/admin/secure-soft`;
const BRAND_COLOR = "#006400";
const PAGE_BACKGROUND = "#f3f6f3";

const nodemailer = require("nodemailer");
const createTransporter = (senderEmail, senderAppPassword) => {
  if (!senderEmail || !senderAppPassword) {
    throw new Error("Sender email credentials are missing.");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: senderEmail,
      pass: senderAppPassword,
    },
  });
};

const sendFromAdmin = async ({
  senderEmail,
  senderAppPassword,
  to,
  subject,
  text,
  html,
}) => {
  const transporter = createTransporter(
    senderEmail,
    senderAppPassword
  );

  return transporter.sendMail({
    from: {
      name: "MIT-SoFT Admin",
      address: senderEmail,
    },
    to,
    subject,
    text,
    html,
  });
};

// ================= REUSABLE EMAIL TEMPLATE =================
const createEmailTemplate = ({
  title,
  intro,
  requestId,
  entityType,
  operation,
  requestedBy,
  showRequester = false,
  buttonText,
  footerMessage,
  statusLabel = "PENDING APPROVAL",
  statusMessage,
  statusColor = "#166534",
  statusBadgeBackground = "#dcfce7",
  statusCardBackground = "#f0fdf4",
  statusCardBorder = "#bbf7d0",
  accentColor = BRAND_COLOR,
  statusIcon = "",
  extraContent = "",
}) => {
  const details = [
    ["Request ID", requestId],
    ["Content Type", entityType],
    ["Operation", operation],
    ...(showRequester ? [["Requested By", requestedBy]] : []),
  ];

  const detailRows = details
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:10px 10px;border-bottom:1px solid #e5e7eb;color:#64748b;font-size:13px;width:38%;">
            ${label}
          </td>
          <td style="padding:10px 10px;border-bottom:1px solid #e5e7eb;color:#1f2937;font-size:14px;font-weight:600;word-break:break-word;">
            ${value ?? "-"}
          </td>
        </tr>
      `
    )
    .join("");

  const resolvedStatusMessage =
    statusMessage ||
    (showRequester
      ? "A content change request is awaiting your review."
      : "Your request has been submitted and is awaiting review.");

  const resolvedStatusLabel = statusIcon
    ? `${statusIcon} ${statusLabel}`
    : statusLabel;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
      </head>
      <body style="margin:0;padding:0;background:${PAGE_BACKGROUND};font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${PAGE_BACKGROUND};padding:28px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8e2;">

                <!-- Header -->
                <tr>
               <td style="background:${accentColor};padding:18px 14px;text-align:center;">
                    <div style="font-size:12px;letter-spacing:2px;color:#d8ead8;text-transform:uppercase;font-weight:bold;">
                      MIT-SoFT
                    </div>
                    <h1 style="margin:12px 0 0;font-size:20px;line-height:1.4;color:#ffffff;">
                      ${title}
                    </h1>
                  </td>
                </tr>

                <!-- Main content -->
                <tr>
                  <td style="padding:18px 14px;">
                    <p style="margin:0 0 18px;font-size:15px;line-height:1.8;color:#475569;">
                      ${intro}
                    </p>

                    <!-- Status card -->
<table
  role="presentation"
  width="100%"
  cellspacing="0"
  cellpadding="0"
  style="margin-bottom:22px;background:${statusCardBackground};border:1px solid ${statusCardBorder};border-radius:8px;"
>
  <tr>
    <td style="padding:8px 16px;">
      <span
        style="display:inline-block;padding:6px 12px;background:${statusBadgeBackground};color:${statusColor};border-radius:20px;font-size:12px;font-weight:bold;"
      >
        ${resolvedStatusLabel}
      </span>

      <p
        style="margin:10px 0 0;color:${statusColor};font-size:13px;line-height:1.6;"
      >
        ${resolvedStatusMessage}
      </p>
    </td>
  </tr>
</table>

${extraContent}

                    <!-- Request details card -->
                    <div style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                      <div style="padding:8px 16px;background:#f8fafc;border-bottom:1px solid #e5e7eb;">
                        <h2 style="margin:0;font-size:15px;color:#1f2937;">
                          Request Details
                        </h2>
                      </div>
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                        ${detailRows}
                      </table>
                    </div>

                    <!-- Action button -->
                    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px auto 18px;">
                      <tr>
                        <td align="center" bgcolor="${accentColor}" style="border-radius:6px;">
                          <a href="${ADMIN_URL}" style="display:inline-block;padding:8px 20px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;border-radius:6px;">
                            ${buttonText}
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:24px 0 0;font-size:14px;line-height:1.8;color:#475569;">
                      ${footerMessage}
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:10px 18px;background:#f8fafc;border-top:1px solid #e5e7eb;text-align:center;">
                    <p style="margin:0 0 6px;font-size:13px;font-weight:bold;color:${BRAND_COLOR};">
                      MIT School of Food Technology
                    </p>
                    <p style="margin:0;font-size:12px;line-height:1.7;color:#64748b;">
                      Automated notification from the MIT-SoFT Admin System.<br />
                      Please do not reply directly to this email.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

// ================= SUPERADMIN NOTIFICATION =================
const sendApprovalNotification = async ({
  requestId,
  entityType,
  operation,
  requestedBy,
}) => {
  const html = createEmailTemplate({
    title: "New Request Awaiting Your Review",
    intro:
      "A new content change request has been submitted to the MIT-SoFT Admin System. Please review the request details below and take the necessary action.",
    requestId,
    entityType,
    operation,
    requestedBy,
    showRequester: true,
    buttonText: "Review and Take Action",
    footerMessage:
      "Please sign in to the admin panel to review the proposed changes and approve or reject this request. The request will remain pending until a decision is recorded.",
  });

  return sendFromAdmin({
    senderEmail: process.env.EMAIL_USER,
    senderAppPassword: process.env.EMAIL_PASS,
    to: process.env.SUPER_ADMIN_EMAIL,
    subject: `Action Required: Review ${entityType} Request #${requestId}`,
    text: `
Dear Super Admin,

A new content change request has been submitted and is awaiting your decision.

Request Details:
Request ID: ${requestId}
Content Type: ${entityType}
Operation: ${operation}
Submitted By: ${requestedBy}
Current Status: Pending Approval

Please sign in to the MIT-SoFT Admin System to review the proposed changes and approve or reject the request.

${ADMIN_URL}

Regards,
MIT-SoFT Admin System
    `,
    html,
  });
};

// ================= SUBMITTING ADMIN CONFIRMATION =================
const sendSubmissionConfirmation = async ({
  senderEmail,
  senderAppPassword,
  adminEmail,
  requestId,
  entityType,
  operation,
}) => {
  if (!adminEmail) {
    throw new Error("Submitting admin email is missing.");
  }

  // Fall back to the configured institutional mailbox
  const actualSenderEmail =
    senderEmail || process.env.EMAIL_USER;

  const actualSenderPassword =
    senderAppPassword || process.env.EMAIL_PASS;

  if (!actualSenderEmail || !actualSenderPassword) {
    throw new Error(
      `Sender email credentials are missing. EMAIL_USER configured: ${Boolean(actualSenderEmail)
      }, EMAIL_PASS configured: ${Boolean(actualSenderPassword)}`
    );
  }

  const html = createEmailTemplate({
    title: "Your Request Has Been Received",
    intro:
      "Your content change request has been recorded and forwarded for review.",
    requestId,
    entityType,
    operation,
    buttonText: "Access Admin Panel",
    footerMessage:
      "You will receive another email when your request has been reviewed.",
  });

  return sendFromAdmin({
    senderEmail: actualSenderEmail,
    senderAppPassword: actualSenderPassword,
    to: adminEmail,
    subject: `Submission Confirmation: ${entityType} Request #${requestId}`,
    text: `Your request #${requestId} has been submitted for review.\n\n${ADMIN_URL}`,
    html,
  });
};



// ================= HTML ESCAPE HELPER =================
const escapeHtml = (value = "") =>
  String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });
// ================= APPROVAL / REJECTION RESULT =================
const sendReviewResultNotification = async ({
  adminEmail,
  requestId,
  entityType,
  operation,
  status,
  reviewComment = "",
}) => {
  if (!adminEmail) {
    throw new Error("Submitting admin email is required.");
  }

  const approved = status === "approved";

  if (!approved && status !== "rejected") {
    throw new Error(`Invalid review status: ${status}`);
  }

  const accentColor = approved ? "#006400" : "#b91c1c";

  const title = approved
    ? "Content Change Request Approved"
    : "Content Change Request Rejected";

  const intro = approved
    ? `Your content change request #${requestId} has been approved and published.`
    : `Your content change request #${requestId} has been rejected.`;

  const commentSection =
    !approved && reviewComment
      ? `
        <div style="
          margin: 0 0 22px;
          padding: 10px;
          background: #fef2f2;
          border-left: 4px solid #b91c1c;
          border-radius: 4px;
        ">
          <strong style="color:#991b1b;">Review comment:</strong>
          <p style="
            margin-bottom: 0;
            color:#7f1d1d;
            white-space: pre-wrap;
            line-height:1.6;
          ">
            ${escapeHtml(reviewComment)}
          </p>
        </div>
      `
      : "";

  const html = createEmailTemplate({
    title,
    intro,
    requestId,
    entityType,
    operation,
    buttonText: "Open Admin Panel",
    footerMessage: approved
      ? "You can sign in to the admin panel to review your approved request."
      : "Please review the feedback above before submitting a revised request.",

    // Status appearance
    statusLabel: approved ? "APPROVED" : "REJECTED",
    statusIcon: approved ? "✓" : "✕",
    statusMessage: approved
      ? "Your proposed changes have been approved successfully."
      : "Your proposed changes were not approved.",

    // Green for approval; red for rejection
    accentColor,
    statusColor: approved ? "#166534" : "#991b1b",
    statusBadgeBackground: approved ? "#dcfce7" : "#fee2e2",
    statusCardBackground: approved ? "#f0fdf4" : "#fef2f2",
    statusCardBorder: approved ? "#bbf7d0" : "#fecaca",

    extraContent: commentSection,
  });

  return sendFromAdmin({
    senderEmail: process.env.EMAIL_USER,
    senderAppPassword: process.env.EMAIL_PASS,
    to: adminEmail,
    subject: `${approved ? "Approved" : "Rejected"}: ${entityType} Request #${requestId}`,
    text: `
Your content change request #${requestId} has been ${approved ? "approved" : "rejected"
      }.

${reviewComment ? `Review comment: ${reviewComment}\n\n` : ""}
${ADMIN_URL}
  `,
    html,
  });
};

module.exports = {
  sendApprovalNotification,
  sendSubmissionConfirmation,
  sendReviewResultNotification
};

