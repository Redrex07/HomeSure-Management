import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 'https://czgwxokoxjkkqonpkgyl.supabase.co';
const supabaseKey = 'sb_publishable_jj8zDSnN58sXynQag0bQLw_bUC0MDsp';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Testing connection...");
  const start = Date.now();
  const { data, error } = await supabase.from('properties').select('*');
  console.log(`Took ${Date.now() - start}ms`);
  
  if (error) {
    console.error("Error:", error);
  } else {
    console.log(`Got ${data?.length} properties`);
    console.log(data?.slice(0, 2));
  }
}

test();
