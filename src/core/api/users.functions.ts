import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseAdmin } from "@/core/db/supabase-admin.server";
import { ROLE_IDS, type Role } from "@/features/auth/utils/roles";

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

function getSiteUrl() {
  if (process.env.VITE_SITE_URL) return process.env.VITE_SITE_URL;
  if (process.env.SITE_URL) return process.env.SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export const invitePlatformUser = createServerFn({ method: "POST" })
  .inputValidator(inviteSchema)
  .handler(async ({ data }) => {
    const admin = getSupabaseAdmin();
    const siteUrl = getSiteUrl();

    const { data: authData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
      data.email,
      {
        redirectTo: `${siteUrl}/login`,
        data: { name: data.name, role: data.role },
      }
    );

    if (inviteError) {
      throw new Error(inviteError.message);
    }

    if (!authData.user) {
      throw new Error("Invite failed: no user returned from Supabase.");
    }

    const { error: profileError } = await admin.from("users").insert({
      auth_user_id: authData.user.id,
      name: data.name,
      email: data.email,
      role_id: ROLE_IDS[data.role as Role],
      status: "Invited",
    });

    if (profileError) {
      await admin.auth.admin.deleteUser(authData.user.id);
      throw new Error(profileError.message);
    }

    return { success: true };
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
