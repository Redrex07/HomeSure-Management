import { supabase } from "./supabase";
import {
  contractors as mockContractors,
  realtors as mockRealtors,
  serviceRequests as mockServiceRequests,
  appointments as mockAppointments,
  requestsSeries as mockRequestsSeries,
} from "@/lib/mock-data";

const DEFAULT_TENANT_ID = 3;
const DEFAULT_PROPERTY_ID = 1;

function todayIsoDate() {
  return new Date().toISOString().split("T")[0];
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parsePrefixedId(value: string | number | undefined | null, prefix: string) {
  if (value == null) return 0;
  return toNumber(String(value).replace(prefix, ""), 0);
}

function isSupabaseSchemaError(error: any) {
  const message = String(error?.message || error?.details || "");
  return (
    error?.code === "42P01" ||
    error?.code === "42703" ||
    /relation .* does not exist/i.test(message) ||
    /column .* does not exist/i.test(message) ||
    /could not find .* in the schema cache/i.test(message)
  );
}

function normalizePaymentStatus(status?: string | null) {
  if (!status) return "Pending";
  if (status === "Successful") return "Paid";
  if (status === "Failed") return "Failed";
  if (status === "Refunded") return "Refunded";
  return status;
}

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

    const { data, error } = await supabase.from("properties").select("*, property_rent_details(*), property_amenities(*), tenant_preferences(*), property_utilities(*)");

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
      .select("*, property_rent_details(*), property_amenities(*), tenant_preferences(*), property_utilities(*)")
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

    const utilitiesObj = payload.property_utilities;
    delete payload.property_utilities;

    let rentDetailsObj: any = null;
    if (payload.specifications) {
      try {
        const specs = JSON.parse(payload.specifications);
        if (specs.rent_details) {
          rentDetailsObj = { ...specs.rent_details };
        }
      } catch (e) {}
    }

    const { data, error } = await supabase.from("properties").insert([payload]).select();

    if (error) throw error;

    if (data && data.length > 0) {
      const propertyId = data[0].property_id;

      const parseNumeric = (val: any) => {
        if (!val) return null;
        const num = Number(String(val).replace(/[^0-9.-]/g, ""));
        return isNaN(num) ? null : num;
      };

      const rentPayload = {
        property_id: propertyId,
        monthly_rent: parseNumeric(rentAmount),
        security_deposit: rentDetailsObj ? parseNumeric(rentDetailsObj.security_deposit) : null,
        maintenance_charges: rentDetailsObj
          ? parseNumeric(rentDetailsObj.maintenance_charges)
          : null,
        electricity_charges: rentDetailsObj
          ? parseNumeric(rentDetailsObj.electricity_charges)
          : null,
        water_charges: rentDetailsObj ? parseNumeric(rentDetailsObj.water_charges) : null,
        parking_charges: rentDetailsObj ? parseNumeric(rentDetailsObj.parking_charges) : null,
        lease_duration: rentDetailsObj?.lease_duration || null,
        available_from:
          rentDetailsObj?.available_from && rentDetailsObj.available_from !== ""
            ? rentDetailsObj.available_from
            : null,
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
          air_conditioning: amenitiesObj.air_conditioning,
        };
        const { error: amError } = await supabase
          .from("property_amenities")
          .insert([amenitiesPayload]);
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
          drinking_allowed: tenantPreferencesObj.drinking_allowed,
          // maximum_occupants column does not exist in schema
          // maximum_occupants: tenantPreferencesObj.maximum_occupants ? Number(tenantPreferencesObj.maximum_occupants) : null
        };
        const { error: tpError } = await supabase
          .from("tenant_preferences")
          .insert([tenantPrefPayload]);
        if (tpError) console.error("Error creating tenant preferences:", tpError);
      }

      // Add Property Utilities
      if (utilitiesObj) {
        const utilitiesPayload = {
          property_id: propertyId,
          water_supply: utilitiesObj.water_supply,
          electricity_connection: utilitiesObj.electricity_connection,
          internet_available: utilitiesObj.internet_available,
          gas_connection: utilitiesObj.gas_connection,
          sewage_connection: utilitiesObj.sewage_connection,
        };
        const { error: utilsError } = await supabase
          .from("property_utilities")
          .insert([utilitiesPayload]);
        if (utilsError) console.error("Error creating property utilities:", utilsError);
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

    const utilitiesObj = payload.property_utilities;
    delete payload.property_utilities;

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
      const num = Number(String(val).replace(/[^0-9.-]/g, ""));
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
      available_from:
        rentDetailsObj?.available_from && rentDetailsObj.available_from !== ""
          ? rentDetailsObj.available_from
          : null,
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
        air_conditioning: amenitiesObj.air_conditioning,
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
        drinking_allowed: tenantPreferencesObj.drinking_allowed,
        // maximum_occupants column does not exist in schema
        // maximum_occupants: tenantPreferencesObj.maximum_occupants ? Number(tenantPreferencesObj.maximum_occupants) : null
      };

      const { data: existingPref } = await supabase
        .from("tenant_preferences")
        .select("preference_id")
        .eq("property_id", id)
        .maybeSingle();

      if (existingPref) {
        const { error: upError } = await supabase
          .from("tenant_preferences")
          .update(tenantPrefPayload)
          .eq("property_id", id);
        if (upError) throw upError;
      } else {
        const { error: insError } = await supabase
          .from("tenant_preferences")
          .insert([tenantPrefPayload]);
        if (insError) throw insError;
      }
    }

    // Handle Property Utilities
    if (utilitiesObj) {
      const utilitiesPayload = {
        property_id: id,
        water_supply: utilitiesObj.water_supply,
        electricity_connection: utilitiesObj.electricity_connection,
        internet_available: utilitiesObj.internet_available,
        gas_connection: utilitiesObj.gas_connection,
        sewage_connection: utilitiesObj.sewage_connection,
      };

      const { data: existingUtil } = await supabase
        .from("property_utilities")
        .select("utility_id")
        .eq("property_id", id)
        .maybeSingle();

      if (existingUtil) {
        const { error: upError } = await supabase
          .from("property_utilities")
          .update(utilitiesPayload)
          .eq("property_id", id);
        if (upError) console.error("Error updating utilities:", upError);
      } else {
        const { error: insError } = await supabase
          .from("property_utilities")
          .insert([utilitiesPayload]);
        if (insError) console.error("Error inserting utilities:", insError);
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
      .select("*, property_rent_details(*), property_amenities(*), tenant_preferences(*), property_utilities(*)")
      .eq("property_id", id)
      .single();

    if (error) {
      console.error("Error fetching property:", error);
      return null;
    }

    if (data) {
      data.rent_amount =
        data.property_rent_details?.[0]?.monthly_rent ||
        data.property_rent_details?.monthly_rent ||
        "";
      data.rentDetailsData = data.property_rent_details?.[0] || data.property_rent_details || null;
      delete data.property_rent_details;

      data.amenitiesData = data.property_amenities?.[0] || data.property_amenities || null;
      delete data.property_amenities;

      data.tenantPreferencesData = data.tenant_preferences?.[0] || data.tenant_preferences || null;
      // We don't delete data.tenant_preferences since it might be useful or not, but we can delete it for consistency
      delete data.tenant_preferences;

      data.utilitiesData = data.property_utilities?.[0] || data.property_utilities || null;
      delete data.property_utilities;
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
    const { data, error } = await supabase.from("tenant_onboarding").insert([payload]).select();

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
    const { data, error } = await supabase.from("invoices").insert([payload]).select();

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

function mapLegacyServiceRequestRow(r: {
  service_request_id: number;
  title?: string | null;
  description?: string | null;
  category?: string | null;
  priority?: string | null;
  status?: string | null;
  created_at?: string | null;
  property_id?: number | null;
  tenant_id?: number | null;
  properties?: { property_name?: string | null } | { property_name?: string | null }[] | null;
}) {
  const propertyRecord = Array.isArray(r.properties) ? r.properties[0] : r.properties;

  return {
    id: `SR-${r.service_request_id}`,
    requestId: r.service_request_id,
    source: "service_requests",
    propertyId: r.property_id ?? null,
    tenantId: r.tenant_id ?? null,
    title: r.title || "Untitled Request",
    description: r.description || "",
    property:
      propertyRecord?.property_name ||
      (r.property_id ? `Property #${r.property_id}` : "Unassigned Property"),
    tenant: r.tenant_id ? `Tenant #${r.tenant_id}` : "Unassigned Tenant",
    category: r.category || "General",
    priority: r.priority || "Medium",
    status: r.status || "Pending",
    contractor: null,
    created: r.created_at ? new Date(r.created_at).toISOString().split("T")[0] : todayIsoDate(),
  };
}

function mapMaintenanceRequestRow(r: any) {
  return {
    id: `MR-${r.request_id}`,
    requestId: r.request_id,
    source: "maintenance_request",
    propertyId: r.property_id ?? null,
    tenantId: r.tenant_id ?? null,
    title:
      String(r.issue_description || "").split("\n")[0] || r.issue_category || "Maintenance request",
    description: r.issue_description || "",
    property: r.property_id ? `Property #${r.property_id}` : "Unassigned Property",
    tenant: r.tenant_id ? `Tenant #${r.tenant_id}` : "Unassigned Tenant",
    category: r.issue_category || "General",
    priority: r.priority || "Medium",
    status: r.request_status || "Pending",
    contractor: r.assigned_to || null,
    created: r.request_date || todayIsoDate(),
    resolutionNotes: r.resolution_notes || "",
  };
}

export async function getServiceRequests(filters?: { tenantId?: number; legacyTenantId?: number }) {
  try {
    let maintenanceQuery = supabase
      .from("maintenance_request")
      .select("*")
      .order("request_date", { ascending: false });
    if (filters?.tenantId) maintenanceQuery = maintenanceQuery.eq("tenant_id", filters.tenantId);
    const tenantTable = await maintenanceQuery;

    if (tenantTable.error && !isSupabaseSchemaError(tenantTable.error)) {
      console.error("Error fetching maintenance requests:", tenantTable.error);
    }

    let legacyQuery = supabase
      .from("service_requests")
      .select(
        `
        *,
        properties (
          property_name
        )
      `,
      )
      .order("created_at", { ascending: false });
    if (filters?.legacyTenantId || filters?.tenantId) {
      legacyQuery = legacyQuery.eq("tenant_id", filters.legacyTenantId || filters.tenantId);
    }
    const { data, error } = await legacyQuery;

    if (error && !isSupabaseSchemaError(error)) {
      console.error(error);
    }

    const maintenanceRows = tenantTable.error
      ? []
      : (tenantTable.data || []).map(mapMaintenanceRequestRow);
    const legacyRows = error ? [] : (data || []).map(mapLegacyServiceRequestRow);

    return [...maintenanceRows, ...legacyRows].sort((a, b) => {
      const aDate = a.created || "";
      const bDate = b.created || "";
      return bDate.localeCompare(aDate);
    });
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
    const legacyPayload = {
      title: payload.title,
      category: payload.category,
      priority: payload.priority,
      description: payload.description,
      status: "Pending",
      property_id: payload.property_id || DEFAULT_PROPERTY_ID,
      tenant_id: payload.tenant_id || DEFAULT_TENANT_ID,
      created_by: payload.created_by || payload.tenant_id || DEFAULT_TENANT_ID,
    };

    const legacyResult = await supabase.from("service_requests").insert([legacyPayload]).select();

    if (!legacyResult.error) {
      return (legacyResult.data || []).map(mapLegacyServiceRequestRow);
    }

    if (!isSupabaseSchemaError(legacyResult.error)) {
      console.error("Error creating service request:", legacyResult.error);
    }

    const tenantTablePayload = {
      tenant_id: payload.tenant_id || DEFAULT_TENANT_ID,
      property_id: payload.property_id || DEFAULT_PROPERTY_ID,
      issue_category: payload.category || payload.title || "General",
      issue_description: [payload.title, payload.description].filter(Boolean).join("\n\n"),
      priority: payload.priority || "Medium",
      request_date: todayIsoDate(),
      assigned_to: null,
      request_status: "Pending",
    };

    const tenantTableResult = await supabase
      .from("maintenance_request")
      .insert([tenantTablePayload])
      .select();

    if (tenantTableResult.error) {
      console.error("Error creating maintenance request:", tenantTableResult.error);
      throw tenantTableResult.error;
    }

    return (tenantTableResult.data || []).map(mapMaintenanceRequestRow);
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
  },
) {
  try {
    const numericId = parseInt(id.replace("SR-", ""), 10);
    const tenantTablePayload: Record<string, string> = {};
    if (payload.category) tenantTablePayload.issue_category = payload.category;
    if (payload.description) tenantTablePayload.issue_description = payload.description;
    if (payload.priority) tenantTablePayload.priority = payload.priority;
    if (payload.status) tenantTablePayload.request_status = payload.status;

    if (Object.keys(tenantTablePayload).length > 0) {
      const tenantTableResult = await supabase
        .from("maintenance_request")
        .update(tenantTablePayload)
        .eq("request_id", numericId)
        .select();

      if (!tenantTableResult.error) {
        return tenantTableResult.data;
      }

      if (!isSupabaseSchemaError(tenantTableResult.error)) {
        console.error("Error updating maintenance request:", tenantTableResult.error);
      }
    }

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
    const tenantTableResult = await supabase
      .from("maintenance_request")
      .delete()
      .eq("request_id", numericId)
      .select();

    if (!tenantTableResult.error) {
      return tenantTableResult.data;
    }

    if (!isSupabaseSchemaError(tenantTableResult.error)) {
      console.error("Error deleting maintenance request:", tenantTableResult.error);
    }

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
  const { data, error } = await supabase.from("contractors").select("*");

  if (error) throw error;

  return (data || []).map((c: any) => ({
    id: c.contractor_id,
    name: c.name,
    companyName: c.company_name,
    trade: c.trade,
    specialization: c.specialization,
    email: c.email,
    phone: c.phone,
    available: c.available,
    rating: c.rating,
    jobs: c.jobs_completed,
  }));
}
// ================= APPOINTMENTS =================

export async function getAppointments() {
  const tenantTable = await supabase
    .from("visit_schedule")
    .select("*")
    .order("visit_date", { ascending: false });

  if (tenantTable.error && !isSupabaseSchemaError(tenantTable.error)) {
    console.error("Error fetching visit schedule:", tenantTable.error);
  }

  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .order("appointment_date", { ascending: false });

  if (error) throw error;

  const serviceRequestIds = [
    ...new Set((data || []).map((a) => a.service_request_id).filter(Boolean)),
  ];
  const requestMap = new Map<number, { tenant_id?: number | null; property_id?: number | null }>();

  if (serviceRequestIds.length > 0) {
    const { data: linkedRequests } = await supabase
      .from("service_requests")
      .select("service_request_id, tenant_id, property_id")
      .in("service_request_id", serviceRequestIds);

    for (const request of linkedRequests || []) {
      requestMap.set(request.service_request_id, request);
    }
  }

  const visitScheduleRows = tenantTable.error
    ? []
    : (tenantTable.data || []).map((a: any) => ({
        id: `VS-${a.visit_id}`,
        visitId: a.visit_id,
        tenantId: a.tenant_id ?? null,
        propertyId: a.property_id ?? null,
        landlordId: a.landlord_id ?? null,
        title: a.remarks || "Property visit",
        date: a.visit_date,
        time: a.visit_time,
        property: a.property_id ? `Property #${a.property_id}` : "Unassigned Property",
        contractor: a.landlord_id ? `Landlord #${a.landlord_id}` : "",
        status: a.visit_status || "Pending",
        source: "visit_schedule",
      }));

  const appointmentRows = (data || []).map((a: any) => ({
    id: `A-${a.appointment_id}`,
    appointmentId: a.appointment_id,
    serviceRequestId: a.service_request_id ?? null,
    tenantId: requestMap.get(a.service_request_id)?.tenant_id ?? null,
    propertyId: requestMap.get(a.service_request_id)?.property_id ?? null,
    title: a.title,
    date: a.appointment_date,
    time: a.appointment_time,
    property: requestMap.get(a.service_request_id)?.property_id
      ? `Property #${requestMap.get(a.service_request_id)?.property_id}`
      : "",
    contractor: a.contractor_id ? `Contractor #${a.contractor_id}` : "",
    status: a.status,
    source: "appointments",
  }));

  return [...visitScheduleRows, ...appointmentRows].sort((a, b) => {
    const aDate = `${a.date || ""} ${a.time || ""}`;
    const bDate = `${b.date || ""} ${b.time || ""}`;
    return bDate.localeCompare(aDate);
  });
}

// ================= ESTIMATES =================

export async function getEstimates() {
  try {
    const { data, error } = await supabase
      .from("estimates")
      .select(
        `
        estimate_id,
        service_request_id,
        estimated_cost,
        status,
        submitted_date,
        users!contractor_id (
  name
)
        )
      `,
      )
      .order("submitted_date", { ascending: false });

    if (error) {
      console.error("Error fetching estimates:", error);
      return [];
    }

    return (data || []).map((e: any) => ({
      id: `E-${e.estimate_id}`,
      request: `SR-${e.service_request_id}`,
      contractor: e.users?.name || "Unknown Contractor",
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

function mapRentPaymentRow(payment: any) {
  const id = payment.payment_id ?? payment.rent_payment_id ?? payment.id;
  const amount = Number(
    payment.payment_amount ??
      payment.amount ??
      payment.rent_amount ??
      payment.monthly_rent ??
      payment.total_amount ??
      0,
  );
  const paymentDate = payment.payment_date || payment.created_at || todayIsoDate();
  const status = normalizePaymentStatus(payment.payment_status);

  return {
    id: id ? `RP-${id}` : `RP-${payment.payment_reference || Date.now()}`,
    rawId: id ?? null,
    source: "rent_payments",
    request: payment.property_id ? `Property #${payment.property_id}` : "Monthly Rent",
    propertyId: payment.property_id ?? null,
    tenantId: payment.tenant_id ?? null,
    amount,
    status,
    paymentStatus: payment.payment_status || "Pending",
    issued: paymentDate,
    due: paymentDate,
    paymentMethod: payment.payment_method || "",
    paymentReference: payment.payment_reference || "",
    receiptUrl: payment.receipt_url || "",
    reason: "",
  };
}

function mapInvoiceRow(i: any) {
  return {
    id: `INV-${i.invoice_id}`,
    rawId: i.invoice_id,
    source: "invoices",
    request: i.service_request_id ? `SR-${i.service_request_id}` : "General Billing",
    amount: Number(i.invoice_amount || 0),
    status: i.payment_status || "Pending",
    issued: i.invoice_date || todayIsoDate(),
    due: i.invoice_date
      ? new Date(new Date(i.invoice_date).getTime() + 14 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0]
      : todayIsoDate(),
    reason: "",
  };
}

async function updateRentPaymentById(
  rawId: string | number | null | undefined,
  payload: Record<string, unknown>,
) {
  if (rawId == null || rawId === "") {
    throw new Error("Missing rent payment id.");
  }

  let lastError: any = null;
  for (const idColumn of ["payment_id", "rent_payment_id", "id"]) {
    const result = await supabase
      .from("rent_payments")
      .update(payload)
      .eq(idColumn, rawId)
      .select();

    if (!result.error) {
      return result.data;
    }

    lastError = result.error;
    if (!isSupabaseSchemaError(result.error)) {
      break;
    }
  }

  throw lastError;
}

export async function getRentPayments() {
  try {
    const { data, error } = await supabase
      .from("rent_payments")
      .select("*")
      .order("payment_date", { ascending: false });

    if (error) {
      if (!isSupabaseSchemaError(error)) {
        console.error("Error fetching rent payments:", error);
      }
      return [];
    }

    return (data || []).map(mapRentPaymentRow);
  } catch (err) {
    console.error("Exception fetching rent payments:", err);
    return [];
  }
}

export async function getInvoices() {
  try {
    const rentPayments = await getRentPayments();
    if (rentPayments.length > 0) {
      return rentPayments;
    }

    const { data, error } = await supabase
      .from("invoices")
      .select(
        `
        invoice_id,
        service_request_id,
        invoice_amount,
        invoice_date,
        payment_status
      `,
      )
      .order("invoice_id", { ascending: false });

    if (error) {
      console.error("Error fetching invoices:", error);
      return [];
    }

    return (data || []).map(mapInvoiceRow);
  } catch (err) {
    console.error("Exception fetching invoices:", err);
    return [];
  }
}

export async function updateInvoiceStatus(
  id: string,
  payload: { status: string; reason?: string },
) {
  try {
    const rentPaymentId = parsePrefixedId(id, "RP-");
    if (String(id).startsWith("RP-") && rentPaymentId) {
      const paymentStatus = payload.status === "Paid" ? "Successful" : payload.status;
      try {
        return await updateRentPaymentById(rentPaymentId, { payment_status: paymentStatus });
      } catch (rentError) {
        if (!isSupabaseSchemaError(rentError)) {
          console.error("Error updating rent payment:", rentError);
        }
      }
    }

    const numericId = parsePrefixedId(id, "INV-");
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

export async function recordRentPaymentSuccess(
  invoice: {
    id: string;
    rawId?: number | string | null;
    source?: string;
  },
  payload: {
    payment_reference: string;
    payment_method?: string;
    receipt_url?: string;
  },
) {
  const source = invoice.source || (invoice.id.startsWith("RP-") ? "rent_payments" : "invoices");
  const rawId =
    invoice.rawId ??
    (source === "rent_payments"
      ? parsePrefixedId(invoice.id, "RP-")
      : parsePrefixedId(invoice.id, "INV-"));

  if (source === "rent_payments") {
    return updateRentPaymentById(rawId, {
      payment_status: "Successful",
      payment_method: payload.payment_method || "Razorpay",
      payment_reference: payload.payment_reference,
      receipt_url: payload.receipt_url || null,
      payment_date: todayIsoDate(),
    });
  }

  const { data, error } = await supabase
    .from("invoices")
    .update({ payment_status: "Paid" })
    .eq("invoice_id", rawId)
    .select();

  if (error) throw error;
  return data;
}

// ================= SUPPORT TICKETS =================

export async function getSupportTickets() {
  try {
    const { data, error } = await supabase
      .from("support_tickets")
      .select(
        `
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
      `,
      )
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
      priority:
        t.priority || (t.ticket_id % 3 === 0 ? "High" : t.ticket_id % 2 === 0 ? "Low" : "Medium"),
      status: t.status || "Open",
      created: t.created_at
        ? new Date(t.created_at).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
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
      availabilityStatus: (payload.available ?? true) ? "Available" : "Busy",
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
    return keywords
      .filter(Boolean)
      .map((keyword) => String(keyword).trim())
      .filter(Boolean);
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
  const listingId =
    row.id ??
    row.ai_listing_id ??
    row.listing_id ??
    row.property_id ??
    row.propertyId ??
    Date.now();
  const title = row.title || row.name || "Untitled Listing";
  const listingType = row.listing_type || row.listingType || "Draft";
  const listingStatus = row.listing_status || row.listingStatus || row.status || "Draft";
  const price = Number(row.price || 0);
  const description =
    row.description ||
    row.description_text ||
    `${title} is a ${listingType.toLowerCase()} listing with ${listingStatus.toLowerCase()} status and pricing of ${price > 0 ? `₹${price.toLocaleString()}` : "competitive pricing"}.`;

  return {
    id:
      String(listingId).startsWith("L-") || String(listingId).startsWith("AI-")
        ? String(listingId)
        : `L-${listingId}`,
    propertyId: `P-${row.property_id ?? row.propertyId ?? listingId}`,
    title,
    description,
    keywords: normalizeAiListingKeywords(
      row.keywords || [listingType, listingStatus, row.status || "Listed"],
    ),
    price,
    landlordId: row.landlord_id ?? row.realtor_id ?? row.realtorId ?? null,
    createdAt:
      row.listing_date ||
      row.listingDate ||
      row.created_at ||
      row.updated_at ||
      new Date().toISOString(),
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
  if (payload.service_request_source !== "maintenance_request" && payload.service_request_id) {
    const { data, error } = await supabase
      .from("appointments")
      .insert({
        title: payload.title,
        service_request_id: payload.service_request_id,
        contractor_id: payload.contractor_id,
        appointment_date: payload.appointment_date,
        appointment_time: payload.appointment_time,
        status: "Scheduled",
      })
      .select()
      .single();

    if (!error) return data;
    if (!isSupabaseSchemaError(error)) throw error;
  }

  const visitSchedulePayload = {
    tenant_id: payload.tenant_id || DEFAULT_TENANT_ID,
    property_id: payload.property_id || DEFAULT_PROPERTY_ID,
    landlord_id: payload.landlord_id || null,
    service_request_id: payload.service_request_id || null,
    visit_date: payload.appointment_date,
    visit_time: payload.appointment_time,
    visit_status: payload.status || "Pending",
    remarks: payload.title || "Property visit",
  };

  const tenantTableResult = await supabase
    .from("visit_schedule")
    .insert([visitSchedulePayload])
    .select()
    .single();

  if (!tenantTableResult.error) {
    return tenantTableResult.data;
  }

  if (isSupabaseSchemaError(tenantTableResult.error) && payload.service_request_id) {
    const retryPayload = { ...visitSchedulePayload };
    delete (retryPayload as any).service_request_id;
    const retry = await supabase.from("visit_schedule").insert([retryPayload]).select().single();
    if (!retry.error) return retry.data;
  }

  if (!isSupabaseSchemaError(tenantTableResult.error)) {
    console.error("Error creating visit schedule:", tenantTableResult.error);
  }

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      title: payload.title,
      service_request_id: payload.service_request_id,
      contractor_id: payload.contractor_id,
      appointment_date: payload.appointment_date,
      appointment_time: payload.appointment_time,
      status: "Scheduled",
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}
export async function updateAppointmentDateTime(
  id: string,
  payload: {
    appointment_date: string;
    appointment_time: string;
  },
) {
  const numericId = parsePrefixedId(id, "A-");
  const tenantTableResult = await supabase
    .from("visit_schedule")
    .update({
      visit_date: payload.appointment_date,
      visit_time: payload.appointment_time,
      visit_status: "Pending",
    })
    .eq("visit_id", numericId)
    .select()
    .single();

  if (!tenantTableResult.error) {
    return tenantTableResult.data;
  }

  if (!isSupabaseSchemaError(tenantTableResult.error)) {
    console.error("Error rescheduling visit:", tenantTableResult.error);
  }

  const { data, error } = await supabase
    .from("appointments")
    .update({
      appointment_date: payload.appointment_date,
      appointment_time: payload.appointment_time,
    })
    .eq("appointment_id", numericId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
export async function createEstimate(payload: {
  service_request_id: number;
  contractor_id: number;
  estimated_cost: number;
}) {
  console.log("PAYLOAD RECEIVED:", payload);

  const { data, error } = await supabase
    .from("estimates")
    .insert({
      service_request_id: payload.service_request_id,
      contractor_id: payload.contractor_id,
      estimated_cost: payload.estimated_cost,
      status: "Pending",
      submitted_date: new Date().toISOString().split("T")[0],
    })
    .select();

  console.log("DATA:", data);
  console.log("ERROR:", error);

  if (error) throw error;

  return data;
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
    (request) => request.status === "Assigned" || request.status === "In Progress",
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
  const { data, error } = await supabase.from("subscriptions").insert([payload]).select();

  if (error) throw error;

  return data;
}

export async function updateSubscriptionData(id: string, payload: any) {
  const { data, error } = await supabase
    .from("subscriptions")
    .update(payload)
    .eq("subscription_id", id)
    .select();

  if (error) throw error;

  return data;
}

// ================= TENANT ROLE =================

export interface TenantRecord {
  tenant_id: number;
  user_id?: number | null;
  auth_user_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  mobile_number?: string | null;
  profile_photo?: string | null;
  activePropertyId?: number | null;
  activeLease?: TenantLeaseRecord | null;
}

export interface TenantLeaseRecord {
  agreement_id?: number;
  agreement_number?: string | null;
  property_id?: number | null;
  landlord_id?: number | null;
  lease_start?: string | null;
  lease_end?: string | null;
  monthly_rent?: number | null;
  security_deposit?: number | null;
  agreement_document?: string | null;
  lease_status?: string | null;
  property_name?: string | null;
  property_address?: string | null;
  landlord_name?: string | null;
}

async function getTenantUserProfile(email: string, authUserId?: string) {
  let userQuery = supabase
    .from("users")
    .select("user_id, name, email, phone, auth_user_id")
    .eq("email", email)
    .eq("role_id", 3);
  if (authUserId) userQuery = userQuery.eq("auth_user_id", authUserId);

  const { data, error } = await userQuery.maybeSingle();
  if (!error && data) return data;

  const fallback = await supabase
    .from("users")
    .select("user_id, name, email, phone, auth_user_id")
    .eq("email", email)
    .maybeSingle();

  if (fallback.error && !isSupabaseSchemaError(fallback.error)) {
    console.error("Error fetching tenant user profile:", fallback.error);
  }

  return fallback.data || null;
}

async function ensureTenantRecordForUser(userData: {
  user_id: number;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  auth_user_id?: string | null;
}): Promise<TenantRecord | null> {
  if (!userData.email) return null;

  const [firstName, ...lastNameParts] = String(userData.name || "Tenant").split(" ");
  const tenantPayload = {
    first_name: firstName || "Tenant",
    last_name: lastNameParts.join(" ") || null,
    email: userData.email,
    mobile_number: userData.phone || null,
    account_status: "Active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("tenant").insert([tenantPayload]).select().single();

  if (error) {
    if (!isSupabaseSchemaError(error)) console.error("Error creating tenant profile:", error);
    return {
      tenant_id: userData.user_id,
      user_id: userData.user_id,
      auth_user_id: userData.auth_user_id,
      first_name: tenantPayload.first_name,
      last_name: tenantPayload.last_name,
      email: userData.email,
      mobile_number: userData.phone,
      profile_photo: null,
      activePropertyId: null,
      activeLease: null,
    };
  }

  const activeLease = await getTenantActiveLease(data.tenant_id);
  return {
    ...data,
    user_id: userData.user_id,
    auth_user_id: userData.auth_user_id,
    activePropertyId: activeLease?.property_id ?? null,
    activeLease,
  };
}

export interface TenantNotificationRecord {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  time: string;
  rawId?: number;
}

function tenantDisplayName(row: {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}) {
  const full = [row.first_name, row.last_name].filter(Boolean).join(" ").trim();
  return full || row.email || "Tenant";
}

export async function getTenantByEmail(
  email: string,
  authUserId?: string,
): Promise<TenantRecord | null> {
  try {
    const userProfile = await getTenantUserProfile(email, authUserId);
    let tenantQuery = supabase
      .from("tenant")
      .select("tenant_id, first_name, last_name, email, mobile_number, profile_photo")
      .eq("email", email);
    const { data, error } = await tenantQuery.maybeSingle();

    if (!error && data) {
      const activeLease = await getTenantActiveLease(data.tenant_id);

      return {
        ...data,
        user_id: userProfile?.user_id ?? null,
        auth_user_id: userProfile?.auth_user_id ?? authUserId ?? null,
        activePropertyId: activeLease?.property_id ?? null,
        activeLease,
      };
    }

    if (error && !isSupabaseSchemaError(error)) {
      console.error("Error fetching tenant:", error);
    }

    if (!userProfile) return null;
    return ensureTenantRecordForUser(userProfile);
  } catch (err) {
    console.error("Exception fetching tenant:", err);
    return null;
  }
}

export async function getTenantActiveLease(tenantId: number): Promise<TenantLeaseRecord | null> {
  try {
    const { data, error } = await supabase
      .from("lease_agreements")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("lease_start", { ascending: false })
      .limit(1);

    if (error || !data?.length) {
      return null;
    }

    const lease = data[0];
    let property_name: string | null = null;
    let property_address: string | null = null;

    if (lease.property_id) {
      const { data: property } = await supabase
        .from("properties")
        .select("property_name, address, city, state")
        .eq("property_id", lease.property_id)
        .maybeSingle();

      if (property) {
        property_name = property.property_name || null;
        property_address =
          [property.address, property.city, property.state].filter(Boolean).join(", ") || null;
      }
    }

    return {
      ...lease,
      property_name,
      property_address,
    };
  } catch (err) {
    console.error("Exception fetching tenant lease:", err);
    return null;
  }
}

export async function getTenantLeaseAgreements(tenantId: number) {
  try {
    const { data, error } = await supabase
      .from("lease_agreements")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("lease_start", { ascending: false });

    if (error) {
      if (!isSupabaseSchemaError(error)) console.error("Error fetching leases:", error);
      return [];
    }

    const leases = data || [];
    const propertyIds = [...new Set(leases.map((l) => l.property_id).filter(Boolean))];
    const propertyMap = new Map<number, { property_name?: string; address?: string }>();

    if (propertyIds.length > 0) {
      const { data: properties } = await supabase
        .from("properties")
        .select("property_id, property_name, address, city, state")
        .in("property_id", propertyIds);

      for (const property of properties || []) {
        propertyMap.set(property.property_id, property);
      }
    }

    return leases.map((lease) => {
      const property = lease.property_id ? propertyMap.get(lease.property_id) : null;
      return {
        id: `LA-${lease.agreement_id ?? lease.lease_id ?? lease.id}`,
        agreementId: lease.agreement_id ?? lease.lease_id ?? lease.id,
        agreementNumber:
          lease.agreement_number || `LA-${lease.agreement_id ?? lease.lease_id ?? lease.id}`,
        propertyId: lease.property_id,
        property:
          property?.property_name ||
          (lease.property_id ? `Property #${lease.property_id}` : "Unknown"),
        propertyAddress: property
          ? [property.address, property.city, property.state].filter(Boolean).join(", ")
          : "",
        leaseStart: lease.lease_start,
        leaseEnd: lease.lease_end,
        rent: Number(lease.monthly_rent || 0),
        securityDeposit: Number(lease.security_deposit || 0),
        status: lease.lease_status || "Active",
        documentUrl: lease.agreement_document || null,
        tenantName: tenantDisplayName({ first_name: null, last_name: null, email: null }),
      };
    });
  } catch (err) {
    console.error("Exception fetching tenant leases:", err);
    return [];
  }
}

export async function getTenantDocuments(tenantId: number) {
  try {
    const { data, error } = await supabase
      .from("tenant_document")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("uploaded_at", { ascending: false });

    if (error) {
      if (!isSupabaseSchemaError(error)) console.error("Error fetching tenant documents:", error);
      return [];
    }

    return (data || []).map((doc) => ({
      id: `TD-${doc.document_id}`,
      name: `${doc.document_type || "Document"}${doc.document_number ? ` · ${doc.document_number}` : ""}`,
      type: doc.document_type || "Document",
      fileUrl: doc.document_file || null,
      status: doc.verification_status || "Pending",
      updated: doc.uploaded_at
        ? new Date(doc.uploaded_at).toISOString().split("T")[0]
        : todayIsoDate(),
      size: doc.document_file ? "On file" : "—",
    }));
  } catch (err) {
    console.error("Exception fetching tenant documents:", err);
    return [];
  }
}

export async function getTenantServiceRequests(tenantId: number, legacyTenantId?: number | null) {
  return getServiceRequests({ tenantId, legacyTenantId: legacyTenantId || tenantId });
}

export async function getTenantAppointments(tenantId: number, legacyTenantId?: number | null) {
  const all = await getAppointments();
  const allowedTenantIds = new Set([tenantId, legacyTenantId || tenantId]);
  return all.filter((appointment) => allowedTenantIds.has(appointment.tenantId));
}

export async function getTenantInvoices(tenantId: number, legacyTenantId?: number | null) {
  const all = await getInvoices();
  const allowedTenantIds = new Set([tenantId, legacyTenantId || tenantId]);
  return all.filter((invoice) => allowedTenantIds.has(invoice.tenantId));
}

export async function getTenantNotifications(
  tenantId: number,
): Promise<TenantNotificationRecord[]> {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("notification_date", { ascending: false });

    if (error) {
      if (!isSupabaseSchemaError(error)) console.error("Error fetching notifications:", error);
      return [];
    }

    return (data || []).map((note) => ({
      id: `N-${note.notification_id ?? note.id}`,
      rawId: note.notification_id ?? note.id,
      title: note.notification_title || note.title || "Notification",
      body: note.notification_message || note.message || note.body || "",
      type: note.notification_type || note.type || "General",
      read: (note.notification_status || note.status) === "Read",
      time: note.notification_date
        ? new Date(note.notification_date).toLocaleString()
        : note.created_at
          ? new Date(note.created_at).toLocaleString()
          : "Recently",
    }));
  } catch (err) {
    console.error("Exception fetching notifications:", err);
    return [];
  }
}

export async function markTenantNotificationRead(notificationId: number) {
  const { error } = await supabase
    .from("notifications")
    .update({ notification_status: "Read" })
    .eq("notification_id", notificationId);

  if (error) throw error;
}

export async function markAllTenantNotificationsRead(tenantId: number) {
  const { error } = await supabase
    .from("notifications")
    .update({ notification_status: "Read" })
    .eq("tenant_id", tenantId)
    .eq("notification_status", "Unread");

  if (error) throw error;
}

export async function updateTenantProfilePhoto(tenantId: number, photoUrl: string) {
  const { data, error } = await supabase
    .from("tenant")
    .update({ profile_photo: photoUrl, updated_at: new Date().toISOString() })
    .eq("tenant_id", tenantId)
    .select();

  if (error) throw error;
  return data;
}

export async function getTenantDashboardSummary(tenantId: number, legacyTenantId?: number | null) {
  const [requests, appointments, documents, invoices, lease] = await Promise.all([
    getTenantServiceRequests(tenantId, legacyTenantId),
    getTenantAppointments(tenantId, legacyTenantId),
    getTenantDocuments(tenantId),
    getTenantInvoices(tenantId, legacyTenantId),
    getTenantActiveLease(tenantId),
  ]);

  const openRequests = requests.filter(
    (request) => !["Completed", "Rejected"].includes(request.status),
  );
  const upcomingAppointments = appointments.filter((appointment) => {
    if (!appointment.date) return false;
    const visitDate = new Date(appointment.date);
    return visitDate >= new Date(todayIsoDate()) && appointment.status !== "Rejected";
  });

  const pendingInvoice =
    invoices.find((invoice) => invoice.status === "Pending" || invoice.status === "Overdue") ||
    invoices[0] ||
    null;

  return {
    openRequests,
    upcomingAppointments,
    documents,
    pendingInvoice,
    lease,
  };
}

export async function createFavoriteProperty(payload: { tenant_id: number; property_id: number }) {
  const { data, error } = await supabase
    .from("favorite_property")
    .insert([
      {
        tenant_id: payload.tenant_id,
        property_id: payload.property_id,
        added_on: new Date().toISOString(),
      },
    ])
    .select();

  if (error) throw error;
  return data;
}

export async function createPropertyInquiry(payload: {
  tenant_id: number;
  property_id: number;
  landlord_id?: number | null;
  inquiry_message: string;
}) {
  const { data, error } = await supabase
    .from("property_inquiry")
    .insert([
      {
        tenant_id: payload.tenant_id,
        property_id: payload.property_id,
        landlord_id: payload.landlord_id || null,
        inquiry_message: payload.inquiry_message,
        inquiry_status: "Pending",
        inquiry_date: new Date().toISOString(),
      },
    ])
    .select();

  if (error) throw error;
  return data;
}

export async function createRentalApplication(payload: {
  tenant_id: number;
  property_id: number;
  landlord_id?: number | null;
  expected_move_in?: string | null;
  occupation?: string | null;
  monthly_income?: number | null;
  remarks?: string | null;
}) {
  const { data, error } = await supabase
    .from("rental_application")
    .insert([
      {
        tenant_id: payload.tenant_id,
        property_id: payload.property_id,
        landlord_id: payload.landlord_id || null,
        application_date: todayIsoDate(),
        expected_move_in: payload.expected_move_in || null,
        occupation: payload.occupation || null,
        monthly_income: payload.monthly_income || null,
        application_status: "Pending",
        remarks: payload.remarks || null,
      },
    ])
    .select();

  if (error) throw error;
  return data;
}

export async function createReviewRating(payload: {
  tenant_id: number;
  property_id: number;
  landlord_id?: number | null;
  rating: number;
  review_title: string;
  review_description?: string | null;
}) {
  const { data, error } = await supabase
    .from("review_rating")
    .insert([
      {
        tenant_id: payload.tenant_id,
        property_id: payload.property_id,
        landlord_id: payload.landlord_id || null,
        rating: payload.rating,
        review_title: payload.review_title,
        review_description: payload.review_description || null,
        review_date: todayIsoDate(),
      },
    ])
    .select();

  if (error) throw error;
  return data;
}
