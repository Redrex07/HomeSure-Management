import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://czgwxokoxjkkqonpkgyl.supabase.co";
const supabaseKey = "sb_publishable_jj8zDSnN58sXynQag0bQLw_bUC0MDsp";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data, error } = await supabase.from('properties').select('*').limit(1);
  console.log("Error:", error);
  console.log("Data:", data);
}
checkSchema();
