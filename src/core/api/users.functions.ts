import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getAppUrl } from "@/core/email/email.config.server";
import { sendInvitationEmail } from "@/core/email/email.service.server";
import { createInvitation } from "@/core/email/tokens.server";
import { getSupabaseAdmin } from "@/core/db/supabase-admin.server";
import { ROLE_LABELS, type Role } from "@/features/auth/utils/roles";

const roleSchema = z.enum([
  "super_admin",
  "service_admin",
  "landlord",
  "tenant",
  "contractor",
  "realtor",
]);

const inviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: roleSchema,
});

const deleteSchema = z.object({
  userId: z.number(),
  authUserId: z.string().nullable(),
});

export const invitePlatformUser = createServerFn({ method: "POST" })
  .inputValidator(inviteSchema)
  .handler(async ({ data }) => {
    const admin = getSupabaseAdmin();
    const appUrl = getAppUrl();
    const email = data.email.toLowerCase();

    const { data: existingUser } = await admin
      .from("users")
      .select("user_id")
      .eq("email", email)
      .maybeSingle();

    if (existingUser) {
      throw new Error("A user with this email already exists.");
    }

    const { rawToken, resent } = await createInvitation({
      email,
      name: data.name,
      role: data.role as Role,
    });

    const invitationLink = `${appUrl}/signup?invite=${rawToken}`;
    const emailResult = await sendInvitationEmail({
      recipientEmail: email,
      recipientName: data.name,
      role: ROLE_LABELS[data.role as Role],
      invitationLink,
    });

    if (!emailResult.success) {
      throw new Error(emailResult.error || "Failed to send invitation email.");
    }

    return { success: true, resent };
  });

export const deletePlatformUser = createServerFn({ method: "POST" })
  .inputValidator(deleteSchema)
  .handler(async ({ data }) => {
    const admin = getSupabaseAdmin();

    const { error: profileError } = await admin
      .from("users")
      .delete()
      .eq("user_id", data.userId);

    if (profileError) {
      throw new Error(profileError.message);
    }

    if (data.authUserId) {
      const { error: authError } = await admin.auth.admin.deleteUser(data.authUserId);
      if (authError) {
        throw new Error(authError.message);
      }
    }

    return { success: true };
  });
