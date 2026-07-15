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

async function probeTable(tableName) {
  console.log(`\n--------------------------------------------`);
  console.log(`Probing table: ${tableName}`);
  console.log(`--------------------------------------------`);
  
  // Try to insert a dummy object with random key to trigger a column error or success
  const { data, error } = await supabase.from(tableName).insert({}).select();
  if (error) {
    console.log(`❌ Probe insert returned error:`, error.message);
    if (error.details) console.log(`   Details:`, error.details);
    if (error.hint) console.log(`   Hint:`, error.hint);
  } else {
    console.log(`✅ Probe insert succeeded!`);
    console.log(`📋 Inserted row:`, JSON.stringify(data[0], null, 2));
    console.log(`📋 Column names:`, Object.keys(data[0]));
  }
}

async function run() {
  for (const table of tables) {
    await probeTable(table);
  }
}

run();
