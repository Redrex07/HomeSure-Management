import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseAdmin } from "@/core/db/supabase-admin.server";
import { getAppUrl } from "@/core/email/email.config.server";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWelcomeEmailAsync,
} from "@/core/email/email.service.server";
import {
  createEmailToken,
  markEmailTokenUsed,
  markInvitationAccepted,
  validateEmailToken,
  validateInvitation,
} from "@/core/email/tokens.server";
import { ROLE_IDS, ROLE_LABELS, type Role } from "@/features/auth/utils/roles";

const roleSchema = z.enum([
  "super_admin",
  "service_admin",
  "landlord",
  "tenant",
  "contractor",
  "realtor",
]);

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: roleSchema,
  inviteToken: z.string().optional(),
});

const verifySchema = z.object({
  token: z.string().min(1),
});

const resendVerificationSchema = z.object({
  email: z.string().email(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

const invitePreviewSchema = z.object({
  token: z.string().min(1),
});

export const registerAccount = createServerFn({ method: "POST" })
  .inputValidator(registerSchema)
  .handler(async ({ data }) => {
    const admin = getSupabaseAdmin();
    const appUrl = getAppUrl();
    const email = data.email.toLowerCase();

    let isInviteSignup = false;
    let inviteToken = data.inviteToken;

    if (inviteToken) {
      const inviteResult = await validateInvitation(inviteToken);
      if (!inviteResult.valid) {
        throw new Error(inviteResult.reason);
      }
      if (inviteResult.invitation.email !== email) {
        throw new Error("This invitation was sent to a different email address.");
      }
      isInviteSignup = true;
      data.role = inviteResult.invitation.role as Role;
      data.name = data.name || inviteResult.invitation.name;
    }

    const { data: existingProfile } = await admin
      .from("users")
      .select("user_id")
      .eq("email", email)
      .maybeSingle();

    if (existingProfile) {
      throw new Error("An account with this email already exists.");
    }

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: isInviteSignup,
      user_metadata: { name: data.name, role: data.role },
    });

    if (authError || !authData.user) {
      throw new Error(authError?.message || "Failed to create account.");
    }

    const status = isInviteSignup ? "Active" : "Pending";

    const { error: profileError } = await admin.from("users").insert({
      auth_user_id: authData.user.id,
      name: data.name,
      email,
      role_id: ROLE_IDS[data.role],
      status,
    });

    if (profileError) {
      await admin.auth.admin.deleteUser(authData.user.id);
      throw new Error(profileError.message);
    }

    if (isInviteSignup && inviteToken) {
      await markInvitationAccepted(inviteToken);
      sendWelcomeEmailAsync({
        recipientEmail: email,
        recipientName: data.name,
        loginLink: `${appUrl}/login`,
      });
      return { success: true, needsVerification: false };
    }

    const rawToken = await createEmailToken({
      type: "verification",
      email,
      metadata: { name: data.name },
      expiresInHours: 24,
    });

    const verificationLink = `${appUrl}/auth/verify?token=${rawToken}`;
    const emailResult = await sendVerificationEmail({
      recipientEmail: email,
      recipientName: data.name,
      verificationLink,
    });

    if (!emailResult.success) {
      await admin.from("users").delete().eq("auth_user_id", authData.user.id);
      await admin.auth.admin.deleteUser(authData.user.id);
      throw new Error(emailResult.error || "Account created but verification email could not be sent.");
    }

    return { success: true, needsVerification: true };
  });

export const verifyEmailAddress = createServerFn({ method: "POST" })
  .inputValidator(verifySchema)
  .handler(async ({ data }) => {
    const admin = getSupabaseAdmin();
    const appUrl = getAppUrl();

    const tokenResult = await validateEmailToken(data.token, "verification");
    if (!tokenResult.valid) {
      throw new Error(tokenResult.reason);
    }

    const email = tokenResult.token.email;

    const { data: profile, error: profileError } = await admin
      .from("users")
      .select("user_id, name, auth_user_id, status")
      .eq("email", email)
      .maybeSingle();

    if (profileError || !profile) {
      throw new Error("User profile not found.");
    }

    if (profile.auth_user_id) {
      await admin.auth.admin.updateUserById(profile.auth_user_id, {
        email_confirm: true,
      });
    }

    await admin.from("users").update({ status: "Active" }).eq("user_id", profile.user_id);
    await markEmailTokenUsed(data.token, "verification");

    sendWelcomeEmailAsync({
      recipientEmail: email,
      recipientName: profile.name,
      loginLink: `${appUrl}/login`,
    });

    return { success: true, email, name: profile.name };
  });

export const resendVerificationEmail = createServerFn({ method: "POST" })
  .inputValidator(resendVerificationSchema)
  .handler(async ({ data }) => {
    const admin = getSupabaseAdmin();
    const appUrl = getAppUrl();
    const email = data.email.toLowerCase();

    const { data: profile, error } = await admin
      .from("users")
      .select("name, status")
      .eq("email", email)
      .maybeSingle();

    if (error || !profile) {
      throw new Error("No account found for this email.");
    }

    if (profile.status === "Active") {
      throw new Error("This email is already verified. You can sign in.");
    }

    const rawToken = await createEmailToken({
      type: "verification",
      email,
      metadata: { name: profile.name },
      expiresInHours: 24,
    });

    const verificationLink = `${appUrl}/auth/verify?token=${rawToken}`;
    const emailResult = await sendVerificationEmail({
      recipientEmail: email,
      recipientName: profile.name,
      verificationLink,
    });

    if (!emailResult.success) {
      throw new Error(emailResult.error || "Failed to send verification email.");
    }

    return { success: true };
  });

export const requestPasswordReset = createServerFn({ method: "POST" })
  .inputValidator(forgotPasswordSchema)
  .handler(async ({ data }) => {
    const admin = getSupabaseAdmin();
    const appUrl = getAppUrl();
    const email = data.email.toLowerCase();

    const { data: profile } = await admin
      .from("users")
      .select("name, auth_user_id")
      .eq("email", email)
      .maybeSingle();

    // Always return success to avoid email enumeration
    if (!profile) {
      return { success: true };
    }

    const rawToken = await createEmailToken({
      type: "password_reset",
      email,
      metadata: { name: profile.name },
      expiresInHours: 0.5,
    });

    const resetLink = `${appUrl}/reset-password?token=${rawToken}`;
    const emailResult = await sendPasswordResetEmail({
      recipientEmail: email,
      recipientName: profile.name,
      resetLink,
    });

    if (!emailResult.success) {
      console.error("[Auth] Password reset email failed:", emailResult.error);
      throw new Error("Unable to send password reset email. Please try again later.");
    }

    return { success: true };
  });

export const resetAccountPassword = createServerFn({ method: "POST" })
  .inputValidator(resetPasswordSchema)
  .handler(async ({ data }) => {
    const admin = getSupabaseAdmin();

    const tokenResult = await validateEmailToken(data.token, "password_reset");
    if (!tokenResult.valid) {
      throw new Error(tokenResult.reason);
    }

    const email = tokenResult.token.email;

    const { data: profile, error: profileError } = await admin
      .from("users")
      .select("auth_user_id")
      .eq("email", email)
      .maybeSingle();

    if (profileError || !profile?.auth_user_id) {
      throw new Error("User account not found.");
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(profile.auth_user_id, {
      password: data.password,
    });

    if (updateError) {
      throw new Error(updateError.message);
    }

    await markEmailTokenUsed(data.token, "password_reset");

    return { success: true };
  });

export const getInviteDetails = createServerFn({ method: "POST" })
  .inputValidator(invitePreviewSchema)
  .handler(async ({ data }) => {
    const result = await validateInvitation(data.token);
    if (!result.valid) {
      throw new Error(result.reason);
    }

    return {
      email: result.invitation.email,
      name: result.invitation.name,
      role: result.invitation.role as Role,
      roleLabel: ROLE_LABELS[result.invitation.role as Role] || result.invitation.role,
    };
  });
