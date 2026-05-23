const fs = require('fs');
try {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  envFile.split(/\r?\n/).forEach(line => {
    const idx = line.indexOf('=');
    if (idx > 0) {
      const k = line.substring(0, idx).trim();
      const v = line.substring(idx + 1).trim().replace(/^['"]|['"]$/g, '');
      process.env[k] = v;
    }
  });
} catch (e) {
  console.log('Error reading .env.local:', e.message);
}

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { data, error } = await supabase
    .from('cohorts')
    .select('id, title, pricing_type')
    .limit(1);
  
  if (error) {
    console.error('Error fetching pricing_type:', error);
  } else {
    console.log('Successfully fetched pricing_type column! Cohort data:', data);
  }
}
run();
