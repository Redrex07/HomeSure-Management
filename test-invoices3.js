import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://czgwxokoxjkkqonpkgyl.supabase.co",
  "sb_publishable_jj8zDSnN58sXynQag0bQLw_bUC0MDsp"
);

async function main() {
  const { data, error } = await supabase.rpc("get_invoices_columns"); 
  // wait, rpc might not exist. Let's just try to insert one invoice and see if it works, or just query with a wrong column to see the error.
  const { error: err2 } = await supabase.from("invoices").select("non_existent_col");
  console.log(err2);
}
main();
