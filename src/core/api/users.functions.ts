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

// ================= SERVER FUNCTIONS FOR SUPER ADMIN LIVE DATA =================

export interface PlatformUser {
  userId: number;
  authUserId: string | null;
  name: string;
  email: string;
  role: string;
  joined: string;
  status: "Active" | "Pending" | "Invited" | "Expired";
  isInvitation?: boolean;
  invitationToken?: string;
}

const ROLE_BY_ID_MAP: Record<number, string> = {
  1: "super_admin",
  2: "landlord",
  3: "tenant",
  4: "contractor",
  5: "realtor",
  6: "service_admin",
};

export const fetchPlatformUsers = createServerFn({ method: "GET" })
  .handler(async (): Promise<PlatformUser[]> => {
    const admin = getSupabaseAdmin();
    const today = new Date().toISOString().split("T")[0];
    
    try {
      // 1. Fetch all registered users
      const { data: users, error: usersError } = await admin
        .from("users")
        .select("user_id, auth_user_id, name, email, role_id, status, created_at")
        .order("created_at", { ascending: false });

      if (usersError) {
        console.error("[fetchPlatformUsers] Error fetching users:", usersError);
      }

      const registeredEmails = new Set<string>();
      const registeredUsers: PlatformUser[] = (users || []).map((u: any) => {
        registeredEmails.add((u.email || "").toLowerCase());
        return {
          userId: u.user_id,
          authUserId: u.auth_user_id || null,
          name: u.name || u.email || "Unknown",
          email: u.email || "",
          role: ROLE_BY_ID_MAP[u.role_id] || "landlord",
          joined: u.created_at
            ? new Date(u.created_at).toISOString().split("T")[0]
            : today,
          status: (u.status as PlatformUser["status"]) || "Pending",
          isInvitation: false,
        };
      });

      // 2. Fetch pending invitations
      const { data: invitations, error: invError } = await admin
        .from("invitations")
        .select("id, email, name, role, token_hash, expires_at, accepted_at, created_at")
        .is("accepted_at", null)
        .order("created_at", { ascending: false });

      if (invError) {
        console.error("[fetchPlatformUsers] Error fetching invitations:", invError);
      }

      const now = Date.now();
      const invitedUsers: PlatformUser[] = (invitations || [])
        .filter((inv: any) => !registeredEmails.has((inv.email || "").toLowerCase()))
        .map((inv: any, idx: number) => {
          const expired = inv.expires_at ? new Date(inv.expires_at).getTime() < now : false;
          return {
            userId: -(idx + 1),
            authUserId: null,
            name: inv.name || inv.email || "Invited User",
            email: inv.email || "",
            role: inv.role || "landlord",
            joined: inv.created_at
              ? new Date(inv.created_at).toISOString().split("T")[0]
              : today,
            status: expired ? "Expired" : "Invited",
            isInvitation: true,
            invitationToken: inv.token_hash,
          };
        });

      return [...registeredUsers, ...invitedUsers];
    } catch (err) {
      console.error("[fetchPlatformUsers] Exception:", err);
      return [];
    }
  });

export interface PlatformStats {
  totalUsers: number;
  activeLandlords: number;
  activeTenants: number;
  activeContractors: number;
  activeRealtors: number;
  activeServiceAdmins: number;
  totalProperties: number;
  pendingRequests: number;
}

export const fetchPlatformStats = createServerFn({ method: "GET" })
  .handler(async (): Promise<PlatformStats> => {
    const admin = getSupabaseAdmin();
    try {
      const [usersResult, propertiesResult, requestsResult] = await Promise.all([
        admin.from("users").select("role_id, status"),
        admin.from("properties").select("property_id", { count: "exact", head: true }),
        admin.from("service_requests").select("status").neq("status", "Completed"),
      ]);

      const users: Array<{ role_id: number; status: string }> = usersResult.data || [];

      const countRole = (roleId: number, activeOnly = true) =>
        users.filter((u) => u.role_id === roleId && (!activeOnly || u.status === "Active")).length;

      return {
        totalUsers: users.length,
        activeLandlords: countRole(2),
        activeTenants: countRole(3),
        activeContractors: countRole(4),
        activeRealtors: countRole(5),
        activeServiceAdmins: countRole(6),
        totalProperties: propertiesResult.count ?? 0,
        pendingRequests: (requestsResult.data || []).length,
      };
    } catch (err) {
      console.error("[fetchPlatformStats] Exception:", err);
      return {
        totalUsers: 0,
        activeLandlords: 0,
        activeTenants: 0,
        activeContractors: 0,
        activeRealtors: 0,
        activeServiceAdmins: 0,
        totalProperties: 0,
        pendingRequests: 0,
      };
    }
  });

export interface AuditLogEntry {
  id: string;
  time: string;
  actor: string;
  action: string;
  ip: string;
  status?: string;
}

export const fetchPlatformAuditLogs = createServerFn({ method: "GET" })
  .handler(async (): Promise<AuditLogEntry[]> => {
    const admin = getSupabaseAdmin();
    try {
      const { data, error } = await admin
        .from("email_logs")
        .select("id, recipient, email_type, subject, status, created_at")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) {
        console.error("[fetchPlatformAuditLogs] Error:", error);
        return [];
      }

      return (data || []).map((row: any, idx: number) => ({
        id: String(row.id ?? idx),
        time: row.created_at
          ? new Date(row.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
          : "—",
        actor: row.recipient || "system",
        action: `${(row.email_type || "email").replace(/_/g, " ")} — ${row.subject || ""}`,
        ip: "—",
        status: row.status || "sent",
      }));
    } catch (err) {
      console.error("[fetchPlatformAuditLogs] Exception:", err);
      return [];
    }
  });
