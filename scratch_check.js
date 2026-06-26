const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach((line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const parts = trimmed.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts
      .slice(1)
      .join('=')
      .trim()
      .replace(/^['"]|['"]$/g, '');
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  // Current time is 2026-05-29T19:14:55+05:30.
  // Let's filter by IST today: from 2026-05-29T00:00:00+05:30
  const startOfTodayIST = '2026-05-29T00:00:00+05:30';

  const { data: submissions, error } = await supabase
    .from('form_submissions')
    .select('*')
    .gte('created_at', startOfTodayIST)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching submissions:', error);
    return;
  }

  console.log(`\nFound ${submissions.length} submissions since ${startOfTodayIST}:`);
  submissions.forEach((sub, i) => {
    console.log(`[${i + 1}] ID: ${sub.id}`);
    console.log(`    Created At: ${sub.created_at}`);
    console.log(`    User Name: ${sub.user_name || sub.form_data?.name}`);
    console.log(`    User Email: ${sub.user_email || sub.form_data?.email}`);
    console.log(`    Phone: ${sub.form_data?.phone}`);
    console.log(`    Form/Cohort ID: ${sub.form_slug} / ${sub.cohort_id}`);
    console.log(`    Payment Status: ${sub.payment_status}`);
    console.log(`    Razorpay Payment ID: ${sub.razorpay_payment_id}`);
    console.log(`    Amount: ₹${sub.razorpay_amount ? sub.razorpay_amount / 100 : 'N/A'}`);
    console.log('---');
  });
}

check();
