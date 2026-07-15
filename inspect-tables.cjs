const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://czgwxokoxjkkqonpkgyl.supabase.co";
const supabaseKey = "sb_publishable_jj8zDSnN58sXynQag0bQLw_bUC0MDsp";
const supabase = createClient(supabaseUrl, supabaseKey);

const tables = [
  "service_admin",
  "service_request_management",
  "warranty_validation",
  "contractor_assignment",
  "service_schedule",
  "payment_management",
  "service_document",
  "service_communication",
  "support_tickets"
];

async function checkTable(tableName) {
  console.log(`\n--------------------------------------------`);
  console.log(`Checking table: ${tableName}`);
  console.log(`--------------------------------------------`);
  
  // 1. Try to query a row
  const { data, error } = await supabase.from(tableName).select("*").limit(1);
  if (error) {
    console.log(`❌ Error querying table:`, error.message);
    return;
  }
  
  console.log(`✅ Table exists.`);
  if (data && data.length > 0) {
    console.log(`📋 Columns present:`, Object.keys(data[0]));
    console.log(`🔍 Sample row:`, JSON.stringify(data[0], null, 2));
  } else {
    console.log(`ℹ️ Table is empty. Triggering column schema error...`);
    const { error: err } = await supabase.from(tableName).select("non_existent_column_xyz_abc").limit(1);
    if (err) {
      console.log(`💡 DB Schema Error:`, err.message);
    }
  }
}

async function run() {
  for (const table of tables) {
    await checkTable(table);
  }
}

run();
