
import { createClient } from "@supabase/supabase-js";
const supabaseUrl = "https://czgwxokoxjkkqonpkgyl.supabase.co";
const supabaseKey = "sb_publishable_jj8zDSnN58sXynQag0bQLw_bUC0MDsp";
const supabase = createClient(supabaseUrl, supabaseKey);
async function test() {
  const { data: all } = await supabase.from("properties").select("*");
  const { data: landlord } = await supabase.from("properties").select("*").eq("landlord_id", "2");
  console.log("All properties:", all?.length);
  console.log("Landlord properties:", landlord?.length);
}
test();

