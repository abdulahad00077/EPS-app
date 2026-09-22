require('dotenv').config({ path: 'd:/myWork/elegant/mobile/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('teachers').select('*');
  console.log(JSON.stringify(data, null, 2));
  if (error) console.error(error);
}
check();
