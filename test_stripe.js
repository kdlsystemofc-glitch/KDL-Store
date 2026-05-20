const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8');
const stripeKeyLine = env.split('\n').find(l => l.startsWith('STRIPE_SECRET_KEY='));
if (!stripeKeyLine) { console.error('No key'); process.exit(1); }
const stripeKey = stripeKeyLine.split('=')[1].trim().replace(/['"]+/g, '');

const stripe = require('stripe')(stripeKey);
(async () => {
  try {
    const subs = await stripe.subscriptions.list({ limit: 5 });
    console.log('Subscriptions found:', subs.data.length);
    for (const sub of subs.data) {
      console.log('---');
      console.log('SUB_ID:', sub.id);
      console.log('STATUS:', sub.status);
      console.log('METADATA:', sub.metadata);
      console.log('SCHEDULE ID:', sub.schedule);
      if (sub.schedule) {
         const sched = await stripe.subscriptionSchedules.retrieve(sub.schedule);
         console.log('SCHEDULE PHASES:', sched.phases.length);
         if (sched.phases.length > 1) {
            const price = sched.phases[1].items[0].price;
            console.log('PHASE 1 PRICE ID:', typeof price === 'string' ? price : price.id);
         }
      }
    }
  } catch(e) { console.error('Error:', e.message) }
})();
