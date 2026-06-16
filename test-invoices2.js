import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://czgwxokoxjkkqonpkgyl.supabase.co",
  "sb_publishable_jj8zDSnN58sXynQag0bQLw_bUC0MDsp"
);

async function main() {
  const { data, error } = await supabase.from("invoices").select("*").limit(1);
  console.log("Invoices:", data);
  if (error) console.error("Error:", error);
}
main();
