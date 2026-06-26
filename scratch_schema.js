import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const tables = ["properties", "tenant_onboarding", "invoices"];
  for (const table of tables) {
    console.log(`\n--- Table: ${table} ---`);
    const { data, error } = await supabase.from(table).select("*").limit(1);
    if (error) {
      console.error(`Error fetching ${table}:`, error.message);
    } else if (data && data.length > 0) {
      console.log(Object.keys(data[0]).map(k => `${k}: ${data[0][k] === null ? 'null' : typeof data[0][k]}`));
      console.log("Sample:", data[0]);
    } else {
      console.log(`Table ${table} is empty.`);
    }
  }
}

checkSchema().catch(console.error);
