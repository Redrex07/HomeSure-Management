import { getEmailConfig } from "./email.config.server";
import { logEmailFailed, logEmailSent, type EmailLogType } from "./email-log.server";
import {
  invitationEmailTemplate,
  passwordResetEmailTemplate,
  testEmailTemplate,
  verificationEmailTemplate,
  welcomeEmailTemplate,
} from "./email.templates";

interface SendResult {
  success: true;
  id?: string;
}

interface SendError {
  success: false;
  error: string;
}

async function dispatchEmail(params: {
  to: string;
  subject: string;
  html: string;
  emailType: EmailLogType;
}): Promise<SendResult | SendError> {
  try {
    const config = getEmailConfig();

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.emailFrom,
        to: [params.to],
        subject: params.subject,
        html: params.html,
      }),
    });

    const payload = (await response.json()) as { id?: string; message?: string };

    if (!response.ok) {
      const message = payload.message || `Resend API error (${response.status})`;
      console.error(`[EmailService] Failed to send ${params.emailType} to ${params.to}:`, message);
      await logEmailFailed({
        recipient: params.to,
        emailType: params.emailType,
        subject: params.subject,
        errorMessage: message,
      });
      return { success: false, error: message };
    }

    await logEmailSent({
      recipient: params.to,
      emailType: params.emailType,
      subject: params.subject,
    });

    return { success: true, id: payload.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[EmailService] Unexpected error sending ${params.emailType}:`, message);
    await logEmailFailed({
      recipient: params.to,
      emailType: params.emailType,
      subject: params.subject,
      errorMessage: message,
    });
    return { success: false, error: message };
  }
}

export async function sendInvitationEmail(params: {
  recipientEmail: string;
  recipientName: string;
  role: string;
  invitationLink: string;
}) {
  const subject = "You're invited to HomeSure Management";
  const html = invitationEmailTemplate({
    recipientName: params.recipientName,
    role: params.role,
    invitationLink: params.invitationLink,
  });

  return dispatchEmail({
    to: params.recipientEmail,
    subject,
    html,
    emailType: "invitation",
  });
}

export async function sendVerificationEmail(params: {
  recipientEmail: string;
  recipientName: string;
  verificationLink: string;
}) {
  const subject = "Confirm your HomeSure Management email";
  const html = verificationEmailTemplate({
    recipientName: params.recipientName,
    verificationLink: params.verificationLink,
  });

  return dispatchEmail({
    to: params.recipientEmail,
    subject,
    html,
    emailType: "verification",
  });
}

export async function sendPasswordResetEmail(params: {
  recipientEmail: string;
  recipientName: string;
  resetLink: string;
}) {
  const subject = "Reset your HomeSure Management password";
  const html = passwordResetEmailTemplate({
    recipientName: params.recipientName,
    resetLink: params.resetLink,
  });

  return dispatchEmail({
    to: params.recipientEmail,
    subject,
    html,
    emailType: "password_reset",
  });
}

export async function sendWelcomeEmail(params: {
  recipientEmail: string;
  recipientName: string;
  loginLink: string;
}) {
  const subject = "Welcome to HomeSure Management";
  const html = welcomeEmailTemplate({
    recipientName: params.recipientName,
    loginLink: params.loginLink,
  });

  return dispatchEmail({
    to: params.recipientEmail,
    subject,
    html,
    emailType: "welcome",
  });
}

export async function sendTestEmail(recipientEmail: string) {
  const subject = "HomeSure Management — Test Email";
  const html = testEmailTemplate();

  return dispatchEmail({
    to: recipientEmail,
    subject,
    html,
    emailType: "test",
  });
}

/** Fire-and-forget helper — logs errors but never throws. */
export function sendWelcomeEmailAsync(params: {
  recipientEmail: string;
  recipientName: string;
  loginLink: string;
}) {
  void sendWelcomeEmail(params).catch((error) => {
    console.error("[EmailService] Async welcome email failed:", error);
  });
}
