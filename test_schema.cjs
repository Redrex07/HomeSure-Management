const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const vars = {};
env.split('\n').forEach(line => {
  const parts = line.split('=');
  if(parts[0]) vars[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/"/g, '').replace(/'/g, '');
});

async function run() {
  const url = vars.VITE_SUPABASE_URL + '/rest/v1/?apikey=' + vars.VITE_SUPABASE_PUBLISHABLE_KEY;
  const res = await fetch(url);
  const data = await res.json();
  console.log('Response:', data);
}

run().catch(console.error);
