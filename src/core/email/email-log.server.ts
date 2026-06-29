import { getSupabaseAdmin } from "@/core/db/supabase-admin.server";

export type EmailLogType =
  | "invitation"
  | "verification"
  | "password_reset"
  | "welcome"
  | "test";

export async function logEmailSent(params: {
  recipient: string;
  emailType: EmailLogType;
  subject: string;
}): Promise<void> {
  try {
    const admin = getSupabaseAdmin();
    await admin.from("email_logs").insert({
      recipient: params.recipient,
      email_type: params.emailType,
      subject: params.subject,
      status: "sent",
    });
  } catch (error) {
    console.error("[EmailLog] Failed to log sent email:", error);
  }
}

export async function logEmailFailed(params: {
  recipient: string;
  emailType: EmailLogType;
  subject: string;
  errorMessage: string;
}): Promise<void> {
  try {
    const admin = getSupabaseAdmin();
    await admin.from("email_logs").insert({
      recipient: params.recipient,
      email_type: params.emailType,
      subject: params.subject,
      status: "failed",
      error_message: params.errorMessage,
    });
  } catch (error) {
    console.error("[EmailLog] Failed to log email failure:", error);
  }
}
