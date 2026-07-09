import { supabase } from "./supabase";
import { useSession } from "@/features/auth/store/auth-store";
import {
  contractors as mockContractors,
  realtors as mockRealtors,
  serviceRequests as mockServiceRequests,
  appointments as mockAppointments,
  requestsSeries as mockRequestsSeries,
} from "@/lib/mock-data";

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

    const rentAmount = payload.rent_amount;
    delete payload.rent_amount;
    const amenitiesObj = payload.amenities;
    delete payload.amenities;

    const tenantPreferencesObj = payload.tenant_preferences;
    delete payload.tenant_preferences;
    
    let rentDetailsObj: any = null;
    if (payload.specifications) {
      try {
        const specs = JSON.parse(payload.specifications);
        if (specs.rent_details) {
          rentDetailsObj = { ...specs.rent_details };
        }
      } catch (e) {}
    }


    const { data, error } = await supabase
      .from("properties")
      .insert([payload])
      .select();

    if (error) throw error;

    
    if (data && data.length > 0) {
      const propertyId = data[0].property_id;
      
      const parseNumeric = (val: any) => {
        if (!val) return null;
        const num = Number(String(val).replace(/[^0-9.-]/g, ''));
        return isNaN(num) ? null : num;
      };

      const rentPayload = {
        property_id: propertyId,
        monthly_rent: parseNumeric(rentAmount),
        security_deposit: rentDetailsObj ? parseNumeric(rentDetailsObj.security_deposit) : null,
        maintenance_charges: rentDetailsObj ? parseNumeric(rentDetailsObj.maintenance_charges) : null,
        electricity_charges: rentDetailsObj ? parseNumeric(rentDetailsObj.electricity_charges) : null,
        water_charges: rentDetailsObj ? parseNumeric(rentDetailsObj.water_charges) : null,
        parking_charges: rentDetailsObj ? parseNumeric(rentDetailsObj.parking_charges) : null,
        lease_duration: rentDetailsObj?.lease_duration || null,
        available_from: (rentDetailsObj?.available_from && rentDetailsObj.available_from !== "") ? rentDetailsObj.available_from : null
      };

      const { error: rentError } = await supabase
        .from("property_rent_details")
        .insert([rentPayload]);

      if (rentError) {
        console.error("Error creating rent details:", rentError);
      }

      if (amenitiesObj) {
        const amenitiesPayload = {
          property_id: propertyId,
          wifi: amenitiesObj.wifi,
          power_backup: amenitiesObj.power_backup,
          parking: amenitiesObj.parking,
          lift: amenitiesObj.lift,
          gym: amenitiesObj.gym,
          swimming_pool: amenitiesObj.swimming_pool,
          cctv: amenitiesObj.cctv,
          security: amenitiesObj.security,
          garden: amenitiesObj.garden,
          childrens_play_area: amenitiesObj.childrens_play_area,
          furnished: amenitiesObj.furnished,
          semi_furnished: amenitiesObj.semi_furnished,
          air_conditioning: amenitiesObj.air_conditioning
        };
        const { error: amError } = await supabase.from("property_amenities").insert([amenitiesPayload]);
        if (amError) console.error("Error creating amenities:", amError);
      }

      // Add Tenant Preferences
      if (tenantPreferencesObj) {
        const tenantPrefPayload = {
          property_id: propertyId,
          preferred_tenant_type: tenantPreferencesObj.preferred_tenant_type,
          bachelors_allowed: tenantPreferencesObj.bachelors_allowed,
          family_allowed: tenantPreferencesObj.family_allowed,
          students_allowed: tenantPreferencesObj.students_allowed,
          pets_allowed: tenantPreferencesObj.pets_allowed,
          smoking_allowed: tenantPreferencesObj.smoking_allowed,
          drinking_allowed: tenantPreferencesObj.drinking_allowed
          // maximum_occupants column does not exist in schema
          // maximum_occupants: tenantPreferencesObj.maximum_occupants ? Number(tenantPreferencesObj.maximum_occupants) : null
        };
        const { error: tpError } = await supabase.from("tenant_preferences").insert([tenantPrefPayload]);
        if (tpError) console.error("Error creating tenant preferences:", tpError);
      }
    }

    return data;
  } catch (err) {
    console.error("Error creating property:", err);
    throw err;
  }
}

export async function updateProperty(id: number, payload: any) {
  try {

    const rentAmount = payload.rent_amount;
    delete payload.rent_amount;
    const amenitiesObj = payload.amenities;
    delete payload.amenities;

    const tenantPreferencesObj = payload.tenant_preferences;
    delete payload.tenant_preferences;

    let rentDetailsObj: any = null;
    if (payload.specifications) {
      try {
        const specs = JSON.parse(payload.specifications);
        if (specs.rent_details) {
          rentDetailsObj = { ...specs.rent_details };
        }
      } catch (e) {}
    }


    const { data, error } = await supabase
      .from("properties")
      .update(payload)
      .eq("property_id", id)
      .select();

    if (error) throw error;
    
    const parseNumeric = (val: any) => {
      if (!val) return null;
      const num = Number(String(val).replace(/[^0-9.-]/g, ''));
      return isNaN(num) ? null : num;
    };

    const rentPayload = {
      property_id: id,
      monthly_rent: parseNumeric(rentAmount),
      security_deposit: rentDetailsObj ? parseNumeric(rentDetailsObj.security_deposit) : null,
      maintenance_charges: rentDetailsObj ? parseNumeric(rentDetailsObj.maintenance_charges) : null,
      electricity_charges: rentDetailsObj ? parseNumeric(rentDetailsObj.electricity_charges) : null,
      water_charges: rentDetailsObj ? parseNumeric(rentDetailsObj.water_charges) : null,
      parking_charges: rentDetailsObj ? parseNumeric(rentDetailsObj.parking_charges) : null,
      lease_duration: rentDetailsObj?.lease_duration || null,
      available_from: (rentDetailsObj?.available_from && rentDetailsObj.available_from !== "") ? rentDetailsObj.available_from : null
    };

    const { data: existingRent } = await supabase
      .from("property_rent_details")
      .select("rent_detail_id")
      .eq("property_id", id)
      .maybeSingle();

    if (existingRent) {
      await supabase.from("property_rent_details").update(rentPayload).eq("property_id", id);
    } else {
      await supabase.from("property_rent_details").insert([rentPayload]);
    }

    if (amenitiesObj) {
      const amenitiesPayload = {
        property_id: id,
        wifi: amenitiesObj.wifi,
        power_backup: amenitiesObj.power_backup,
        parking: amenitiesObj.parking,
        lift: amenitiesObj.lift,
        gym: amenitiesObj.gym,
        swimming_pool: amenitiesObj.swimming_pool,
        cctv: amenitiesObj.cctv,
        security: amenitiesObj.security,
        garden: amenitiesObj.garden,
        childrens_play_area: amenitiesObj.childrens_play_area,
        furnished: amenitiesObj.furnished,
        semi_furnished: amenitiesObj.semi_furnished,
        air_conditioning: amenitiesObj.air_conditioning
      };
      
      const { data: existingAm } = await supabase
        .from("property_amenities")
        .select("amenity_id")
        .eq("property_id", id)
        .maybeSingle();

      if (existingAm) {
        await supabase.from("property_amenities").update(amenitiesPayload).eq("property_id", id);
      } else {
        await supabase.from("property_amenities").insert([amenitiesPayload]);
      }
    }

    // Handle Tenant Preferences
    if (tenantPreferencesObj) {
      const tenantPrefPayload = {
        property_id: id,
        preferred_tenant_type: tenantPreferencesObj.preferred_tenant_type,
        bachelors_allowed: tenantPreferencesObj.bachelors_allowed,
        family_allowed: tenantPreferencesObj.family_allowed,
        students_allowed: tenantPreferencesObj.students_allowed,
        pets_allowed: tenantPreferencesObj.pets_allowed,
        smoking_allowed: tenantPreferencesObj.smoking_allowed,
        drinking_allowed: tenantPreferencesObj.drinking_allowed
        // maximum_occupants column does not exist in schema
        // maximum_occupants: tenantPreferencesObj.maximum_occupants ? Number(tenantPreferencesObj.maximum_occupants) : null
      };

      const { data: existingPref } = await supabase
        .from("tenant_preferences")
        .select("preference_id")
        .eq("property_id", id)
        .maybeSingle();

      if (existingPref) {
        const { error: upError } = await supabase.from("tenant_preferences").update(tenantPrefPayload).eq("property_id", id);
        if (upError) throw upError;
      } else {
        const { error: insError } = await supabase.from("tenant_preferences").insert([tenantPrefPayload]);
        if (insError) throw insError;
      }
    }
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


export async function getPropertyById(id: string) {
  try {
    const { data, error } = await supabase
      .from("properties")
      .select("*, property_rent_details(*), property_amenities(*), tenant_preferences(*)")
      .eq("property_id", id)
      .single();

    if (error) {
      console.error("Error fetching property:", error);
      return null;
    }
    
    if (data) {
      data.rent_amount = data.property_rent_details?.[0]?.monthly_rent || data.property_rent_details?.monthly_rent || "";
      data.rentDetailsData = data.property_rent_details?.[0] || data.property_rent_details || null;
      delete data.property_rent_details;
      
      data.amenitiesData = data.property_amenities?.[0] || data.property_amenities || null;
      delete data.property_amenities;
      
      data.tenantPreferencesData = data.tenant_preferences?.[0] || data.tenant_preferences || null;
      // We don't delete data.tenant_preferences since it might be useful or not, but we can delete it for consistency
      delete data.tenant_preferences;
    }
    return data;
  } catch (err) {
    console.error("Exception fetching property:", err);
    return null;
  }
}


/**
 * STEP 2: Get all tenants for the landlord's properties
 */
export async function getLandlordTenants(landlordId: string) {
  try {
    // Ideally this filters by properties owned by landlordId, but for now we fetch all
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
      // .eq("landlord_id", landlordId) // Uncomment if landlord_id exists on invoices
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
  try {
    const { data, error } = await supabase
      .from("service_requests")
      .select(`
        *,
        properties (
          property_name
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return [];
    }

    return (data || []).map(mapServiceRequestRow);
  } catch (err) {
    console.error(err);
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

function normalizeContractor(contractor: (typeof mockContractors)[number]) {
  return {
    ...contractor,
    name: contractor.contractorName,
  };
}

function normalizeRealtor(realtor: (typeof mockRealtors)[number]) {
  return {
    ...realtor,
    name: realtor.realtorName,
  };
}

function nextContractorId() {
  return `C-${301 + mockContractors.length}`;
}

function nextRealtorId() {
  return `R-${401 + mockRealtors.length}`;
}

export async function getContractors() {
  return mockContractors.map(normalizeContractor);
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
  companyName?: string;
  trade?: string;
  specialization?: string;
  available?: boolean;
}) {
  try {
    const contractor = {
      id: nextContractorId(),
      contractorId: nextContractorId(),
      contractorName: payload.name,
      companyName: payload.companyName || payload.name,
      trade: payload.trade || "General",
      specialization: payload.specialization || payload.trade || "General",
      rating: 0,
      jobs: 0,
      available: payload.available ?? true,
      availabilityStatus: payload.available ?? true ? "Available" : "Busy",
      email: payload.email,
      phone: payload.phone,
    };

    mockContractors.unshift(contractor);
    return normalizeContractor(contractor);
  } catch (err) {
    console.error("Exception creating contractor:", err);
    throw err;
  }
}

// ================= REALTORS =================

export async function getRealtors() {
  return mockRealtors.map(normalizeRealtor);
}

export async function createRealtor(payload: {
  name: string;
  email: string;
  phone: string;
  agencyName?: string;
}) {
  try {
    const realtor = {
      id: nextRealtorId(),
      realtorId: nextRealtorId(),
      realtorName: payload.name,
      agencyName: payload.agencyName || payload.name,
      email: payload.email,
      phone: payload.phone,
    };

    mockRealtors.unshift(realtor);
    return normalizeRealtor(realtor);
  } catch (err) {
    console.error("Exception creating realtor:", err);
    throw err;
  }
}

function normalizeAiListingKeywords(keywords: unknown) {
  if (Array.isArray(keywords)) {
    return keywords.filter(Boolean).map((keyword) => String(keyword).trim()).filter(Boolean);
  }

  if (typeof keywords === "string") {
    return keywords
      .split(",")
      .map((keyword) => keyword.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeAiListing(row: {
  id?: number | string;
  ai_listing_id?: number;
  listing_id?: number;
  property_id?: number;
  propertyId?: number;
  realtor_id?: number | null;
  realtorId?: number | null;
  name?: string | null;
  price?: number | string | null;
  status?: string | null;
  listing_type?: string | null;
  listingType?: string | null;
  listing_status?: string | null;
  listingStatus?: string | null;
  listing_date?: string | null;
  listingDate?: string | null;
  title?: string | null;
  description?: string | null;
  keywords?: unknown;
  landlord_id?: number | null;
  description_text?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}) {
  const listingId = row.id ?? row.ai_listing_id ?? row.listing_id ?? row.property_id ?? row.propertyId ?? Date.now();
  const title = row.title || row.name || "Untitled Listing";
  const listingType = row.listing_type || row.listingType || "Draft";
  const listingStatus = row.listing_status || row.listingStatus || row.status || "Draft";
  const price = Number(row.price || 0);
  const description =
    row.description ||
    row.description_text ||
    `${title} is a ${listingType.toLowerCase()} listing with ${listingStatus.toLowerCase()} status and pricing of ${price > 0 ? `₹${price.toLocaleString()}` : "competitive pricing"}.`;

  return {
    id: String(listingId).startsWith("L-") || String(listingId).startsWith("AI-") ? String(listingId) : `L-${listingId}`,
    propertyId: `P-${row.property_id ?? row.propertyId ?? listingId}`,
    title,
    description,
    keywords: normalizeAiListingKeywords(
      row.keywords || [listingType, listingStatus, row.status || "Listed"]
    ),
    price,
    landlordId: row.landlord_id ?? row.realtor_id ?? row.realtorId ?? null,
    createdAt: row.listing_date || row.listingDate || row.created_at || row.updated_at || new Date().toISOString(),
  };
}

export async function getAiListings(landlordId?: string) {
  try {
    let query = supabase.from("listings").select("*").order("listing_date", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching AI listings:", error);
      return [];
    }

    const normalizedListings = (data || []).map(normalizeAiListing);

    if (!landlordId) {
      return normalizedListings;
    }

    return normalizedListings.filter((listing) => {
      const listingLandlordId = String(listing.landlordId ?? "");
      return listingLandlordId === String(landlordId) || listing.id.startsWith("L-");
    });
  } catch (err) {
    console.error("Exception fetching AI listings:", err);
    return [];
  }
}

export async function createAiListing(payload: {
  propertyId: number;
  title: string;
  description: string;
  keywords: string[];
  price?: number;
  landlordId?: string | number;
}) {
  try {
    const normalizedLandlordId = payload.landlordId ? Number(payload.landlordId) : 2;
    const today = new Date().toISOString().split("T")[0];

    const preferredPayload = {
      property_id: payload.propertyId,
      realtor_id: normalizedLandlordId,
      title: payload.title,
      status: "Draft",
      listing_type: "AI",
      listing_status: "Draft",
      listing_date: today,
    };

    const fallbackPayload = {
      property_id: payload.propertyId,
      realtor_id: normalizedLandlordId,
      title: payload.title,
      status: "Draft",
      listing_type: "AI",
      listing_status: "Draft",
      listing_date: today,
    };

    let result = await supabase.from("listings").insert([preferredPayload]).select();

    if (result.error) {
      result = await supabase.from("listings").insert([fallbackPayload]).select();
    }

    if (result.error) {
      console.error("Error creating AI listing:", result.error);
      throw result.error;
    }

    return (result.data || []).map(normalizeAiListing);
  } catch (err) {
    console.error("Exception creating AI listing:", err);
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

export async function getServiceAdminDashboard() {
  const activeRequests = mockServiceRequests.filter((request) => request.status !== "Completed");
  const completedRequests = mockServiceRequests.filter((request) => request.status === "Completed");
  const pendingRequests = mockServiceRequests.filter((request) => request.status === "Pending");
  const assignedRequests = mockServiceRequests.filter(
    (request) => request.status === "Assigned" || request.status === "In Progress"
  );

  return {
    stats: {
      total: mockServiceRequests.length,
      pending: pendingRequests.length,
      assigned: assignedRequests.length,
      completed: completedRequests.length,
    },
    requestsSeries: mockRequestsSeries,
    contractors: mockContractors.map((contractor) => ({
      id: contractor.id,
      name: contractor.contractorName,
      trade: contractor.trade,
      rating: contractor.rating,
      available: contractor.available,
    })),
    activeRequests: activeRequests.slice(0, 5).map((request) => ({
      id: request.id,
      title: request.title,
      priority: request.priority,
      status: request.status,
      property: request.property,
      contractor: request.contractor,
    })),
    appointments: mockAppointments.slice(0, 5).map((appointment) => ({
      id: appointment.id,
      title: appointment.title,
      date: appointment.date,
      time: appointment.time,
      property: appointment.property,
      contractor: appointment.contractor,
      status: appointment.status,
    })),
  };
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
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return [];
    }

    return (data || []).map((s: any) => ({
      id: s.subscription_id || s.id,
      customer: s.customer,
      plan: s.plan,
      seats: Number(s.seats),
      mrr: Number(s.mrr),
      status: s.status,
      renews: s.renews,
    }));
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function createSubscriptionData(payload: any) {
  const { data, error } = await supabase
    .from("subscriptions")
    .insert([payload])
    .select();

  if (error) throw error;

  return data;
}

export async function updateSubscriptionData(
  id: string,
  payload: any
) {
  const { data, error } = await supabase
    .from("subscriptions")
    .update(payload)
    .eq("subscription_id", id)
    .select();

  if (error) throw error;

  return data;
}
