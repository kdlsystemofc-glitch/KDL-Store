const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
env.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [k, ...v] = line.split('=');
    process.env[k.trim()] = v.join('=').trim().replace(/^"|"$/g, '');
  }
});

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: subs } = await supabase.from('subscriptions').select('*').limit(10);
  console.log("Subscriptions:", subs.length);
  
  for (const sub of subs) {
    if (sub.stripe_subscription_id) {
      try {
        const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
        console.log(`\nSub ID: ${stripeSub.id}`);
        console.log(`Schedule: ${stripeSub.schedule}`);
        
        if (stripeSub.schedule) {
          const schedule = await stripe.subscriptionSchedules.retrieve(stripeSub.schedule);
          console.log(`Phases count: ${schedule.phases.length}`);
          schedule.phases.forEach((p, i) => {
            console.log(`  Phase ${i}: start=${p.start_date} end_date=${p.end_date}`);
            console.log(`  Items:`, p.items.map(item => item.price.id || item.price));
          });
        }
      } catch (e) {
        console.log(`Error retrieving ${sub.stripe_subscription_id}: ${e.message}`);
      }
    }
  }
}

check().catch(console.error);
