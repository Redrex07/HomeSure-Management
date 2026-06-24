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

function mapServiceRequestRow(r: {
  service_request_id: number;
  title?: string | null;
  description?: string | null;
  category?: string | null;
  priority?: string | null;
  status?: string | null;
  created_at?: string | null;
  properties?: { property_name?: string | null } | { property_name?: string | null }[] | null;
}) {
  const propertyRecord = Array.isArray(r.properties) ? r.properties[0] : r.properties;

  return {
    id: `SR-${r.service_request_id}`,
    title: r.title || "Untitled Request",
    property: propertyRecord?.property_name || "Unassigned Property",
    tenant: "Unassigned Tenant",
    category: r.category || "General",
    priority: r.priority || "Medium",
    status: r.status || "Pending",
    contractor: null,
    created: r.created_at
      ? new Date(r.created_at).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
  };
}

export async function getServiceRequests() {
  return [
    {
      id: "SR-101",
      title: "Water Leakage",
      property: "Sunrise Apartments",
    },
    {
      id: "SR-102",
      title: "Electrical Fault",
      property: "Green Villa",
    },
    {
      id: "SR-103",
      title: "AC Repair",
      property: "Palm Residency",
    },
    {
      id: "SR-104",
      title: "Plumbing Issue",
      property: "Lake View House",
    },
  ];
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
  return [
    {
      id: "C-1",
      name: "John Electric",
      trade: "Electrical",
      phone: "9876543210",
    },
    {
      id: "C-2",
      name: "Mike Plumbing",
      trade: "Plumbing",
      phone: "9876543211",
    },
    {
      id: "C-3",
      name: "David HVAC",
      trade: "HVAC",
      phone: "9876543212",
    },
    {
      id: "C-4",
      name: "Alex Carpenter",
      trade: "Carpentry",
      phone: "9876543213",
    },
    {
      id: "C-5",
      name: "Robert Painter",
      trade: "Painting",
      phone: "9876543214",
    },
  ];
}

// ================= APPOINTMENTS =================

export async function getAppointments() {
  return [
    {
      id: "A-1",
      title: "Leak Repair",
      date: "2026-06-24",
      time: "10:00",
      property: "Sunrise Apartments",
      contractor: "Mike Plumbing",
      status: "Scheduled",
    },
    {
      id: "A-2",
      title: "Electrical Inspection",
      date: "2026-06-25",
      time: "14:30",
      property: "Green Villa",
      contractor: "John Electric",
      status: "Scheduled",
    },
  ];
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

export async function createAppointment(payload: any) {
  console.log("New Appointment:", payload);

  return {
    success: true,
    id: `A-${Date.now()}`,
  };
}
export async function updateAppointmentDateTime(
  id: string,
  payload: {
    appointment_date: string;
    appointment_time: string;
  }
) {
  console.log("Reschedule:", id, payload);

  return { success: true };
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
