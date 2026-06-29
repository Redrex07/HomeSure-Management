import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://czgwxokoxjkkqonpkgyl.supabase.co";
const supabaseKey = "sb_publishable_jj8zDSnN58sXynQag0bQLw_bUC0MDsp";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBucket() {
  const { data, error } = await supabase.storage.from('property-videos').list();
  console.log("Videos bucket list error:", error);
  console.log("Videos bucket list data:", data);
}
testBucket();
