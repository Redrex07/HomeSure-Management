import process from "node:process";

export interface EmailConfig {
  emailUser: string;
  emailPass: string;
  emailFrom: string;
  appUrl: string;
  supportEmail: string;
}

function normalizeAppUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function normalizeEmailFrom(emailFrom: string): string {
  return emailFrom.includes("<") ? emailFrom : `HomeSure Management <${emailFrom}>`;
}

function normalizeSupportEmail(emailFrom: string): string {
  const match = emailFrom.match(/<([^>]+)>/);
  return match?.[1] || emailFrom;
}

export function getEmailConfig(): EmailConfig {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const emailFrom = process.env.EMAIL_FROM || emailUser;
  const appUrl = process.env.APP_URL || process.env.VITE_SITE_URL || "http://localhost:3000";

  if (!emailUser) {
    throw new Error("Missing EMAIL_USER environment variable.");
  }

  if (!emailPass) {
    throw new Error("Missing EMAIL_PASS environment variable.");
  }

  if (!emailFrom) {
    throw new Error("Missing EMAIL_FROM environment variable.");
  }

  return {
    emailUser,
    emailPass,
    emailFrom: normalizeEmailFrom(emailFrom),
    appUrl: normalizeAppUrl(appUrl),
    supportEmail: process.env.SUPPORT_EMAIL || normalizeSupportEmail(emailFrom),
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
