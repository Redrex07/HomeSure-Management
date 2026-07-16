import fs from 'fs';

const openapi = JSON.parse(fs.readFileSync('scratch_openapi.json', 'utf-8'));
const definitions = openapi.definitions || {};

console.log("Top-level keys:", Object.keys(openapi));
console.log("Definitions keys count:", Object.keys(definitions).length);

const targetTables = [
  "users", "properties", "subscriptions", "invoices", "plans", 
  "realtors", "visit_schedule", "appointments", "lease_agreements", 
  "support_tickets", "contractors", "tenant"
];

for (const table of targetTables) {
  if (definitions[table]) {
    const props = definitions[table].properties || {};
    const cols = Object.keys(props).map(colName => {
      const prop = props[colName];
      return `${colName} (${prop.type})`;
    });
    console.log(`\nTable '${table}':`);
    console.log(cols.join(', '));
  } else {
    console.log(`\nTable '${table}' not found in OpenAPI definitions.`);
  }
}
