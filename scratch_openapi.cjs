const fs = require('fs');

async function fetchSchema() {
  const url = process.env.VITE_SUPABASE_URL + '/rest/v1/?apikey=' + process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const res = await fetch(url);
  const data = await res.json();
  fs.writeFileSync('scratch_openapi.json', JSON.stringify(data, null, 2));
  console.log("Schema saved to scratch_openapi.json");
}

fetchSchema().catch(console.error);
