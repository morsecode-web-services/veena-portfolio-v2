const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env vars manually
const envPath = path.join(__dirname, '../.env.local');
const env = {};
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .forEach((line) => {
      const [key, ...val] = line.split('=');
      if (key) env[key.trim()] = val.join('=').trim();
    });
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function enableTwilio() {
  console.log('Fetching site config...');
  const { data, error } = await supabase
    .from('site_config')
    .select('*')
    .eq('id', '00000000-0000-0000-0000-000000000000')
    .single();

  if (error) {
    console.error('Error fetching config:', error);
    return;
  }

  const updatedData = {
    ...data.data,
    automation: {
      ...data.data?.automation,
      twilio_whatsapp_enabled: true,
    },
  };

  console.log('Updating config to enable Twilio WhatsApp...');
  const { error: updateError } = await supabase
    .from('site_config')
    .update({ data: updatedData })
    .eq('id', '00000000-0000-0000-0000-000000000000');

  if (updateError) {
    console.error('Update failed:', updateError);
  } else {
    console.log('✅ Twilio WhatsApp automation is now ENABLED in the database.');
  }
}

enableTwilio();
