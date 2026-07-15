const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://czgwxokoxjkkqonpkgyl.supabase.co";
const supabaseKey = "sb_publishable_jj8zDSnN58sXynQag0bQLw_bUC0MDsp";
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('maintenance_requests').select('*').limit(1);
  if (error) {
    console.log("❌ Error:", error.message);
  } else {
    console.log("✅ Success! Table 'maintenance_requests' exists.");
  }
}

check();
