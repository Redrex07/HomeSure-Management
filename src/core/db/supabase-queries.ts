import { supabase } from "./supabase";
import { useSession } from "@/features/auth/store/auth-store";

/**
 * DEBUG: Test Supabase connection
 */
export async function testSupabaseConnection() {
  try {
    console.log("🧪 Testing Supabase connection...");

    // Try to query any table to see if connection works
    const { data, error } = await supabase.from("properties").select("*").limit(1);

    if (error) {
      console.error("❌ Supabase Error:", error);
      return { connected: false, error: error.message };
    }

    console.log("✅ Supabase connected!");
    return { connected: true, error: null };
  } catch (err) {
    console.error("❌ Connection test failed:", err);
    return { connected: false, error: String(err) };
  }
}

/**
 * DEBUG: Get ALL properties (no filter) to see what's in Supabase
 */
export async function getAllProperties() {
  try {
    console.log("🔍 Fetching ALL properties...");

    const { data, error } = await supabase.from("properties").select("*");

    console.log("📊 DATA:", data);
    console.log("❌ ERROR:", error);

    if (error) {
      console.error("Supabase Error:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Exception:", err);
    return [];
  }
}
export async function getLandlordProperties(landlordId: string) {
  try {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("landlord_id", landlordId)
      .order("property_id", { ascending: false });

    if (error) {
      console.error("Error fetching properties:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("Exception fetching properties:", err);
    return [];
  }
}

export async function createProperty(payload: any) {
  try {
    const { data, error } = await supabase
      .from("properties")
      .insert([payload])
      .select();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error creating property:", err);
    throw err;
  }
}

export async function updateProperty(id: number, payload: any) {
  try {
    const { data, error } = await supabase
      .from("properties")
      .update(payload)
      .eq("property_id", id)
      .select();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error updating property:", err);
    throw err;
  }
}

export async function deleteProperty(id: number) {
  try {
    const { data, error } = await supabase
      .from("properties")
      .delete()
      .eq("property_id", id)
      .select();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error deleting property:", err);
    throw err;
  }
}

/**
 * STEP 2: Get all tenants for the landlord's properties
 */
export async function getLandlordTenants(landlordId: string) {
  try {
    const { data, error } = await supabase
      .from("tenant_onboarding")
      .select("*")
      .order("onboarding_id", { ascending: false });

    if (error) {
      console.error("Error fetching tenants:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Exception fetching tenants:", err);
    return [];
  }
}

export async function createTenant(payload: any) {
  try {
    const { data, error } = await supabase
      .from("tenant_onboarding")
      .insert([payload])
      .select();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error creating tenant:", err);
    throw err;
  }
}

export async function updateTenant(id: string, payload: any) {
  try {
    const { data, error } = await supabase
      .from("tenant_onboarding")
      .update(payload)
      .eq("onboarding_id", id)
      .select();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error updating tenant:", err);
    throw err;
  }
}

export async function deleteTenant(id: string) {
  try {
    const { data, error } = await supabase
      .from("tenant_onboarding")
      .delete()
      .eq("onboarding_id", id)
      .select();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error deleting tenant:", err);
    throw err;
  }
}

/**
 * STEP 3: Get invoices/rent data for the landlord
 */
export async function getLandlordInvoices(landlordId: string) {
  try {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .order("invoice_id", { ascending: false });

    if (error) {
      console.error("Error fetching invoices:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("Exception fetching invoices:", err);
    return [];
  }
}

export async function createInvoice(payload: any) {
  try {
    const { data, error } = await supabase
      .from("invoices")
      .insert([payload])
      .select();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error creating invoice:", err);
    throw err;
  }
}

export async function deleteInvoice(id: string) {
  try {
    const numericId = parseInt(id.replace("INV-", ""), 10);
    const { data, error } = await supabase
      .from("invoices")
      .delete()
      .eq("invoice_id", numericId)
      .select();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error deleting invoice:", err);
    throw err;
  }
}

export async function updateInvoice(id: string, payload: any) {
  try {
    const numericId = parseInt(String(id).replace("INV-", ""), 10);
    const { data, error } = await supabase
      .from("invoices")
      .update(payload)
      .eq("invoice_id", numericId)
      .select();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error updating invoice:", err);
    throw err;
  }
}


/**
 * STEP 4: Get service requests for the landlord's properties
 */
export async function getLandlordServiceRequests(landlordId: string) {
  try {
    const { data, error } = await supabase
      .from("service_requests")
      .select("*")
      .eq("landlord_id", landlordId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching service requests:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("Exception fetching service requests:", err);
    return [];
  }
}

/**
 * STEP 5: Get revenue statistics for charts
 */
export async function getLandlordRevenueStats(landlordId: string) {
  try {
    const { data, error } = await supabase
      .from("invoices")
      .select("amount, paid_at")
      .eq("landlord_id", landlordId)
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

    if (error) {
      console.error("Error fetching revenue stats:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("Exception fetching revenue stats:", err);
    return [];
  }
}

/**
 * Get all invoices/rent for a landlord (for Rent Collection page)
 */
export async function getLandlordRentCollection(landlordId: string) {
  try {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("landlord_id", landlordId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching rent collection:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("Exception fetching rent collection:", err);
    return [];
  }
}

// ================= SERVICE REQUESTS =================

export async function getServiceRequests() {
  try {
    const { data, error } = await supabase
      .from("service_requests")
      .select(`
        service_request_id,
        title,
        description,
        category,
        priority,
        status,
        created_at,
        properties (
          property_name
        ),
        tenant:users!tenant_id (
          name
        )
      `)
      .order("service_request_id", { ascending: false });

    if (error) {
      console.error("Error fetching service requests:", error);
      return [];
    }

    return (data || []).map((r: any) => ({
      id: `SR-${r.service_request_id}`,
      title: r.title,
      property: r.properties?.property_name || "Unassigned Property",
      tenant: r.tenant?.name || "Unassigned Tenant",
      category: r.category,
      priority: r.priority,
      status: r.status,
      contractor: null,
      created: r.created_at ? new Date(r.created_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    }));
  } catch (err) {
    console.error("Exception fetching service requests:", err);
    return [];
  }
}

export async function createServiceRequest(payload: {
  title: string;
  category: string;
  priority: string;
  description: string;
  property_id?: number;
  tenant_id?: number;
  created_by?: number;
}) {
  try {
    const { data, error } = await supabase
      .from("service_requests")
      .insert([
        {
          title: payload.title,
          category: payload.category,
          priority: payload.priority,
          description: payload.description,
          status: "Pending",
          property_id: payload.property_id || 1,
          tenant_id: payload.tenant_id || 3,
          created_by: payload.created_by || 6,
        },
      ])
      .select();

    if (error) {
      console.error("Error creating service request:", error);
      throw error;
    }
    return data;
  } catch (err) {
    console.error("Exception creating service request:", err);
    throw err;
  }
}

export async function updateServiceRequest(
  id: string,
  payload: {
    title?: string;
    category?: string;
    priority?: string;
    status?: string;
    description?: string;
  }
) {
  try {
    const numericId = parseInt(id.replace("SR-", ""), 10);
    const { data, error } = await supabase
      .from("service_requests")
      .update(payload)
      .eq("service_request_id", numericId)
      .select();

    if (error) {
      console.error("Error updating service request:", error);
      throw error;
    }
    return data;
  } catch (err) {
    console.error("Exception updating service request:", err);
    throw err;
  }
}

export async function deleteServiceRequest(id: string) {
  try {
    const numericId = parseInt(id.replace("SR-", ""), 10);
    const { data, error } = await supabase
      .from("service_requests")
      .delete()
      .eq("service_request_id", numericId)
      .select();

    if (error) {
      console.error("Error deleting service request:", error);
      throw error;
    }
    return data;
  } catch (err) {
    console.error("Exception deleting service request:", err);
    throw err;
  }
}

// ================= CONTRACTORS =================

export async function getContractors() {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("user_id, name, phone, status")
      .eq("role_id", 4);

    if (error) {
      console.error("Error fetching contractors:", error);
      return [];
    }

    return (data || []).map((c: any) => ({
      id: `C-${c.user_id}`,
      name: c.name || "Unknown",
      trade: "—",
      rating: "—",
      jobs: 0,
      available: c.status === "Active",
      phone: c.phone || "—",
    }));
  } catch (err) {
    console.error("Exception fetching contractors:", err);
    return [];
  }
}

// ================= APPOINTMENTS =================

export async function getAppointments() {
  try {
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        appointment_id,
        appointment_date,
        appointment_time,
        status,
        service_requests (
          title,
          properties (
            property_name
          )
        ),
        contractor:users!contractor_id (
          name
        )
      `)
      .order("appointment_date", { ascending: true });

    if (error) {
      console.error("Error fetching appointments:", error);
      return [];
    }

    return (data || []).map((a: any) => ({
      id: `A-${a.appointment_id}`,
      title: a.service_requests?.title || "Maintenance Visit",
      date: a.appointment_date || new Date().toISOString().split("T")[0],
      time: a.appointment_time ? a.appointment_time.slice(0, 5) : "12:00",
      property: a.service_requests?.properties?.property_name || "Unassigned Property",
      contractor: a.contractor?.name || "Unassigned",
      status: a.status || "Scheduled",
    }));
  } catch (err) {
    console.error("Exception fetching appointments:", err);
    return [];
  }
}

// ================= ESTIMATES =================

export async function getEstimates() {
  try {
    const { data, error } = await supabase
      .from("estimates")
      .select(`
        estimate_id,
        service_request_id,
        estimated_cost,
        status,
        submitted_date,
        contractor:users!contractor_id (
          name
        )
      `)
      .order("submitted_date", { ascending: false });

    if (error) {
      console.error("Error fetching estimates:", error);
      return [];
    }

    return (data || []).map((e: any) => ({
      id: `E-${e.estimate_id}`,
      request: `SR-${e.service_request_id}`,
      contractor: e.contractor?.name || "Unknown Contractor",
      amount: Number(e.estimated_cost || 0),
      status: e.status || "Pending",
      submitted: e.submitted_date || new Date().toISOString().split("T")[0],
    }));
  } catch (err) {
    console.error("Exception fetching estimates:", err);
    return [];
  }
}

export async function updateEstimateStatus(id: string, status: string) {
  try {
    const numericId = parseInt(id.replace("E-", ""), 10);
    const { data, error } = await supabase
      .from("estimates")
      .update({ status })
      .eq("estimate_id", numericId)
      .select();

    if (error) {
      console.error("Error updating estimate status:", error);
      throw error;
    }
    return data;
  } catch (err) {
    console.error("Exception updating estimate status:", err);
    throw err;
  }
}

// ================= INVOICES =================

export async function getInvoices() {
  try {
    const { data, error } = await supabase
      .from("invoices")
      .select(`
        invoice_id,
        service_request_id,
        invoice_amount,
        invoice_date,
        payment_status
      `)
      .order("invoice_id", { ascending: false });

    if (error) {
      console.error("Error fetching invoices:", error);
      return [];
    }

    return (data || []).map((i: any) => ({
      id: `INV-${i.invoice_id}`,
      request: i.service_request_id ? `SR-${i.service_request_id}` : "General Billing",
      amount: Number(i.invoice_amount || 0),
      status: i.payment_status || "Pending",
      issued: i.invoice_date || new Date().toISOString().split("T")[0],
      due: i.invoice_date ? new Date(new Date(i.invoice_date).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      reason: "",
    }));
  } catch (err) {
    console.error("Exception fetching invoices:", err);
    return [];
  }
}

export async function updateInvoiceStatus(id: string, payload: { status: string; reason?: string }) {
  try {
    const numericId = parseInt(id.replace("INV-", ""), 10);
    const { data, error } = await supabase
      .from("invoices")
      .update({ payment_status: payload.status })
      .eq("invoice_id", numericId)
      .select();

    if (error) {
      console.error("Error updating invoice status:", error);
      throw error;
    }
    return data;
  } catch (err) {
    console.error("Exception updating invoice status:", err);
    throw err;
  }
}

// ================= SUPPORT TICKETS =================

export async function getSupportTickets() {
  try {
    const { data, error } = await supabase
      .from("support_tickets")
      .select(`
        ticket_id,
        subject,
        status,
        created_at,
        priority,
        user:users!user_id (
          name,
          roles (
            role_name
          )
        )
      `)
      .order("ticket_id", { ascending: false });

    if (error) {
      console.error("Error fetching support tickets:", error);
      return [];
    }

    return (data || []).map((t: any) => ({
      id: `TK-${t.ticket_id}`,
      subject: t.subject,
      user: t.user?.name || "Unknown User",
      role: t.user?.roles?.role_name || "Reporter",
      priority: t.priority || (t.ticket_id % 3 === 0 ? "High" : t.ticket_id % 2 === 0 ? "Low" : "Medium"),
      status: t.status || "Open",
      created: t.created_at ? new Date(t.created_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    }));
  } catch (err) {
    console.error("Exception fetching support tickets:", err);
    return [];
  }
}

export async function createSupportTicket(payload: {
  user_id: number;
  subject: string;
  description: string;
  priority: string;
}) {
  try {
    const { data, error } = await supabase
      .from("support_tickets")
      .insert([
        {
          user_id: payload.user_id,
          subject: payload.subject,
          description: payload.description,
          priority: payload.priority,
          status: "Open",
        },
      ])
      .select();

    if (error) {
      console.error("Error creating support ticket:", error);
      throw error;
    }
    return data;
  } catch (err) {
    console.error("Exception creating support ticket:", err);
    throw err;
  }
}

export async function createContractor(payload: {
  name: string;
  email: string;
  phone: string;
}) {
  try {
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          role_id: 4, // Contractor
          status: "Invited",
        },
      ])
      .select();

    if (error) {
      console.error("Error creating contractor:", error);
      throw error;
    }
    return data;
  } catch (err) {
    console.error("Exception creating contractor:", err);
    throw err;
  }
}

export async function createAppointment(payload: {
  service_request_id: number;
  contractor_id: number;
  title: string;
  appointment_date: string;
  appointment_time: string;
}) {
  try {
    const { data, error } = await supabase
      .from("appointments")
      .insert([
        {
          service_request_id: payload.service_request_id,
          contractor_id: payload.contractor_id,
          title: payload.title,
          appointment_date: payload.appointment_date,
          appointment_time: payload.appointment_time,
          status: "Scheduled",
        },
      ])
      .select();

    if (error) {
      console.error("Error creating appointment:", error);
      throw error;
    }
    return data;
  } catch (err) {
    console.error("Exception creating appointment:", err);
    throw err;
  }
}

export async function updateAppointmentDateTime(
  id: string,
  payload: {
    appointment_date: string;
    appointment_time: string;
  }
) {
  try {
    const numericId = parseInt(id.replace("A-", ""), 10);
    const { data, error } = await supabase
      .from("appointments")
      .update({
        appointment_date: payload.appointment_date,
        appointment_time: payload.appointment_time,
      })
      .eq("appointment_id", numericId)
      .select();

    if (error) {
      console.error("Error updating appointment date/time:", error);
      throw error;
    }
    return data;
  } catch (err) {
    console.error("Exception updating appointment date/time:", err);
    throw err;
  }
}

export async function createEstimate(payload: {
  service_request_id: number;
  contractor_id: number;
  estimated_cost: number;
}) {
  try {
    const { data, error } = await supabase
      .from("estimates")
      .insert([
        {
          service_request_id: payload.service_request_id,
          contractor_id: payload.contractor_id,
          estimated_cost: payload.estimated_cost,
          status: "Pending",
          submitted_date: new Date().toISOString().split("T")[0],
        },
      ])
      .select();

    if (error) {
      console.error("Error creating estimate:", error);
      throw error;
    }
    return data;
  } catch (err) {
    console.error("Exception creating estimate:", err);
    throw err;
  }
}

export async function getUsers() {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("user_id, name, email")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching users:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("Exception fetching users:", err);
    return [];
  }
}

export async function getServiceAdminDashboard() {
  console.log("🔌 getServiceAdminDashboard executing in queries layer...");
  const todayStr = new Date().toISOString().split("T")[0];

  try {
    const [requestsRes, contractorsRes, activeRequestsRes, appointmentsRes] = await Promise.all([
      supabase.from("service_requests").select("status, created_at"),
      supabase.from("users").select("user_id, name, email, status").eq("role_id", 4).limit(5),
      supabase.from("service_requests").select(`
        service_request_id,
        title,
        priority,
        status,
        created_at,
        properties (
          property_name
        ),
        tenant:users!tenant_id (
          name
        )
      `).order("service_request_id", { ascending: false }).limit(5),
      supabase.from("appointments").select(`
        appointment_id,
        title,
        appointment_date,
        appointment_time,
        status,
        service_requests (
          properties (
            property_name
          )
        ),
        contractor:users!contractor_id (
          name
        )
      `).eq("appointment_date", todayStr)
    ]);

    // Logging Query 1: service_requests (stats)
    console.log("📊 [SQL Query 1] Table: service_requests (for stats metrics)");
    console.log("   - Rows returned:", requestsRes.data ? requestsRes.data.length : 0);
    console.log("   - Error:", requestsRes.error ? JSON.stringify(requestsRes.error) : "None");
    if (requestsRes.error) {
      throw new Error(`[SQL Query 1: service_requests stats] Failed: ${requestsRes.error.message}`);
    }

    // Logging Query 2: users (contractors)
    console.log("📊 [SQL Query 2] Table: users (for contractors list)");
    console.log("   - Rows returned:", contractorsRes.data ? contractorsRes.data.length : 0);
    console.log("   - Error:", contractorsRes.error ? JSON.stringify(contractorsRes.error) : "None");
    if (contractorsRes.error) {
      throw new Error(`[SQL Query 2: users contractors] Failed: ${contractorsRes.error.message}`);
    }

    // Logging Query 3: service_requests (active requests)
    console.log("📊 [SQL Query 3] Table: service_requests (for active requests list)");
    console.log("   - Rows returned:", activeRequestsRes.data ? activeRequestsRes.data.length : 0);
    console.log("   - Error:", activeRequestsRes.error ? JSON.stringify(activeRequestsRes.error) : "None");
    if (activeRequestsRes.error) {
      throw new Error(`[SQL Query 3: service_requests active list] Failed: ${activeRequestsRes.error.message}`);
    }

    // Logging Query 4: appointments
    console.log("📊 [SQL Query 4] Table: appointments (for today's schedule)");
    console.log("   - Rows returned:", appointmentsRes.data ? appointmentsRes.data.length : 0);
    console.log("   - Error:", appointmentsRes.error ? JSON.stringify(appointmentsRes.error) : "None");
    if (appointmentsRes.error) {
      throw new Error(`[SQL Query 4: appointments] Failed: ${appointmentsRes.error.message}`);
    }

    const allRequests = requestsRes.data || [];
    const dbContractors = contractorsRes.data || [];
    const activeRequests = activeRequestsRes.data || [];
    const dbAppointments = appointmentsRes.data || [];

    // Calculate Stat Cards
    const totalRequests = allRequests.length;
    const pending = allRequests.filter(r => r.status === "Pending").length;
    const assigned = allRequests.filter(r => r.status === "Assigned" || r.status === "In Progress").length;
    const completed = allRequests.filter(r => r.status === "Completed").length;

    // Calculate last 7 days chart
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const requestsSeries = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = daysOfWeek[d.getDay()];
      const dateStr = d.toISOString().split("T")[0];
      
      const createdCount = allRequests.filter(r => {
        if (!r.created_at) return false;
        return r.created_at.startsWith(dateStr);
      }).length;

      const completedCount = allRequests.filter(r => {
        if (!r.created_at) return false;
        return r.created_at.startsWith(dateStr) && r.status === "Completed";
      }).length;

      requestsSeries.push({
        day: dayName,
        created: createdCount,
        completed: completedCount
      });
    }

    // Format Top Contractors
    const formattedContractors = dbContractors.map(c => ({
      id: `C-${c.user_id}`,
      name: c.name,
      email: c.email,
      status: c.status,
      trade: "—", // No fake trade
      rating: "—", // No fake rating
      available: c.status === "Active" // Active status maps to availability
    }));

    // Format Active Service Requests
    const formattedActiveRequests = activeRequests.map((r: any) => ({
      id: `SR-${r.service_request_id}`,
      title: r.title,
      priority: r.priority,
      status: r.status,
      property: r.properties?.property_name || "—",
      tenant: r.tenant?.name || "—",
      contractor: null
    }));

    // Format Appointments
    const formattedAppointments = dbAppointments.map((a: any) => ({
      id: `A-${a.appointment_id}`,
      title: a.title,
      date: a.appointment_date,
      time: a.appointment_time ? a.appointment_time.slice(0, 5) : "12:00",
      property: a.service_requests?.properties?.property_name || "—",
      contractor: a.contractor?.name || "—",
      status: a.status
    }));

    const result = {
      stats: {
        total: totalRequests,
        pending,
        assigned,
        completed
      },
      requestsSeries,
      contractors: formattedContractors,
      activeRequests: formattedActiveRequests,
      appointments: formattedAppointments
    };

    console.log("📊 [Final Mapped Object]:", JSON.stringify(result, null, 2));

    return result;
  } catch (err) {
    console.error("Error in getServiceAdminDashboard:", err);
    throw err;
  }
}

export interface PlatformUser {
  id: string;
  userId: number;
  authUserId: string | null;
  name: string;
  email: string;
  role: string;
  status: string;
  joined: string;
}

export async function getPlatformUsers(): Promise<PlatformUser[]> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("user_id, auth_user_id, name, email, role_id, status, created_at")
      .order("user_id", { ascending: false });

    if (error) {
      console.error("Error fetching platform users:", error);
      return [];
    }

    const roleMap: Record<number, string> = {
      1: "super_admin",
      2: "landlord",
      3: "tenant",
      4: "contractor",
      5: "realtor",
      6: "service_admin",
    };

    return (data || []).map((u) => ({
      id: `U-${u.user_id}`,
      userId: u.user_id,
      authUserId: u.auth_user_id ?? null,
      name: u.name,
      email: u.email,
      role: roleMap[u.role_id] || "landlord",
      status: u.status || "Active",
      joined: u.created_at
        ? new Date(u.created_at).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
    }));
  } catch (err) {
    console.error("Exception fetching platform users:", err);
    return [];
  }
}
// ================= SUBSCRIPTIONS =================

export async function getSubscriptionsData() {
  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("Error fetching subscriptions:", error);
      return [];
    }

    return (data || []).map((s: any) => ({
      id: s.id, // Assuming it's already SUB-XXXX or we can map it
      customer: s.customer,
      plan: s.plan,
      seats: s.seats,
      mrr: s.mrr,
      status: s.status,
      renews: s.renews,
    }));
  } catch (err) {
    console.error("Exception fetching subscriptions:", err);
    return [];
  }
}

export async function createSubscriptionData(payload: any) {
  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .insert([payload])
      .select();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error creating subscription:", err);
    throw err;
  }
}

export async function updateSubscriptionData(id: string, payload: any) {
  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .update(payload)
      .eq("id", id)
      .select();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error updating subscription:", err);
    throw err;
  }
}

export async function deleteSubscriptionData(id: string) {
  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .delete()
      .eq("id", id)
      .select();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error deleting subscription:", err);
    throw err;
  }
}
