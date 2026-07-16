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
      const { data, error } = await supabase.from("properties").select("*").limit(1);

      if (error) {
        console.error("❌ Supabase Error:", error);
        return { connected: false, error: error.message };
      }

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
      const { data, error } = await supabase.from("properties").select("*, property_rent_details(*), property_amenities(*), tenant_preferences(*), property_utilities(*), nearby_facilities(*), property_documents(*), property_contact_details(*)");

      if (error) {
        console.error("Supabase Error:", error);
        return [];
      }

      return data ? data.map(parsePropertySpecs) : [];
    } catch (err) {
      console.error("Exception:", err);
      return [];
    }
  }
  export async function getLandlordProperties(landlordId: string) {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*, property_rent_details(*), property_amenities(*), tenant_preferences(*), property_utilities(*), nearby_facilities(*), property_documents(*), property_contact_details(*)")
        .eq("landlord_id", landlordId)
        .order("property_id", { ascending: false });

      if (error) {
        console.error("Error fetching properties:", error);
        return [];
      }
      return data ? data.map(parsePropertySpecs) : [];
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

      const propertyContactDetailsObj = payload.property_contact_details;
      delete payload.property_contact_details;

      const utilitiesObj = payload.property_utilities;
      delete payload.property_utilities;

      const nearbyFacilitiesObj = payload.nearby_facilities;
      delete payload.nearby_facilities;

      const propertyDocumentsObj = payload.property_documents;
      delete payload.property_documents;

      const propertyAdditionalInfo = payload.property_additional_information;
      const propertyParking = payload.property_parking;
      const propertyAvailability = payload.property_availability;
      const adminApproval = payload.admin_approval;
      const propertyVerified = payload.property_verified;
      const featuredProperty = payload.featured_property;

      delete payload.property_additional_information;
      delete payload.property_parking;
      delete payload.property_availability;
      delete payload.admin_approval;
      delete payload.property_verified;
      delete payload.featured_property;

      let rentDetailsObj: any = null;
      let specs: any = {};
      if (payload.specifications) {
        try {
          specs = JSON.parse(payload.specifications);
        } catch (e) {}
      }
      
      if (specs.rent_details) {
        rentDetailsObj = { ...specs.rent_details };
      }
      if (propertyAdditionalInfo) specs.property_additional_information = propertyAdditionalInfo;
      if (propertyParking) specs.property_parking = propertyParking;
      if (propertyAvailability) specs.property_availability = propertyAvailability;
      if (adminApproval !== undefined) specs.admin_approval = adminApproval;
      if (propertyVerified !== undefined) specs.property_verified = propertyVerified;
      if (featuredProperty !== undefined) specs.featured_property = featuredProperty;
      
      if (Object.keys(specs).length > 0) {
        payload.specifications = JSON.stringify(specs);
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

        // Add Nearby Facilities
        if (nearbyFacilitiesObj) {
          const facilitiesPayload = {
            property_id: propertyId,
            school_distance: parseNumeric(nearbyFacilitiesObj.school_distance),
            college_distance: parseNumeric(nearbyFacilitiesObj.college_distance),
            hospital_distance: parseNumeric(nearbyFacilitiesObj.hospital_distance),
            bus_stop_distance: parseNumeric(nearbyFacilitiesObj.bus_stop_distance),
            railway_station_distance: parseNumeric(nearbyFacilitiesObj.railway_station_distance),
            airport_distance: parseNumeric(nearbyFacilitiesObj.airport_distance),
            supermarket_distance: parseNumeric(nearbyFacilitiesObj.supermarket_distance),
            bank_distance: parseNumeric(nearbyFacilitiesObj.bank_distance),
          };
          const { error: facilitiesError } = await supabase
            .from("nearby_facilities")
            .insert([facilitiesPayload]);
          if (facilitiesError) console.error("Error creating nearby facilities:", facilitiesError);
        }

        // Add Property Documents
        if (propertyDocumentsObj) {
          const documentsPayload = {
            property_id: propertyId,
            ownership_proof: propertyDocumentsObj.ownership_proof || null,
            tax_receipt: propertyDocumentsObj.tax_receipt || null,
            electricity_bill: propertyDocumentsObj.electricity_bill || null,
            encumbrance_certificate: propertyDocumentsObj.encumbrance_certificate || null,
            occupancy_certificate: propertyDocumentsObj.occupancy_certificate || null,
            property_insurance: propertyDocumentsObj.property_insurance || null,
            owner_government_id: propertyDocumentsObj.owner_government_id || null,
          };
          const { error: documentsError } = await supabase
            .from("property_documents")
            .insert([documentsPayload]);
          if (documentsError) console.error("Error creating property documents:", documentsError);
        }

        // Add Property Contact Details
        if (propertyContactDetailsObj) {
          const contactPayload = {
            property_id: propertyId,
            landlord_name: propertyContactDetailsObj.landlord_name || null,
            mobile_number: propertyContactDetailsObj.mobile_number || null,
            email: propertyContactDetailsObj.email || null,
            preferred_contact_time: propertyContactDetailsObj.preferred_contact_time || null,
            whatsapp_number: propertyContactDetailsObj.whatsapp_number || null,
          };
          const { error: contactError } = await supabase
            .from("property_contact_details")
            .insert([contactPayload]);
          if (contactError) console.error("Error creating property contact details:", contactError);
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

      const nearbyFacilitiesObj = payload.nearby_facilities;
      delete payload.nearby_facilities;

      const propertyDocumentsObj = payload.property_documents;
      delete payload.property_documents;

      const propertyContactDetailsObj = payload.property_contact_details;
      delete payload.property_contact_details;

      const propertyAdditionalInfo = payload.property_additional_information;
      const propertyParking = payload.property_parking;
      const propertyAvailability = payload.property_availability;
      const adminApproval = payload.admin_approval;
      const propertyVerified = payload.property_verified;
      const featuredProperty = payload.featured_property;

      delete payload.property_additional_information;
      delete payload.property_parking;
      delete payload.property_availability;
      delete payload.admin_approval;
      delete payload.property_verified;
      delete payload.featured_property;

      let rentDetailsObj: any = null;
      let specs: any = {};
      if (payload.specifications) {
        try {
          specs = JSON.parse(payload.specifications);
        } catch (e) {}
      } else {
        const hasExtraFields = propertyAdditionalInfo || propertyParking || propertyAvailability || adminApproval !== undefined || propertyVerified !== undefined || featuredProperty !== undefined;
        if (hasExtraFields) {
          const { data: existingData } = await supabase.from("properties").select("specifications").eq("property_id", id).single();
          if (existingData && existingData.specifications) {
            try {
              specs = JSON.parse(existingData.specifications);
            } catch (e) {}
          }
        }
      }

      if (specs.rent_details) {
        rentDetailsObj = { ...specs.rent_details };
      }
      if (propertyAdditionalInfo) specs.property_additional_information = propertyAdditionalInfo;
      if (propertyParking) specs.property_parking = propertyParking;
      if (propertyAvailability) specs.property_availability = propertyAvailability;
      if (adminApproval !== undefined) specs.admin_approval = adminApproval;
      if (propertyVerified !== undefined) specs.property_verified = propertyVerified;
      if (featuredProperty !== undefined) specs.featured_property = featuredProperty;
      
      if (Object.keys(specs).length > 0) {
        payload.specifications = JSON.stringify(specs);
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

      if (nearbyFacilitiesObj) {
        const parseNumeric = (val: any) => {
          if (!val) return null;
          const num = Number(String(val).replace(/[^0-9.-]/g, ""));
          return isNaN(num) ? null : num;
        };

        const facilitiesPayload = {
          property_id: id,
          school_distance: parseNumeric(nearbyFacilitiesObj.school_distance),
          college_distance: parseNumeric(nearbyFacilitiesObj.college_distance),
          hospital_distance: parseNumeric(nearbyFacilitiesObj.hospital_distance),
          bus_stop_distance: parseNumeric(nearbyFacilitiesObj.bus_stop_distance),
          railway_station_distance: parseNumeric(nearbyFacilitiesObj.railway_station_distance),
          airport_distance: parseNumeric(nearbyFacilitiesObj.airport_distance),
          supermarket_distance: parseNumeric(nearbyFacilitiesObj.supermarket_distance),
          bank_distance: parseNumeric(nearbyFacilitiesObj.bank_distance),
        };

        const { data: existingFac } = await supabase
          .from("nearby_facilities")
          .select("facility_id")
          .eq("property_id", id)
          .maybeSingle();

        if (existingFac) {
          const { error: upError } = await supabase
            .from("nearby_facilities")
            .update(facilitiesPayload)
            .eq("property_id", id);
          if (upError) console.error("Error updating nearby facilities:", upError);
        } else {
          const { error: insError } = await supabase
            .from("nearby_facilities")
            .insert([facilitiesPayload]);
          if (insError) console.error("Error inserting nearby facilities:", insError);
        }
      }

      if (propertyDocumentsObj) {
        const documentsPayload = {
          property_id: id,
          ownership_proof: propertyDocumentsObj.ownership_proof || null,
          tax_receipt: propertyDocumentsObj.tax_receipt || null,
          electricity_bill: propertyDocumentsObj.electricity_bill || null,
          encumbrance_certificate: propertyDocumentsObj.encumbrance_certificate || null,
          occupancy_certificate: propertyDocumentsObj.occupancy_certificate || null,
          property_insurance: propertyDocumentsObj.property_insurance || null,
          owner_government_id: propertyDocumentsObj.owner_government_id || null,
        };

        const { data: existingDoc } = await supabase
          .from("property_documents")
          .select("document_id")
          .eq("property_id", id)
          .maybeSingle();

        if (existingDoc) {
          const { error: upError } = await supabase
            .from("property_documents")
            .update(documentsPayload)
            .eq("property_id", id);
          if (upError) console.error("Error updating property documents:", upError);
        } else {
          const { error: insError } = await supabase
            .from("property_documents")
            .insert([documentsPayload]);
          if (insError) console.error("Error inserting property documents:", insError);
        }
      }

      // Handle Property Contact Details
      if (propertyContactDetailsObj) {
        const contactPayload = {
          property_id: id,
          landlord_name: propertyContactDetailsObj.landlord_name || null,
          mobile_number: propertyContactDetailsObj.mobile_number || null,
          email: propertyContactDetailsObj.email || null,
          preferred_contact_time: propertyContactDetailsObj.preferred_contact_time || null,
          whatsapp_number: propertyContactDetailsObj.whatsapp_number || null,
        };

        const { data: existingContact } = await supabase
          .from("property_contact_details")
          .select("contact_id")
          .eq("property_id", id)
          .maybeSingle();

        if (existingContact) {
          const { error: upError } = await supabase
            .from("property_contact_details")
            .update(contactPayload)
            .eq("property_id", id);
          if (upError) console.error("Error updating property contact details:", upError);
        } else {
          const { error: insError } = await supabase
            .from("property_contact_details")
            .insert([contactPayload]);
          if (insError) console.error("Error inserting property contact details:", insError);
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
        .select("*, property_rent_details(*), property_amenities(*), tenant_preferences(*), property_utilities(*), nearby_facilities(*), property_documents(*), property_contact_details(*)")
        .eq("property_id", id)
        .single();

      if (error) {
        console.error("Error fetching property:", error);
        return null;
      }

      if (data) {
        parsePropertySpecs(data);
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

        data.nearbyFacilitiesData = data.nearby_facilities?.[0] || data.nearby_facilities || null;
        delete data.nearby_facilities;

        data.documentsData = data.property_documents?.[0] || data.property_documents || null;
        delete data.property_documents;

        data.contactDetailsData = data.property_contact_details?.[0] || data.property_contact_details || null;
        delete data.property_contact_details;
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
      const { data: srmData } = await supabase
        .from("service_request_management")
        .select("property_id, tenant_id, landlord_id")
        .eq("service_request_id", payload.service_request_id)
        .single();

      const propertyId = srmData?.property_id || 1;
      const tenantId = srmData?.tenant_id || 1;
      const landlordId = srmData?.landlord_id || 4;

      const { data, error } = await supabase
        .from("payment_management")
        .insert([
          {
            service_request_id: payload.service_request_id,
            contractor_id: payload.contractor_id,
            landlord_id: landlordId,
            tenant_id: tenantId,
            property_id: propertyId,
            payment_amount: payload.amount,
            payment_method: payload.payment_method || "Bank Transfer",
            payment_reference: payload.payment_reference || "",
            payment_status: payload.payment_status || "Pending",
            payment_date: payload.payment_date || new Date().toISOString(),
            receipt_document: payload.receipt_document || "",
          },
        ])
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
        .from("payment_management")
        .delete()
        .eq("payment_management_id", numericId)
        .select();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error("Error deleting invoice:", err);
      throw err;
    }
  }

  export async function updateInvoice(
    id: string,
    payload: {
      amount?: number;
      status?: string;
      payment_method?: string;
      payment_reference?: string;
      payment_date?: string;
      receipt_document?: string;
    }
  ) {
    try {
      const numericId = parseInt(String(id).replace("INV-", ""), 10);
      const mapped: any = {};
      if (payload.amount !== undefined) mapped.payment_amount = payload.amount;
      if (payload.status !== undefined) mapped.payment_status = payload.status;
      if (payload.payment_method !== undefined) mapped.payment_method = payload.payment_method;
      if (payload.payment_reference !== undefined) mapped.payment_reference = payload.payment_reference;
      if (payload.payment_date !== undefined) mapped.payment_date = payload.payment_date;
      if (payload.receipt_document !== undefined) mapped.receipt_document = payload.receipt_document;

      const { data, error } = await supabase
        .from("payment_management")
        .update(mapped)
        .eq("payment_management_id", numericId)
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
      .from("service_request_management")
      .select(`
        service_request_id,
        maintenance_request_id,
        service_admin_id,
        landlord_id,
        tenant_id,
        property_id,
        contractor_id,
        request_category,
        priority,
        request_status,
        assigned_date,
        completed_date,
        properties (property_name),
        tenant (first_name, last_name),
        contractors (name)
      `)
      .order("service_request_id", { ascending: false });

    if (error) {
      console.error("Error fetching service requests:", error);
      return [];
    }

    return (data || []).map((r: any) => ({
      id: `SR-${r.service_request_id}`,
      title: r.request_category || "General Maintenance",
      category: r.request_category || "General",
      property: r.properties?.property_name || "Unassigned Property",
      tenant: r.tenant ? `${r.tenant.first_name || ""} ${r.tenant.last_name || ""}`.trim() : "Unassigned Tenant",
      priority: r.priority || "Medium",
      status: r.request_status || "Pending",
      contractor: r.contractors?.name || null,
      created: r.assigned_date ? new Date(r.assigned_date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      tenantId: r.tenant_id,
      propertyId: r.property_id,
      requestId: r.service_request_id,
      source: "maintenance_request",
      contractorId: r.contractor_id,
      assignedDate: r.assigned_date,
      completedDate: r.completed_date,
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
    // 1. Insert raw maintenance_request
    const { data: srvData, error: srvError } = await supabase
      .from("maintenance_request")
      .insert([
        {
          tenant_id: payload.tenant_id || 1,
          property_id: payload.property_id || 1,
          issue_category: payload.category,
          issue_description: payload.description,
          priority: payload.priority,
          request_status: "Pending"
        }
      ])
      .select();

    if (srvError) {
      console.error("Error creating maintenance request:", srvError);
      throw srvError;
    }
    const reqId = srvData[0].request_id;

    // 2. Insert triage service_request_management
    const { data, error } = await supabase
      .from("service_request_management")
      .insert([
        {
          maintenance_request_id: reqId,
          service_admin_id: 1,
          landlord_id: payload.created_by || 4,
          tenant_id: payload.tenant_id || 1,
          property_id: payload.property_id || 1,
          request_category: payload.category,
          priority: payload.priority,
          request_status: "Pending"
        }
      ])
      .select();

    if (error) {
      console.error("Error creating service request management:", error);
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
    contractor_id?: number | null;
    assigned_date?: string | null;
    completed_date?: string | null;
  }
) {
  try {
    const numericId = parseInt(id.replace("SR-", ""), 10);
    const mapped: any = {};
    if (payload.status !== undefined) mapped.request_status = payload.status;
    if (payload.priority !== undefined) mapped.priority = payload.priority;
    if (payload.category !== undefined) mapped.request_category = payload.category;
    if (payload.contractor_id !== undefined) mapped.contractor_id = payload.contractor_id;
    if (payload.assigned_date !== undefined) mapped.assigned_date = payload.assigned_date;
    if (payload.completed_date !== undefined) mapped.completed_date = payload.completed_date;

    const { data, error } = await supabase
      .from("service_request_management")
      .update(mapped)
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
    
    const { data: srmData } = await supabase
      .from("service_request_management")
      .select("maintenance_request_id")
      .eq("service_request_id", numericId)
      .single();

    if (srmData) {
      await supabase.from("service_request_management").delete().eq("service_request_id", numericId);
      await supabase.from("maintenance_request").delete().eq("request_id", srmData.maintenance_request_id);
    }
    return { success: true };
  } catch (err) {
    console.error("Exception deleting service request:", err);
    throw err;
  }
}

// ================= CONTRACTORS =================

function normalizeRealtor(realtor: (typeof mockRealtors)[number]) {
  return {
    ...realtor,
    name: realtor.realtorName,
  };
}

  function nextRealtorId() {
    return `R-${401 + mockRealtors.length}`;
  }

export async function getContractors() {
  try {
    const { data, error } = await supabase
      .from("contractors")
      .select("*")
      .order("contractor_id", { ascending: true });

    if (error) {
      console.error("Error fetching contractors:", error);
      return [];
    }

    return (data || []).map((c: any) => ({
      id: `C-${c.contractor_id}`,
      contractorId: `C-${c.contractor_id}`,
      name: c.name,
      companyName: c.company_name || c.name,
      trade: c.trade || "General",
      specialization: c.trade || "General",
      rating: Number(c.rating || 0),
      jobs: c.jobs_completed || 0,
      available: c.available ?? true,
      availabilityStatus: c.available ?? true ? "Available" : "Busy",
      email: c.email || "",
      phone: c.phone || "",
    }));
  } catch (err) {
    console.error("Exception fetching contractors:", err);
    return [];
  }
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
      .from("service_schedule")
      .select(`
        schedule_id,
        assignment_id,
        contractor_id,
        service_admin_id,
        property_id,
        service_date,
        start_time,
        end_time,
        schedule_status,
        notes,
        properties (property_name),
        contractors (name),
        contractor_assignment (
          service_request_id,
          service_request_management (
            tenant_id
          )
        )
      `)
      .order("service_date", { ascending: true });

    if (error) {
      console.error("Error fetching appointments:", error);
      return [];
    }

    return (data || []).map((s: any) => {
      const assignment = Array.isArray(s.contractor_assignment)
        ? s.contractor_assignment[0]
        : s.contractor_assignment;
      const srm = assignment?.service_request_management;
      const srmObj = Array.isArray(srm) ? srm[0] : srm;
      const tenantId = srmObj?.tenant_id || null;
      const requestId = assignment?.service_request_id || null;

      return {
        id: `A-${s.schedule_id}`,
        title: s.notes || "Service Appointment",
        date: s.service_date || new Date().toISOString().split("T")[0],
        time: s.start_time ? s.start_time.slice(0, 5) : "12:00",
        endTime: s.end_time ? s.end_time.slice(0, 5) : "13:00",
        property: s.properties?.property_name || "Unassigned Property",
        contractor: s.contractors?.name || "Unassigned",
        status: s.schedule_status || "Scheduled",
        assignmentId: s.assignment_id,
        tenantId,
        propertyId: s.property_id,
        requestId,
        source: "maintenance_request",
      };
    });
  }

  // ================= ESTIMATES =================

export async function getEstimates() {
  try {
    const { data, error } = await supabase
      .from("service_document")
      .select(`
        document_id,
        service_request_id,
        document_name,
        document_url,
        document_status,
        uploaded_date,
        contractors (name)
      `)
      .eq("document_type", "Estimate")
      .order("uploaded_date", { ascending: false });

    if (error) throw error;

    return (data || []).map((e: any) => ({
      id: `E-${e.document_id}`,
      request: `SR-${e.service_request_id}`,
      contractor: e.contractors?.name || "Unknown Contractor",
      amount: 0,
      status: e.document_status || "Pending",
      submitted: e.uploaded_date ? new Date(e.uploaded_date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      documentUrl: e.document_url,
      documentName: e.document_name,
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
      .from("service_document")
      .update({ document_status: status })
      .eq("document_id", numericId)
      .select();

    if (error) {
      console.error("Error updating estimate status:", error);
      throw error;
    }

    if (data && data.length > 0 && status === "Approved") {
      const doc = data[0];
      await supabase
        .from("contractor_assignment")
        .update({ assignment_status: "Accepted" })
        .eq("service_request_id", doc.service_request_id)
        .eq("contractor_id", doc.contractor_id);
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
      .from("payment_management")
      .select(`
        payment_management_id,
        service_request_id,
        contractor_id,
        landlord_id,
        tenant_id,
        property_id,
        payment_amount,
        payment_method,
        payment_reference,
        payment_status,
        payment_date,
        receipt_document,
        service_request_management (request_category),
        properties (property_name),
        tenant (first_name, last_name),
        contractors (name),
        landlord:users!landlord_id (name)
      `)
      .order("payment_management_id", { ascending: false });

      if (error) {
        console.error("Error fetching invoices:", error);
        return [];
      }

    return (data || []).map((p: any) => ({
      id: `INV-${p.payment_management_id}`,
      request: p.service_request_id ? `SR-${p.service_request_id}` : "General Billing",
      amount: Number(p.payment_amount || 0),
      status: p.payment_status || "Pending",
      issued: p.payment_date ? new Date(p.payment_date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      due: p.payment_date ? new Date(new Date(p.payment_date).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      reason: p.payment_method ? `Method: ${p.payment_method} | Ref: ${p.payment_reference || "—"}` : "",
      method: p.payment_method,
      reference: p.payment_reference,
      receipt: p.receipt_document,
      title: p.service_request_management?.request_category || "Maintenance Invoice",
      tenantId: p.tenant_id,
      propertyId: p.property_id,
      rawId: p.payment_management_id,
      source: "invoices",
      propertyName: p.properties?.property_name || "General Billing",
      tenantName: p.tenant ? `${p.tenant.first_name || ""} ${p.tenant.last_name || ""}`.trim() : "General Tenant",
      landlordName: p.landlord?.name || "General Landlord",
      contractorName: p.contractors?.name || "General Contractor",
    }));
  } catch (err) {
    console.error("Exception fetching invoices:", err);
    return [];
  }
}

export async function updateInvoiceStatus(id: string, payload: { status: string; reason?: string }) {
  try {
    const numericId = parseInt(id.replace("INV-", ""), 10);
    const updatePayload: any = { payment_status: payload.status };
    if (payload.reason) {
      const methodMatch = payload.reason.match(/Method:\s*([^|]+)/i);
      const refMatch = payload.reason.match(/Ref:\s*(.+)/i);
      if (methodMatch) updatePayload.payment_method = methodMatch[1].trim();
      if (refMatch) updatePayload.payment_reference = refMatch[1].trim();
    }

    const { data, error } = await supabase
      .from("payment_management")
      .update(updatePayload)
      .eq("payment_management_id", numericId)
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

async function updateRentPaymentById(rawId: string | number | null | undefined, payload: Record<string, unknown>) {
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
      .from("support_ticket")
      .select(`
        support_ticket_id,
        service_request_id,
        created_by,
        assigned_to,
        ticket_subject,
        ticket_description,
        ticket_priority,
        ticket_category,
        ticket_status,
        resolution_notes,
        created_at,
        updated_at,
        resolved_at,
        created_by_user:users!created_by (name),
        assigned_to_user:users!assigned_to (name)
      `)
      .order("support_ticket_id", { ascending: false });

    if (error) {
      console.error("Error fetching support tickets:", error);
      return [];
    }

    return (data || []).map((t: any) => ({
      id: `TK-${t.support_ticket_id}`,
      subject: t.ticket_subject,
      description: t.ticket_description || "",
      user: t.created_by_user?.name || "Reporter",
      role: t.ticket_category || "General Inquiry",
      priority: t.ticket_priority || "Medium",
      status: t.ticket_status || "Open",
      created: t.created_at ? new Date(t.created_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      assignedTo: t.assigned_to ? String(t.assigned_to) : "",
      assignedToName: t.assigned_to_user?.name || "",
      resolutionNotes: t.resolution_notes || "",
      resolvedAt: t.resolved_at || "",
      updatedAt: t.updated_at || "",
      serviceRequestId: t.service_request_id || null,
    }));
  } catch (err) {
    console.error("Exception fetching support tickets:", err);
    return [];
  }
}

export async function createSupportTicket(payload: {
  created_by: number;
  service_request_id?: number | null;
  ticket_subject: string;
  ticket_description: string;
  ticket_priority: string;
  ticket_category: string;
}) {
  try {
    const { data, error } = await supabase
      .from("support_ticket")
      .insert([
        {
          created_by: payload.created_by,
          service_request_id: payload.service_request_id || null,
          ticket_subject: payload.ticket_subject,
          ticket_description: payload.ticket_description,
          ticket_priority: payload.ticket_priority,
          ticket_category: payload.ticket_category,
          ticket_status: "Open",
          created_at: new Date().toISOString(),
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

export async function updateSupportTicket(
  id: string,
  payload: {
    ticket_status: string;
    resolution_notes?: string;
    assigned_to?: number | null;
  }
) {
  try {
    const numericId = parseInt(id.replace("TK-", ""), 10);
    const updatePayload: any = {
      ticket_status: payload.ticket_status,
      updated_at: new Date().toISOString(),
    };
    if (payload.resolution_notes !== undefined) {
      updatePayload.resolution_notes = payload.resolution_notes;
    }
    if (payload.assigned_to !== undefined) {
      updatePayload.assigned_to = payload.assigned_to;
    }
    if (payload.ticket_status === "Resolved") {
      updatePayload.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("support_ticket")
      .update(updatePayload)
      .eq("support_ticket_id", numericId)
      .select();

    if (error) {
      console.error("Error updating support ticket:", error);
      throw error;
    }
    return data;
  } catch (err) {
    console.error("Exception updating support ticket:", err);
    throw err;
  }
}

export async function deleteSupportTicket(id: string) {
  try {
    const numericId = parseInt(id.replace("TK-", ""), 10);
    const { error } = await supabase
      .from("support_ticket")
      .delete()
      .eq("support_ticket_id", numericId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("Exception deleting support ticket:", err);
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
    const { data, error } = await supabase
      .from("contractors")
      .insert([
        {
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          company_name: payload.companyName || payload.name,
          trade: payload.trade || "General",
          available: payload.available ?? true,
          jobs_completed: 0,
          rating: 5.0,
        },
      ])
      .select();

    if (error) {
      console.error("Error creating contractor record:", error);
      throw error;
    }

    const c = data[0];
    return {
      id: `C-${c.contractor_id}`,
      contractorId: `C-${c.contractor_id}`,
      name: c.name,
      companyName: c.company_name,
      trade: c.trade,
      specialization: c.trade,
      rating: Number(c.rating),
      jobs: c.jobs_completed,
      available: c.available,
      email: c.email,
      phone: c.phone,
    };
  } catch (err) {
    console.error("Exception creating contractor:", err);
    throw err;
  }
}

export async function assignContractor(payload: {
  service_request_id: number;
  contractor_id: number;
  remarks?: string;
}) {
  try {
    const { data, error } = await supabase
      .from("contractor_assignment")
      .insert([
        {
          service_request_id: payload.service_request_id,
          contractor_id: payload.contractor_id,
          service_admin_id: 1,
          landlord_id: 4,
          assigned_date: new Date().toISOString(),
          assignment_status: "Assigned",
          remarks: payload.remarks || "",
        },
      ])
      .select();

    if (error) {
      console.error("Error creating contractor assignment:", error);
      throw error;
    }

    await supabase
      .from("service_request_management")
      .update({ contractor_id: payload.contractor_id, request_status: "Assigned" })
      .eq("service_request_id", payload.service_request_id);

    return data;
  } catch (err) {
    console.error("Exception assigning contractor:", err);
    throw err;
  }
}

export async function createAppointment(payload: any) {
  // Try the new Service Admin (service_schedule) flow first if it's a maintenance request
  if (payload.service_request_source === "maintenance_request") {
    try {
      let assignmentId = null;
      const { data: assignData } = await supabase
        .from("contractor_assignment")
        .select("assignment_id")
        .eq("service_request_id", payload.service_request_id)
        .eq("contractor_id", payload.contractor_id)
        .limit(1);

      if (assignData && assignData.length > 0) {
        assignmentId = assignData[0].assignment_id;
      } else {
        const { data: newAssign, error: assignErr } = await supabase
          .from("contractor_assignment")
          .insert([
            {
              service_request_id: payload.service_request_id,
              contractor_id: payload.contractor_id,
              service_admin_id: 1,
              landlord_id: 4,
              assigned_date: new Date().toISOString(),
              assignment_status: "Assigned",
            },
          ])
          .select();

        if (assignErr) throw assignErr;
        assignmentId = newAssign[0].assignment_id;
      }

      const { data: srmData } = await supabase
        .from("service_request_management")
        .select("property_id")
        .eq("service_request_id", payload.service_request_id)
        .single();

      const propertyId = srmData ? srmData.property_id : 1;

      const { data, error } = await supabase
        .from("service_schedule")
        .insert([
          {
            assignment_id: assignmentId,
            contractor_id: payload.contractor_id,
            service_admin_id: 1,
            property_id: propertyId,
            service_date: payload.appointment_date,
            start_time: payload.appointment_time,
            notes: payload.title,
            schedule_status: "Scheduled",
          },
        ])
        .select()
        .single();

      if (!error) return data;
    } catch (e) {
      console.warn("New service_schedule appointment failed, falling back to legacy:", e);
    }
  }

  // Legacy fallback flow
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

// ================= REALTORS =================

  export async function getRealtors() {
    const { data, error } = await supabase
        .from("realtors")
        .select("*")
        .order("realtor_id", { ascending: true });

    if(error) throw error;

    return (data || []).map((realtor: any) => ({
      ...realtor,
      id: realtor.realtor_id,
      realtorName: realtor.realtor_name || realtor.name,
      agencyName: realtor.agency_name,
      phone: realtor.mobile_number || realtor.phone,
    }));
  }

  export async function createRealtor(payload: {
    name: string;
    email: string;
    phone: string;
    agencyName?: string;
  }) {
    const { data, error } = await supabase
      .from("realtors")
      .insert({
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        agency_name: payload.agencyName,
      })
      .select();

    if (error) throw error;

    return data;
  }

export async function getRealtorPropertyListings() {
  const { data, error } = await supabase
    .from("realtor_property_listing")
    .select("*");

  if (error) throw error;
  return data || [];
}

export async function getTenantOnboardingRecords() {
  const { data, error } = await supabase
    .from("tenant_onboarding")
    .select("*")
    .order("onboarding_id", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getPropertyReadinessRecords() {
  const { data, error } = await supabase
    .from("property_readiness")
    .select("*")
    .order("readiness_id", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getRealtorCommunications() {
  const { data, error } = await supabase
    .from("realtor_communication")
    .select("*")
    .order("communication_date", { ascending: false });

  if (error) throw error;
  return data || [];
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

  export async function updateAppointmentDateTime(
    id: string,
    payload: {
      appointment_date: string;
      appointment_time: string;
    },
  ) {
    const numericId = parsePrefixedId(id, "A-");
    
    try {
      const { data, error } = await supabase
        .from("service_schedule")
        .update({
          service_date: payload.appointment_date,
          start_time: payload.appointment_time,
          end_time: payload.appointment_time,
        })
        .eq("schedule_id", numericId)
        .select()
        .single();

      if (!error) return data;
    } catch (e) {
      console.warn("service_schedule reschedule failed, falling back:", e);
    }

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
  try {
    const { data, error } = await supabase
      .from("service_document")
      .insert([
        {
          service_request_id: payload.service_request_id,
          contractor_id: payload.contractor_id,
          service_admin_id: 1,
          document_type: "Estimate",
          document_name: `Estimate Quote - INR ${payload.estimated_cost}`,
          document_url: "https://czgwxokoxjkkqonpkgyl.supabase.co/storage/v1/object/public/service-documents/sample_estimate.pdf",
          document_status: "Pending",
          uploaded_by: "Contractor",
          uploaded_date: new Date().toISOString(),
        },
      ])
      .select();

    if (error) throw error;
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
  const todayStr = new Date().toISOString().split("T")[0];

  try {
    const [requestsRes, contractorsRes, activeRequestsRes, appointmentsRes] = await Promise.all([
      supabase.from("service_request_management").select("request_status, assigned_date"),
      supabase.from("contractors").select("contractor_id, name, email, trade, rating, available").limit(5),
      supabase.from("service_request_management").select(`
        service_request_id,
        request_category,
        priority,
        request_status,
        properties (property_name),
        tenant (first_name, last_name),
        contractors (name)
      `).order("service_request_id", { ascending: false }).limit(5),
      supabase.from("service_schedule").select(`
        schedule_id,
        notes,
        service_date,
        start_time,
        schedule_status,
        properties (property_name),
        contractors (name)
      `).eq("service_date", todayStr)
    ]);

    if (requestsRes.error) {
      console.error("Error loading dashboard requests:", requestsRes.error);
      throw requestsRes.error;
    }
    if (contractorsRes.error) {
      console.error("Error loading dashboard contractors:", contractorsRes.error);
      throw contractorsRes.error;
    }
    if (activeRequestsRes.error) {
      console.error("Error loading dashboard active requests:", activeRequestsRes.error);
      throw activeRequestsRes.error;
    }
    if (appointmentsRes.error) {
      console.error("Error loading dashboard schedule appointments:", appointmentsRes.error);
      throw appointmentsRes.error;
    }

    const allRequests = requestsRes.data || [];
    const dbContractors = contractorsRes.data || [];
    const activeRequests = activeRequestsRes.data || [];
    const dbAppointments = appointmentsRes.data || [];

    // Calculate Stat Cards
    const totalRequests = allRequests.length;
    const pending = allRequests.filter(r => r.request_status === "Pending").length;
    const assigned = allRequests.filter(r => r.request_status === "Assigned" || r.request_status === "In Progress").length;
    const completed = allRequests.filter(r => r.request_status === "Completed" || r.request_status === "Resolved").length;

    // Calculate last 7 days chart
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const requestsSeries = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = daysOfWeek[d.getDay()];
      const dateStr = d.toISOString().split("T")[0];
      
      const createdCount = allRequests.filter(r => {
        if (!r.assigned_date) return false;
        return r.assigned_date.startsWith(dateStr);
      }).length;

      const completedCount = allRequests.filter(r => {
        if (!r.assigned_date) return false;
        return r.assigned_date.startsWith(dateStr) && (r.request_status === "Completed" || r.request_status === "Resolved");
      }).length;

      requestsSeries.push({
        day: dayName,
        created: createdCount,
        completed: completedCount
      });
    }

    // Format Top Contractors
    const formattedContractors = dbContractors.map(c => ({
      id: `C-${c.contractor_id}`,
      name: c.name,
      email: c.email || "",
      status: c.available ? "Active" : "Busy",
      trade: c.trade || "General",
      rating: c.rating ? Number(c.rating).toFixed(1) : "5.0",
      available: c.available ?? true
    }));

    // Format Active Service Requests
    const formattedActiveRequests = activeRequests.map((r: any) => ({
      id: `SR-${r.service_request_id}`,
      title: r.request_category || "Maintenance Task",
      priority: r.priority || "Medium",
      status: r.request_status || "Pending",
      property: r.properties?.property_name || "—",
      tenant: r.tenant ? `${r.tenant.first_name || ""} ${r.tenant.last_name || ""}`.trim() : "—",
      contractor: r.contractors?.name || null
    }));

    // Format Appointments
    const formattedAppointments = dbAppointments.map((a: any) => ({
      id: `A-${a.schedule_id}`,
      title: a.notes || "Service Appointment",
      date: a.service_date,
      time: a.start_time ? a.start_time.slice(0, 5) : "12:00",
      property: a.properties?.property_name || "—",
      contractor: a.contractors?.name || "—",
      status: a.schedule_status || "Scheduled"
    }));

    return {
      stats: {
        total: totalRequests,
        pending: pending,
        assigned: assigned,
        completed: completed,
      },
      requestsSeries,
      contractors: formattedContractors,
      activeRequests: formattedActiveRequests,
      appointments: formattedAppointments
    };
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
      .select("property_name, address")
      .eq("property_id", lease.property_id)
      .maybeSingle();

    if (property) {
      property_name = property.property_name || null;
      property_address = property.address || null;
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
    const propertyMap = new Map<
    number,
    {
      property_name?: string;
      address?: string;
    }
  >();

  if (propertyIds.length > 0) {
    const { data: properties } = await supabase
      .from("properties")
      .select("property_id, property_name, address")
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
        propertyAddress: property?.address || "",
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
        id: doc.document_id,
        name: `${doc.document_type || "Document"}${doc.document_number ? ` · ${doc.document_number}` : ""}`,
        type: doc.document_type || "Document",
        document_number: doc.document_number || "",
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

  export async function uploadTenantDocument(payload: {
    tenant_id: number;
    document_type: string;
    document_number?: string;
    document_file: string; // The URL from supabase storage
  }) {
    const { data, error } = await supabase
      .from("tenant_document")
      .insert([
        {
          tenant_id: payload.tenant_id,
          document_type: payload.document_type,
          document_number: payload.document_number || null,
          document_file: payload.document_file,
          verification_status: "Pending",
          uploaded_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) throw error;
    return data;
  }

  export async function deleteTenantDocument(document_id: number) {
    const { error } = await supabase
      .from("tenant_document")
      .delete()
      .eq("document_id", document_id);
    
    if (error) throw error;
  }

  export async function getTenantServiceRequests(tenantId: number, legacyTenantId?: number | null) {
    const all = await getServiceRequests();
    const allowedTenantIds = new Set([tenantId, legacyTenantId || tenantId]);
    return all.filter((request) => allowedTenantIds.has(request.tenantId));
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
    const { data: existing } = await supabase
      .from("favorite_property")
      .select("favorite_id")
      .eq("tenant_id", payload.tenant_id)
      .eq("property_id", payload.property_id)
      .maybeSingle();

    if (existing) {
      return existing; // already exists
    }

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

  export async function getTenantInquiries(tenantId: number) {
    try {
      const { data, error } = await supabase
        .from("property_inquiry")
        .select(`
          inquiry_id,
          tenant_id,
          property_id,
          landlord_id,
          inquiry_message,
          inquiry_status,
          inquiry_date,
          landlord_reply,
          properties (property_name)
        `)
        .eq("tenant_id", tenantId)
        .order("inquiry_date", { ascending: false });

      if (error && !isSupabaseSchemaError(error)) {
        console.error("Error fetching tenant inquiries:", error);
      }
      
      return (data || []).map((inq: any) => ({
        id: `INQ-${inq.inquiry_id}`,
        rawId: inq.inquiry_id,
        propertyId: inq.property_id,
        propertyName: inq.properties?.property_name || "Unknown Property",
        message: inq.inquiry_message || "",
        status: inq.inquiry_status || "Pending",
        date: inq.inquiry_date ? new Date(inq.inquiry_date).toLocaleDateString() : "",
        reply: inq.landlord_reply || null,
      }));
    } catch (err) {
      return [];
    }
  }

  export async function getTenantVisits(tenantId: number) {
    try {
      const { data, error } = await supabase
        .from("visit_schedule")
        .select(`
          visit_id,
          tenant_id,
          property_id,
          landlord_id,
          visit_date,
          visit_time,
          visit_status,
          remarks,
          properties (property_name)
        `)
        .eq("tenant_id", tenantId)
        .order("visit_date", { ascending: false });

      if (error && !isSupabaseSchemaError(error)) {
        console.error("Error fetching tenant visits:", error);
      }
      
      return (data || []).map((v: any) => ({
        id: `VS-${v.visit_id}`,
        rawId: v.visit_id,
        propertyId: v.property_id,
        propertyName: v.properties?.property_name || "Unknown Property",
        date: v.visit_date || "",
        time: v.visit_time || "",
        status: v.visit_status || "Pending",
        remarks: v.remarks || "",
      }));
    } catch (err) {
      return [];
    }
  }

  export async function cancelVisitRequest(visitId: number) {
    const { data, error } = await supabase
      .from("visit_schedule")
      .update({ visit_status: "Cancelled" })
      .eq("visit_id", visitId)
      .select();
    if (error) throw error;
    return data;
  }

  export async function rescheduleVisitRequest(visitId: number, date: string, time: string) {
    const { data, error } = await supabase
      .from("visit_schedule")
      .update({ visit_date: date, visit_time: time, visit_status: "Pending" })
      .eq("visit_id", visitId)
      .select();
    if (error) throw error;
    return data;
  }

  export async function createVisitSchedule(payload: any) {
    const { data, error } = await supabase
      .from("visit_schedule")
      .insert([
        {
          tenant_id: payload.tenant_id,
          property_id: payload.property_id,
          landlord_id: payload.landlord_id,
          visit_date: payload.visit_date,
          visit_time: payload.visit_time,
          visit_status: "Pending",
          remarks: payload.remarks || "Property visit",
        }
      ])
      .select();
    if (error) throw error;
    return data;
  }

  export async function removeFavoriteProperty(payload: { tenant_id: number; property_id: number }) {
    const { error } = await supabase
      .from("favorite_property")
      .delete()
      .eq("tenant_id", payload.tenant_id)
      .eq("property_id", payload.property_id);

    if (error) throw error;
  }
  
  export async function getFavoriteProperties(tenant_id: number) {
    const { data, error } = await supabase
      .from("favorite_property")
      .select("*")
      .eq("tenant_id", tenant_id);
    
    if (error) throw error;
    return data || [];
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

  export async function getTenantRentalApplications(tenantId: number) {
    try {
      const { data, error } = await supabase
        .from("rental_application")
        .select(`
          application_id,
          tenant_id,
          property_id,
          landlord_id,
          application_date,
          expected_move_in,
          occupation,
          monthly_income,
          application_status,
          remarks,
          properties (property_name)
        `)
        .eq("tenant_id", tenantId)
        .order("application_date", { ascending: false });

      if (error && !isSupabaseSchemaError(error)) {
        console.error("Error fetching tenant rental applications:", error);
      }
      
      return (data || []).map((app: any) => ({
        id: `APP-${app.application_id}`,
        rawId: app.application_id,
        propertyId: app.property_id,
        propertyName: app.properties?.property_name || "Unknown Property",
        date: app.application_date ? new Date(app.application_date).toLocaleDateString() : "",
        expectedMoveIn: app.expected_move_in || "",
        occupation: app.occupation || "",
        monthlyIncome: app.monthly_income || 0,
        status: app.application_status || "Pending",
        remarks: app.remarks || "",
      }));
    } catch (err) {
      return [];
    }
  }

  export async function updateRentalApplication(applicationId: number, payload: any) {
    const { data, error } = await supabase
      .from("rental_application")
      .update(payload)
      .eq("application_id", applicationId)
      .select();
    if (error) throw error;
    return data;
  }

  export async function cancelRentalApplication(applicationId: number) {
    const { data, error } = await supabase
      .from("rental_application")
      .update({ application_status: "Cancelled" })
      .eq("application_id", applicationId)
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

// ================= CONTRACTOR DASHBOARD FUNCTIONS (RESTORED) =================
export async function getContractorProfile(contractorId: number) {
  const { data, error } = await supabase
    .from("Contractor")
    .select(`
      *,
      ContractorProfile(*)
    `)
    .eq("contractor_id", contractorId)
    .single();

  if (error) throw error;

  return {
    ...data,
    ...(Array.isArray(data.ContractorProfile)
      ? data.ContractorProfile[0]
      : data.ContractorProfile),
  };
}

export async function getContractorServiceRequests(contractorId: number) {
  const { data, error } = await supabase
    .from("contractor_service_request")
    .select("*")
    .eq("contractor_id", contractorId)
    .order("assigned_date", { ascending: false });

  if (error) throw error;

  return data || [];
}

export async function getContractorAppointments(contractorId: number) {
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("contractor_id", contractorId)
    .order("appointment_date", { ascending: true });

  if (error) throw error;

  return data || [];
}

export async function getContractorEstimates(contractorId: number) {
  const { data, error } = await supabase
    .from("estimates")
    .select("*")
    .eq("contractor_id", contractorId)
    .order("submitted_date", { ascending: false });

  if (error) throw error;

  return data || [];
}

export async function getContractorInvoices(contractorId: number) {
  const { data, error } = await supabase
    .from("payment_management")
    .select("*")
    .eq("contractor_id", contractorId)
    .order("payment_date", { ascending: false });

  if (error) throw error;

  return (data || []).map((payment: any) => ({
    invoice_id: payment.payment_management_id,
    quotation_id: payment.service_request_id,
    contractor_id: payment.contractor_id,
    invoice_number: payment.payment_reference || `INV-${payment.payment_management_id}`,
    invoice_amount: Number(payment.payment_amount || 0),
    tax_amount: 0,
    invoice_file: payment.receipt_document,
    completion_notes: payment.payment_method
      ? `Payment method: ${payment.payment_method}`
      : null,
    invoice_status: payment.payment_status || "Pending",
    uploaded_at: payment.payment_date,
  }));
}

export async function getContractorQuotations(contractorId: number) {
  const { data, error } = await supabase
    .from("contractor_quotation")
    .select("*")
    .eq("contractor_id", contractorId)
    .order("submitted_at", { ascending: false });

  if (error) throw error;

  return data || [];
}

export async function getContractorAvailability(contractorId: number) {

  const { data, error } = await supabase
    .from("contractor_availability")
    .select("*")
    .eq("contractor_id", contractorId);

  if (error) throw error;

  return data;
}

export async function getContractorAssignments() {
  try {
    const { data, error } = await supabase
      .from("contractor_assignment")
      .select(`
        *,
        contractors (name, company_name, trade),
        service_request_management (
          request_category,
          properties (property_name),
          tenant (first_name, last_name)
        )
      `)
      .order("assigned_date", { ascending: false });

    if (error) {
      console.error("Error fetching contractor assignments:", error);
      return [];
    }

    return (data || []).map((a: any) => ({
      assignmentId: a.assignment_id,
      requestId: a.service_request_id,
      contractorId: a.contractor_id,
      assignedBy: a.service_admin_id,
      status: a.assignment_status || "Assigned",
      assignedDate: a.assigned_date,
      acceptedDate: a.accepted_date,
      remarks: a.remarks || "",
      contractorName: a.contractors?.company_name || a.contractors?.name || "Unknown Contractor",
      contractorTrade: a.contractors?.trade || "General",
      requestCategory: a.service_request_management?.request_category || "General Maintenance",
      propertyName: a.service_request_management?.properties?.property_name || "—",
      tenantName: a.service_request_management?.tenant 
        ? `${a.service_request_management.tenant.first_name || ""} ${a.service_request_management.tenant.last_name || ""}`.trim()
        : "—"
    }));
  } catch (err) {
    console.error("Exception in getContractorAssignments:", err);
    return [];
  }
}

export async function updateAssignmentStatus(assignmentId: number, status: string) {
  try {
    const updates: any = { assignment_status: status };
    if (status === "Accepted") {
      updates.accepted_date = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("contractor_assignment")
      .update(updates)
      .eq("assignment_id", assignmentId)
      .select()
      .single();

    if (error) throw error;

    let reqStatus = "Assigned";
    if (status === "Accepted") {
      reqStatus = "In Progress";
    } else if (status === "Rejected") {
      reqStatus = "Pending";
    } else if (status === "Completed") {
      reqStatus = "Completed";
    }

    const srmPayload: any = { request_status: reqStatus };
    if (status === "Rejected") {
      srmPayload.contractor_id = null;
    }
    if (status === "Completed") {
      srmPayload.completed_date = new Date().toISOString();
    }

    await supabase
      .from("service_request_management")
      .update(srmPayload)
      .eq("service_request_id", data.service_request_id);

    return data;
  } catch (err) {
    console.error("Exception in updateAssignmentStatus:", err);
    throw err;
  }
}

export async function reassignContractor(payload: {
  assignment_id: number;
  contractor_id: number;
  remarks?: string;
}) {
  try {
    const { data, error } = await supabase
      .from("contractor_assignment")
      .update({
        contractor_id: payload.contractor_id,
        assignment_status: "Assigned",
        assigned_date: new Date().toISOString(),
        accepted_date: null,
        remarks: payload.remarks || "",
      })
      .eq("assignment_id", payload.assignment_id)
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from("service_request_management")
      .update({ contractor_id: payload.contractor_id, request_status: "Assigned" })
      .eq("service_request_id", data.service_request_id);

    return data;
  } catch (err) {
    console.error("Exception in reassignContractor:", err);
    throw err;
  }
}

export async function updateAppointmentStatus(
  id: string,
  payload: {
    status: string;
    notes?: string;
  }
) {
  try {
    const numericId = parsePrefixedId(id, "A-");
    const mapped: any = { schedule_status: payload.status };
    if (payload.notes !== undefined) mapped.notes = payload.notes;

    const { data, error } = await supabase
      .from("service_schedule")
      .update(mapped)
      .eq("schedule_id", numericId)
      .select()
      .single();

    if (error) {
      console.warn("service_schedule update status failed, trying legacy:", error);
      const tenantRes = await supabase
        .from("visit_schedule")
        .update({ visit_status: payload.status, remarks: payload.notes || "Property visit" })
        .eq("visit_id", numericId)
        .select()
        .single();
      if (!tenantRes.error) return tenantRes.data;

      const apptRes = await supabase
        .from("appointments")
        .update({ status: payload.status })
        .eq("appointment_id", numericId)
        .select()
        .single();
      if (apptRes.error) throw apptRes.error;
      return apptRes.data;
    }
    return data;
  } catch (err) {
    console.error("Exception in updateAppointmentStatus:", err);
    throw err;
  }
}

export async function deleteAppointment(id: string) {
  try {
    const numericId = parsePrefixedId(id, "A-");
    
    const { error } = await supabase
      .from("service_schedule")
      .delete()
      .eq("schedule_id", numericId);

    if (error) {
      console.warn("service_schedule delete failed, trying legacy:", error);
      const tenantRes = await supabase
        .from("visit_schedule")
        .delete()
        .eq("visit_id", numericId);
      if (tenantRes.error) {
        const apptRes = await supabase
          .from("appointments")
          .delete()
          .eq("appointment_id", numericId);
        if (apptRes.error) throw apptRes.error;
      }
    }
    return { success: true };
  } catch (err) {
    console.error("Exception in deleteAppointment:", err);
    throw err;
  }
}

export async function getServiceDocuments() {
  try {
    const { data, error } = await supabase
      .from("service_document")
      .select(`
        document_id,
        service_request_id,
        property_id,
        contractor_id,
        uploaded_by,
        document_name,
        document_type,
        document_url,
        document_size,
        uploaded_at,
        properties (property_name),
        contractors (name),
        users (name)
      `)
      .order("uploaded_at", { ascending: false });

    if (error) throw error;

    return (data || []).map((d: any) => ({
      id: d.document_id,
      requestId: d.service_request_id,
      propertyId: d.property_id,
      contractorId: d.contractor_id,
      uploadedBy: d.uploaded_by,
      name: d.document_name,
      type: d.document_type || "Other",
      url: d.document_url,
      size: d.document_size || 0,
      uploadedAt: d.uploaded_at,
      propertyName: d.properties?.property_name || "General Property",
      contractorName: d.contractors?.name || "General Contractor",
      uploaderName: d.users?.name || "System Admin",
    }));
  } catch (err) {
    console.error("Exception fetching service documents:", err);
    return [];
  }
}

export async function createServiceDocument(payload: {
  service_request_id?: number | null;
  property_id?: number | null;
  contractor_id?: number | null;
  uploaded_by: number;
  document_name: string;
  document_type: string;
  document_url: string;
  document_size: number;
}) {
  try {
    const { data, error } = await supabase
      .from("service_document")
      .insert([
        {
          service_request_id: payload.service_request_id || null,
          property_id: payload.property_id || null,
          contractor_id: payload.contractor_id || null,
          uploaded_by: payload.uploaded_by,
          document_name: payload.document_name,
          document_type: payload.document_type,
          document_url: payload.document_url,
          document_size: payload.document_size,
          uploaded_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) throw error;
    return data[0];
  } catch (err) {
    console.error("Exception creating service document:", err);
    throw err;
  }
}

export async function updateServiceDocument(
  id: number,
  payload: {
    document_name?: string;
    service_request_id?: number | null;
    contractor_id?: number | null;
    property_id?: number | null;
  }
) {
  try {
    const { data, error } = await supabase
      .from("service_document")
      .update(payload)
      .eq("document_id", id)
      .select();

    if (error) throw error;
    return data[0];
  } catch (err) {
    console.error("Exception updating service document:", err);
    throw err;
  }
}

export async function deleteServiceDocument(id: number) {
  try {
    const { error } = await supabase
      .from("service_document")
      .delete()
      .eq("document_id", id);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("Exception deleting service document:", err);
    throw err;
  }
}

export async function getServiceCommunications() {
  try {
    const { data, error } = await supabase
      .from("service_communication")
      .select(`
        communication_id,
        service_request_id,
        sender_id,
        receiver_id,
        communication_type,
        message,
        attachment_url,
        status,
        sent_at,
        read_at,
        sender:users!sender_id (name),
        receiver:users!receiver_id (name)
      `)
      .order("sent_at", { ascending: false });

    if (error) throw error;

    return (data || []).map((c: any) => ({
      id: c.communication_id,
      requestId: c.service_request_id,
      senderId: c.sender_id,
      receiverId: c.receiver_id,
      type: c.communication_type || "Chat",
      message: c.message || "",
      attachmentUrl: c.attachment_url || "",
      status: c.status || "Sent",
      sentAt: c.sent_at,
      readAt: c.read_at,
      senderName: c.sender?.name || "System Admin",
      receiverName: c.receiver?.name || "Unknown User",
    }));
  } catch (err) {
    console.error("Exception fetching service communications:", err);
    return [];
  }
}

export async function createServiceCommunication(payload: {
  service_request_id: number;
  sender_id: number;
  receiver_id: number;
  communication_type: string;
  message: string;
  attachment_url?: string;
  status?: string;
}) {
  try {
    const { data, error } = await supabase
      .from("service_communication")
      .insert([
        {
          service_request_id: payload.service_request_id,
          sender_id: payload.sender_id,
          receiver_id: payload.receiver_id,
          communication_type: payload.communication_type,
          message: payload.message,
          attachment_url: payload.attachment_url || "",
          status: payload.status || "Sent",
          sent_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) throw error;
    return data[0];
  } catch (err) {
    console.error("Exception creating service communication:", err);
    throw err;
  }
}

export async function updateServiceCommunication(
  id: number,
  payload: {
    message?: string;
    status?: string;
    read_at?: string | null;
  }
) {
  try {
    const { data, error } = await supabase
      .from("service_communication")
      .update(payload)
      .eq("communication_id", id)
      .select();

    if (error) throw error;
    return data[0];
  } catch (err) {
    console.error("Exception updating service communication:", err);
    throw err;
  }
}

export async function deleteServiceCommunication(id: number) {
  try {
    const { error } = await supabase
      .from("service_communication")
      .delete()
      .eq("communication_id", id);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("Exception deleting service communication:", err);
    throw err;
  }
}

function parsePropertySpecs(prop: any) { if (prop && prop.specifications) { try { const specs = JSON.parse(prop.specifications); prop.additionalInformationData = specs.property_additional_information || null; prop.parkingData = specs.property_parking || null; prop.availabilityData = specs.property_availability || null; prop.admin_approval = specs.admin_approval !== undefined ? specs.admin_approval : null; prop.property_verified = specs.property_verified !== undefined ? specs.property_verified : null; prop.featured_property = specs.featured_property !== undefined ? specs.featured_property : null; } catch (e) {} } return prop; } 
