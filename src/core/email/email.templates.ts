import { getEmailConfig } from "./email.config.server";

interface TemplateOptions {
  preheader: string;
  title: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  fallbackLink?: string;
}

function baseTemplate({ preheader, title, bodyHtml, ctaLabel, ctaUrl, fallbackLink }: TemplateOptions): string {
  const config = getEmailConfig();

  const ctaBlock =
    ctaLabel && ctaUrl
      ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 28px auto 0;">
          <tr>
            <td style="border-radius: 8px; background: #2563eb;">
              <a href="${ctaUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">
                ${ctaLabel}
              </a>
            </td>
          </tr>
        </table>
      `
      : "";

  const fallbackBlock = fallbackLink
    ? `
        <p style="margin: 24px 0 0; font-size: 13px; line-height: 1.6; color: #64748b; word-break: break-all;">
          If the button doesn't work, copy and paste this link into your browser:<br />
          <a href="${fallbackLink}" style="color: #2563eb;">${fallbackLink}</a>
        </p>
      `
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: Inter, Arial, sans-serif;">
  <span style="display:none;font-size:1px;color:#f1f5f9;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f1f5f9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);">
          <tr>
            <td style="padding: 28px 32px 12px; text-align: center; border-bottom: 1px solid #e2e8f0;">
              <div style="display: inline-block; width: 48px; height: 48px; border-radius: 12px; background: #dbeafe; color: #2563eb; font-size: 22px; font-weight: 700; line-height: 48px;">HS</div>
              <div style="margin-top: 12px; font-size: 20px; font-weight: 700; color: #0f172a;">HomeSure Management</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 16px; font-size: 24px; line-height: 1.3; color: #0f172a;">${title}</h1>
              ${bodyHtml}
              ${ctaBlock}
              ${fallbackBlock}
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px 28px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #64748b;">
                © ${new Date().getFullYear()} HomeSure Management. All rights reserved.<br />
                Need help? Contact <a href="mailto:${config.supportEmail}" style="color: #2563eb;">${config.supportEmail}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function invitationEmailTemplate(params: {
  recipientName: string;
  role: string;
  invitationLink: string;
}): string {
  return baseTemplate({
    preheader: "You've been invited to join HomeSure Management.",
    title: "You're invited to HomeSure",
    bodyHtml: `
      <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.7; color: #334155;">
        Hello ${params.recipientName},
      </p>
      <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.7; color: #334155;">
        You've been invited to join <strong>HomeSure Management</strong> as a <strong>${params.role}</strong>.
      </p>
      <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #334155;">
        Click the button below to create your account. This invitation expires in 24 hours.
      </p>
    `,
    ctaLabel: "Accept invitation",
    ctaUrl: params.invitationLink,
    fallbackLink: params.invitationLink,
  });
}

export function verificationEmailTemplate(params: {
  recipientName: string;
  verificationLink: string;
}): string {
  return baseTemplate({
    preheader: "Confirm your email to activate your HomeSure account.",
    title: "Confirm your email address",
    bodyHtml: `
      <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.7; color: #334155;">
        Hello ${params.recipientName},
      </p>
      <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.7; color: #334155;">
        Thanks for signing up for <strong>HomeSure Management</strong>. Please confirm your email address to activate your account.
      </p>
      <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #334155;">
        This verification link expires in 24 hours.
      </p>
    `,
    ctaLabel: "Verify email address",
    ctaUrl: params.verificationLink,
    fallbackLink: params.verificationLink,
  });
}

export function passwordResetEmailTemplate(params: {
  recipientName: string;
  resetLink: string;
}): string {
  return baseTemplate({
    preheader: "Reset your HomeSure Management password.",
    title: "Reset your password",
    bodyHtml: `
      <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.7; color: #334155;">
        Hello ${params.recipientName},
      </p>
      <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.7; color: #334155;">
        We received a request to reset your password for <strong>HomeSure Management</strong>.
      </p>
      <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #334155;">
        This reset link expires in 30 minutes. If you didn't request this, you can safely ignore this email.
      </p>
    `,
    ctaLabel: "Reset password",
    ctaUrl: params.resetLink,
    fallbackLink: params.resetLink,
  });
}

export function welcomeEmailTemplate(params: {
  recipientName: string;
  loginLink: string;
}): string {
  return baseTemplate({
    preheader: "Your HomeSure account is ready.",
    title: "Welcome to HomeSure",
    bodyHtml: `
      <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.7; color: #334155;">
        Hello ${params.recipientName},
      </p>
      <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.7; color: #334155;">
        Your email has been verified and your <strong>HomeSure Management</strong> account is now active.
      </p>
      <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #334155;">
        Sign in to access your dashboard and start managing properties, tenants, and service requests.
      </p>
    `,
    ctaLabel: "Sign in to HomeSure",
    ctaUrl: params.loginLink,
    fallbackLink: params.loginLink,
  });
}

export function testEmailTemplate(): string {
  return baseTemplate({
    preheader: "HomeSure Management test email.",
    title: "Test email successful",
    bodyHtml: `
      <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #334155;">
        This is a test email from <strong>HomeSure Management</strong>. Your email integration is working correctly.
      </p>
    `,
  });
}

