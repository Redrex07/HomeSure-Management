import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://czgwxokoxjkkqonpkgyl.supabase.co",
  "sb_publishable_jj8zDSnN58sXynQag0bQLw_bUC0MDsp"
);

async function main() {
  const { data, error } = await supabase.from("invoices").insert([{ id: "INV-1" }]).select();
  console.log("Error:", error);
}
main();
