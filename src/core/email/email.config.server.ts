import process from "node:process";

export interface EmailConfig {
  resendApiKey: string;
  emailFrom: string;
  appUrl: string;
  supportEmail: string;
}

function normalizeAppUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export function getEmailConfig(): EmailConfig {
  const resendApiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM;
  const appUrl = process.env.APP_URL || process.env.VITE_SITE_URL || "http://localhost:3000";

  if (!resendApiKey) {
    throw new Error("Missing RESEND_API_KEY environment variable.");
  }

  if (!emailFrom) {
    throw new Error("Missing EMAIL_FROM environment variable.");
  }

  return {
    resendApiKey,
    emailFrom: `HomeSure Management <${emailFrom}>`,
    appUrl: normalizeAppUrl(appUrl),
    supportEmail: process.env.SUPPORT_EMAIL || emailFrom,
  };
}

export function getAppUrl(): string {
  try {
    return getEmailConfig().appUrl;
  } catch {
    const fallback = process.env.APP_URL || process.env.VITE_SITE_URL || "http://localhost:3000";
    return fallback.endsWith("/") ? fallback.slice(0, -1) : fallback;
  }
}
