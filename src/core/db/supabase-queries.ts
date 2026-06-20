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


