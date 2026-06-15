import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 'https://czgwxokoxjkkqonpkgyl.supabase.co';
const supabaseKey = 'sb_publishable_jj8zDSnN58sXynQag0bQLw_bUC0MDsp';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("landlord_id", "2"); // String "2"
    
  console.log("With string '2':", data?.length);
  
  const { data: data2 } = await supabase
    .from("properties")
    .select("*")
    .eq("landlord_id", 2); // Number 2
    
  console.log("With number 2:", data2?.length);
}

test();
