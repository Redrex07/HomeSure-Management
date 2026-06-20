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
      .eq("landlord_id", landlordId);

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

/**
 * STEP 2: Get all tenants for the landlord's properties
 */
export async function getLandlordTenants(landlordId: string) {
  try {
    const { data, error } = await supabase.from("tenant_onboarding").select("*");

    if (error) {
      console.error(error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Exception fetching tenants:", err);
    return [];
  }
}
/**
 * STEP 3: Get invoices/rent data for the landlord
 */
export async function getLandlordInvoices(landlordId: string) {
  try {
    const { data, error } = await supabase.from("invoices").select("*").eq("landlord_id", landlordId);

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
      .select("user_id, name, phone")
      .eq("role_id", 4);

    if (error) {
      console.error("Error fetching contractors:", error);
      return [];
    }

    return (data || []).map((c: any) => ({
      id: `C-${c.user_id}`,
      name: c.name,
      trade: c.user_id % 3 === 0 ? "HVAC" : c.user_id % 2 === 0 ? "Electrical" : "Plumbing",
      rating: 4.5 + (c.user_id % 5) * 0.1,
      jobs: 15 + (c.user_id % 10) * 8,
      available: c.user_id % 3 !== 0,
      phone: c.phone || "(555) 555-0100",
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
      priority: t.ticket_id % 3 === 0 ? "High" : t.ticket_id % 2 === 0 ? "Low" : "Medium",
      status: t.status || "Open",
      created: t.created_at ? new Date(t.created_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    }));
  } catch (err) {
    console.error("Exception fetching support tickets:", err);
    return [];
  }
}



