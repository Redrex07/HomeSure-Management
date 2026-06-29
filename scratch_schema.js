import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://czgwxokoxjkkqonpkgyl.supabase.co";
const supabaseKey = "sb_publishable_jj8zDSnN58sXynQag0bQLw_bUC0MDsp";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  const payload = {
    landlord_id: "2",
    property_name: "Test Property",
    property_type: "Apartment",
    availability_status: "Available",
    Listing_date: new Date().toISOString(),
    Description: "Test",
    Category: "Residential",
  };
  const { data, error } = await supabase.from("properties").insert([payload]).select();
  console.log("Insert result:", data);
  console.log("Insert error:", error);
}
testInsert();
