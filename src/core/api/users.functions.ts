import { createServerFn, getWebRequest } from "@tanstack/react-start";
import { z } from "zod";
import { getAppUrl } from "@/core/email/email.config.server";
import { sendInvitationEmail } from "@/core/email/email.service.server";
import { createInvitation } from "@/core/email/tokens.server";
import { getSupabaseAdmin } from "@/core/db/supabase-admin.server";
import { ROLE_IDS, ROLE_LABELS, type Role } from "@/features/auth/utils/roles";

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
  adminEmail: z.string().optional(),
  adminName: z.string().optional(),
  adminRole: z.string().optional(),
});

const deleteSchema = z.object({
  userId: z.number(),
  authUserId: z.string().nullable(),
  adminEmail: z.string().optional(),
  adminName: z.string().optional(),
  adminRole: z.string().optional(),
  userEmail: z.string().optional(),
});

// Helper for server-side activity logging
export async function logActivityInternal(payload: {
  userEmail?: string;
  userName?: string;
  role?: string;
  action: string;
  description?: string;
}) {
  try {
    const admin = getSupabaseAdmin();
    const request = getWebRequest();
    const userAgent = request?.headers.get("user-agent") || "";
    const ipAddress = request?.headers.get("x-forwarded-for") || "127.0.0.1";

    let browser = "Unknown";
    if (/chrome|crios/i.test(userAgent)) browser = "Chrome";
    else if (/firefox|iceweasel/i.test(userAgent)) browser = "Firefox";
    else if (/safari/i.test(userAgent)) browser = "Safari";
    else if (/edge/i.test(userAgent)) browser = "Edge";

    let device = "Desktop";
    if (/mobi|android|iphone|ipad/i.test(userAgent)) device = "Mobile";

    await admin.from("activity_logs").insert([{
      user_email: payload.userEmail || "system",
      user_name: payload.userName || "System",
      role: payload.role || "system",
      action: payload.action,
      description: payload.description || "",
      ip_address: ipAddress,
      browser,
      device
    }]);
  } catch (e) {
    console.error("Activity logging failed:", e);
  }
}

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

    await logActivityInternal({
      userEmail: data.adminEmail || "system",
      userName: data.adminName || "System",
      role: data.adminRole || "system",
      action: "User Invited",
      description: `Invited user ${data.name} (${data.email}) as ${data.role}`,
    });

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

    await logActivityInternal({
      userEmail: data.adminEmail || "system",
      userName: data.adminName || "System",
      role: data.adminRole || "system",
      action: "User Deleted",
      description: `Deleted user ${data.userEmail || data.userId}`,
    });

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
  status: "Active" | "Pending" | "Invited" | "Expired" | "Deactivated";
  region?: string | null;
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
        .select("user_id, auth_user_id, name, email, role_id, status, region, created_at")
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
          region: u.region || null,
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
  browser?: string;
  device?: string;
  role?: string;
  description?: string;
}

// Modify fetchPlatformAuditLogs to pull from activity_logs first, fallback to email_logs
export const fetchPlatformAuditLogs = createServerFn({ method: "GET" })
  .handler(async (): Promise<AuditLogEntry[]> => {
    const admin = getSupabaseAdmin();
    try {
      const { data: actLogs, error: actError } = await admin
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(250);

      if (!actError && actLogs && actLogs.length > 0) {
        return actLogs.map((row: any) => ({
          id: row.id,
          time: row.created_at
            ? new Date(row.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
            : "—",
          actor: row.user_name || row.user_email || "system",
          action: row.action,
          description: row.description || "",
          ip: row.ip_address || "—",
          browser: row.browser || "—",
          device: row.device || "—",
          role: row.role || "system"
        }));
      }

      // Fallback to email logs
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
        browser: "—",
        device: "—",
        role: "system",
        description: "Email Dispatched"
      }));
    } catch (err) {
      console.error("[fetchPlatformAuditLogs] Exception:", err);
      return [];
    }
  });

// ================= NEW SERVER FUNCTIONS FOR USER ROLE MANAGEMENT =================

export const updatePlatformUser = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    userId: z.number(),
    name: z.string(),
    email: z.string().email(),
    role: roleSchema,
    status: z.string(),
    region: z.string().nullable().optional(),
    adminEmail: z.string().optional(),
    adminName: z.string().optional(),
    adminRole: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    const admin = getSupabaseAdmin();
    const { error } = await admin
      .from("users")
      .update({
        name: data.name,
        email: data.email.toLowerCase(),
        role_id: ROLE_IDS[data.role],
        status: data.status,
        region: data.region || null
      })
      .eq("user_id", data.userId);

    if (error) throw new Error(error.message);

    await logActivityInternal({
      userEmail: data.adminEmail || "system",
      userName: data.adminName || "System",
      role: data.adminRole || "system",
      action: "User Updated",
      description: `Updated user ${data.name} (${data.email}) - Role: ${data.role}, Status: ${data.status}, Region: ${data.region || "None"}`,
    });

    return { success: true };
  });

export const resetPlatformUserPassword = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    authUserId: z.string(),
    userEmail: z.string(),
    newPassword: z.string().min(6),
    adminEmail: z.string().optional(),
    adminName: z.string().optional(),
    adminRole: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    const admin = getSupabaseAdmin();
    const { error } = await admin.auth.admin.updateUserById(data.authUserId, {
      password: data.newPassword
    });

    if (error) throw new Error(error.message);

    await logActivityInternal({
      userEmail: data.adminEmail || "system",
      userName: data.adminName || "System",
      role: data.adminRole || "system",
      action: "Password Reset",
      description: `Admin reset password for user ${data.userEmail}`,
    });

    return { success: true };
  });

export const logPlatformActivity = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    userEmail: z.string().optional(),
    userName: z.string().optional(),
    role: z.string().optional(),
    action: z.string(),
    description: z.string().optional()
  }))
  .handler(async ({ data }) => {
    await logActivityInternal(data);
    return { success: true };
  });

// ================= CLOSED ACCOUNT SYSTEM FUNCTIONS =================

export interface ClosureRequest {
  id: string;
  userId: number | null;
  userName: string | null;
  userEmail: string;
  role: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  requestedAt: string;
  closedAt: string | null;
  closedBy: string | null;
  rejectionReason: string | null;
}

export const fetchPlatformClosureRequests = createServerFn({ method: "GET" })
  .handler(async (): Promise<ClosureRequest[]> => {
    const admin = getSupabaseAdmin();
    try {
      const { data, error } = await admin
        .from("closure_requests")
        .select("*")
        .order("requested_at", { ascending: false });

      if (error) {
        console.error("Error fetching closure requests:", error);
        return [];
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        userName: row.user_name,
        userEmail: row.user_email,
        role: row.role,
        reason: row.reason,
        status: row.status,
        requestedAt: row.requested_at ? new Date(row.requested_at).toISOString().split("T")[0] : "—",
        closedAt: row.closed_at ? new Date(row.closed_at).toISOString().split("T")[0] : null,
        closedBy: row.closed_by,
        rejectionReason: row.rejection_reason
      }));
    } catch (err) {
      console.error("Exception fetching closure requests:", err);
      return [];
    }
  });

export const createPlatformClosureRequest = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    userId: z.number().nullable().optional(),
    userName: z.string().nullable().optional(),
    userEmail: z.string().email(),
    role: z.string(),
    reason: z.string(),
  }))
  .handler(async ({ data }) => {
    const admin = getSupabaseAdmin();
    const { error } = await admin
      .from("closure_requests")
      .insert([{
        user_id: data.userId || null,
        user_name: data.userName || null,
        user_email: data.userEmail.toLowerCase(),
        role: data.role,
        reason: data.reason,
        status: "Pending"
      }]);

    if (error) throw new Error(error.message);

    await logActivityInternal({
      userEmail: data.userEmail,
      userName: data.userName || "User",
      role: data.role,
      action: "Closure Requested",
      description: `Requested account closure. Reason: ${data.reason}`,
    });

    return { success: true };
  });

export const updatePlatformClosureRequest = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    id: z.string(),
    status: z.enum(["Approved", "Rejected"]),
    rejectionReason: z.string().nullable().optional(),
    adminEmail: z.string().optional(),
    adminName: z.string().optional(),
    adminRole: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    const admin = getSupabaseAdmin();
    
    const { data: request, error: fetchErr } = await admin
      .from("closure_requests")
      .select("*")
      .eq("id", data.id)
      .single();

    if (fetchErr || !request) {
      throw new Error("Closure request not found.");
    }

    const { error } = await admin
      .from("closure_requests")
      .update({
        status: data.status,
        rejection_reason: data.rejectionReason || null,
        closed_at: data.status === "Approved" ? new Date().toISOString() : null,
        closed_by: data.status === "Approved" ? (data.adminName || data.adminEmail || "Admin") : null
      })
      .eq("id", data.id);

    if (error) throw new Error(error.message);

    if (data.status === "Approved") {
      await admin
        .from("users")
        .update({ status: "Deactivated" })
        .eq("email", request.user_email);
        
      if (request.user_id) {
        const { data: userProfile } = await admin
          .from("users")
          .select("auth_user_id")
          .eq("user_id", request.user_id)
          .maybeSingle();

        if (userProfile?.auth_user_id) {
          await admin.auth.admin.updateUserById(userProfile.auth_user_id, {
            ban_duration: "1000h"
          });
        }
      }
    }

    await logActivityInternal({
      userEmail: data.adminEmail || "system",
      userName: data.adminName || "System",
      role: data.adminRole || "system",
      action: `Closure ${data.status}`,
      description: `Closure request for ${request.user_email} was ${data.status.toLowerCase()}`,
    });

    return { success: true };
  });

// ================= SYSTEM CONFIGURATION FUNCTIONS =================

export const getSystemSettings = createServerFn({ method: "GET" })
  .handler(async () => {
    const admin = getSupabaseAdmin();
    try {
      const { data, error } = await admin.from("system_settings").select("*");
      if (error) {
        return [
          { key: "general", value: { platformName: "HomeSure", logoUrl: "", maintenanceMode: false } },
          { key: "smtp", value: { host: "smtp.gmail.com", port: 587, user: "smtp@homesure.com", secure: true } },
          { key: "payment", value: { gateway: "razorpay", currency: "INR", taxRate: 18 } },
          { key: "security", value: { minPasswordLength: 8, sessionTimeoutMinutes: 30, lockoutAttempts: 5 } }
        ];
      }
      return data || [];
    } catch (err) {
      console.error("Exception fetching system settings:", err);
      return [];
    }
  });

export const updateSystemSettings = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    key: z.string(),
    value: z.any(),
    adminEmail: z.string().optional(),
    adminName: z.string().optional(),
    adminRole: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    const admin = getSupabaseAdmin();
    const { error } = await admin
      .from("system_settings")
      .upsert({
        key: data.key,
        value: data.value,
        updated_at: new Date().toISOString()
      });

    if (error) throw new Error(error.message);

    await logActivityInternal({
      userEmail: data.adminEmail || "system",
      userName: data.adminName || "System",
      role: data.adminRole || "system",
      action: "Settings Updated",
      description: `Updated system settings: ${data.key}`,
    });

    return { success: true };
  });

// ================= SUBSCRIPTION PLANS CRUD FUNCTIONS =================

export const fetchPlatformPlans = createServerFn({ method: "GET" })
  .handler(async () => {
    const admin = getSupabaseAdmin();
    try {
      const { data, error } = await admin.from("plans").select("*").order("plan_id");
      if (error) {
        console.error("Error fetching plans:", error);
        return [];
      }
      return data || [];
    } catch (e) {
      console.error(e);
      return [];
    }
  });

export const createPlatformPlan = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    planName: z.string(),
    planType: z.string(),
    price: z.number(),
    description: z.string(),
    adminEmail: z.string().optional(),
    adminName: z.string().optional(),
    adminRole: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    const admin = getSupabaseAdmin();
    const { error } = await admin.from("plans").insert([{
      plan_name: data.planName,
      plan_type: data.planType,
      price: data.price,
      description: data.description
    }]);
    if (error) throw new Error(error.message);
    await logActivityInternal({
      userEmail: data.adminEmail,
      userName: data.adminName,
      role: data.adminRole,
      action: "Plan Created",
      description: `Created subscription plan: ${data.planName} (${data.price})`,
    });
    return { success: true };
  });

export const updatePlatformPlan = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    planId: z.number(),
    planName: z.string(),
    planType: z.string(),
    price: z.number(),
    description: z.string(),
    adminEmail: z.string().optional(),
    adminName: z.string().optional(),
    adminRole: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    const admin = getSupabaseAdmin();
    const { error } = await admin.from("plans").update({
      plan_name: data.planName,
      plan_type: data.planType,
      price: data.price,
      description: data.description
    }).eq("plan_id", data.planId);
    if (error) throw new Error(error.message);
    await logActivityInternal({
      userEmail: data.adminEmail,
      userName: data.adminName,
      role: data.adminRole,
      action: "Plan Updated",
      description: `Updated subscription plan: ${data.planName}`,
    });
    return { success: true };
  });

export const deletePlatformPlan = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    planId: z.number(),
    adminEmail: z.string().optional(),
    adminName: z.string().optional(),
    adminRole: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    const admin = getSupabaseAdmin();
    const { error } = await admin.from("plans").delete().eq("plan_id", data.planId);
    if (error) throw new Error(error.message);
    await logActivityInternal({
      userEmail: data.adminEmail,
      userName: data.adminName,
      role: data.adminRole,
      action: "Plan Deleted",
      description: `Deleted subscription plan ID: ${data.planId}`,
    });
    return { success: true };
  });

// ================= REVENUE AND COMMISSION TRACKING SERVER FUNCTIONS =================

export interface RevenueItem {
  id: string;
  type: "Subscription" | "Contractor Commission" | "Realtor Commission";
  source: string;
  amount: number;
  commission: number;
  date: string;
  status: string;
}

export const fetchPlatformRevenue = createServerFn({ method: "GET" })
  .handler(async (): Promise<{
    items: RevenueItem[];
    stats: {
      totalRevenue: number;
      subscriptionRevenue: number;
      contractorCommission: number;
      realtorCommission: number;
      monthlyRevenue: number;
      yearlyRevenue: number;
    }
  }> => {
    const admin = getSupabaseAdmin();
    try {
      // Fetch data from database
      const [subsRes, plansRes, invoicesRes, leasesRes, usersRes] = await Promise.all([
        admin.from("subscriptions").select("*"),
        admin.from("plans").select("*"),
        admin.from("invoices").select("*"),
        admin.from("lease_agreements").select("*"),
        admin.from("users").select("user_id, name, email")
      ]);

      const plansMap = new Map((plansRes.data || []).map(p => [p.plan_id, p]));
      const usersMap = new Map((usersRes.data || []).map(u => [u.user_id, u]));

      const items: RevenueItem[] = [];
      let subscriptionRevenue = 0;
      let contractorCommission = 0;
      let realtorCommission = 0;

      // Process Subscriptions
      (subsRes.data || []).forEach((sub: any) => {
        const plan = plansMap.get(sub.plan_id);
        const landlord = usersMap.get(sub.landlord_id);
        const price = plan ? Number(plan.price) : 999;
        
        subscriptionRevenue += price;
        items.push({
          id: `REV-SUB-${sub.subscription_id}`,
          type: "Subscription",
          source: landlord?.name || landlord?.email || `Landlord #${sub.landlord_id}`,
          amount: price,
          commission: price,
          date: sub.start_date ? new Date(sub.start_date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
          status: sub.subscription_status || "Active"
        });
      });

      // Process Invoices (Contractor Commission 10%)
      (invoicesRes.data || []).forEach((inv: any) => {
        const amt = Number(inv.invoice_amount || 0);
        const comm = amt * 0.10; // 10% commission
        
        contractorCommission += comm;
        items.push({
          id: `REV-CON-${inv.invoice_id}`,
          type: "Contractor Commission",
          source: `Contractor #${inv.contractor_id} (Invoice #${inv.invoice_number || inv.invoice_id})`,
          amount: amt,
          commission: comm,
          date: inv.invoice_date || new Date().toISOString().split("T")[0],
          status: inv.payment_status || "Paid"
        });
      });

      // Process Leases (Realtor Commission 5%)
      (leasesRes.data || []).forEach((lease: any) => {
        const rent = Number(lease.monthly_rent || 0);
        const comm = rent * 0.05; // 5% commission
        
        realtorCommission += comm;
        items.push({
          id: `REV-RLT-${lease.lease_id}`,
          type: "Realtor Commission",
          source: `Lease #${lease.agreement_number || lease.lease_id}`,
          amount: rent,
          commission: comm,
          date: lease.lease_start_date || new Date().toISOString().split("T")[0],
          status: lease.lease_status || "Active"
        });
      });

      // Sort by date descending
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Staging fallback mock data if DB is empty
      if (items.length === 0) {
        const today = new Date().toISOString().split("T")[0];
        items.push(
          { id: "REV-SUB-9001", type: "Subscription", source: "Alex Martinez", amount: 1499, commission: 1499, date: today, status: "Active" },
          { id: "REV-CON-4001", type: "Contractor Commission", source: "A1 Plumbing Inc. (Invoice #CON-231)", amount: 8500, commission: 850, date: today, status: "Paid" },
          { id: "REV-RLT-7001", type: "Realtor Commission", source: "Skyline Apartments (Lease #LA-193)", amount: 22000, commission: 1100, date: today, status: "Active" }
        );
        subscriptionRevenue = 1499;
        contractorCommission = 850;
        realtorCommission = 1100;
      }

      const totalRevenue = subscriptionRevenue + contractorCommission + realtorCommission;

      return {
        items,
        stats: {
          totalRevenue,
          subscriptionRevenue,
          contractorCommission,
          realtorCommission,
          monthlyRevenue: totalRevenue * 0.8,
          yearlyRevenue: totalRevenue * 9.6
        }
      };
    } catch (e) {
      console.error(e);
      return {
        items: [],
        stats: { totalRevenue: 0, subscriptionRevenue: 0, contractorCommission: 0, realtorCommission: 0, monthlyRevenue: 0, yearlyRevenue: 0 }
      };
    }
  });
