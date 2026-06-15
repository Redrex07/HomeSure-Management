import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 'https://czgwxokoxjkkqonpkgyl.supabase.co';
const supabaseKey = 'sb_publishable_jj8zDSnN58sXynQag0bQLw_bUC0MDsp';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Testing tenants...");
  const { data, error } = await supabase.from("tenant_onboarding").select("*");
  console.log("Tenants:", data?.length);
  if (error) console.error(error);
}

test();
