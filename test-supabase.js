const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  console.log('Fetching cohort details...');
  const { data: cohorts, error } = await supabase
    .from('cohorts')
    .select('*')
    .order('order_index', { ascending: true });
  
  if (error) {
    console.error('Error fetching cohorts:', error);
    return;
  }
  
  console.log(`Found ${cohorts.length} cohorts:`);
  cohorts.forEach((c, idx) => {
    console.log(`[${idx+1}] ID: ${c.id}`);
    console.log(`    Title: ${c.title}`);
    console.log(`    Status: ${c.status}`);
    console.log(`    Image URL: ${c.image_url}`);
    console.log(`    Price: ${c.price}`);
    console.log('---');
  });
}
run();
