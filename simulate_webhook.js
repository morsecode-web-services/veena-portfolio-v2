const crypto = require('crypto');
const fs = require('fs');

// Read secret manually for Node 18 compatibility
let secret = 'your_local_webhook_secret';
try {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  const secretLine = envFile.split('\n').find(line => line.startsWith('RAZORPAY_WEBHOOK_SECRET='));
  if (secretLine) {
    secret = secretLine.split('=')[1].trim();
  }
} catch (e) {
  console.log('Could not read .env.local, using default secret.');
}

// We generate a fake payment ID so it acts as a unique event
const fakePaymentId = `pay_sim_${Date.now()}`;

const payload = {
  event: "order.paid",
  payload: {
    payment: {
      entity: {
        id: fakePaymentId,
        order_id: "order_sim_12345",
        status: "captured",
        amount: 10000,
        email: "test@example.com",
        contact: "+919876543210"
      }
    },
    order: {
      entity: {
        id: "order_sim_12345",
        amount: 10000,
        status: "paid",
        notes: {
          name: "Local Test User",
          email: "test@example.com",
          phone: "+919876543210",
          cohortId: "e51726b8-eac3-4f0f-a062-42c1faf9f6a7",
          formSlug: "cohort_enrollment",
          telegram_chat_id: "-1003890349357"
        }
      }
    }
  }
};

const bodyString = JSON.stringify(payload);
const signature = crypto.createHmac('sha256', secret).update(bodyString).digest('hex');

console.log(`\n🚀 Simulating successful payment...`);
console.log(`Fake Payment ID: ${fakePaymentId}\n`);

fetch('http://localhost:3000/api/webhooks/razorpay', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-razorpay-signature': signature
  },
  body: bodyString
})
.then(res => res.json())
.then(data => {
  console.log('✅ Webhook Processed Successfully!');
  console.log('Response:', data);
  console.log(`\n🎯 TO SEE THE QR CODE IN YOUR BROWSER:`);
  console.log(`Go to: http://localhost:3000/cohorts?success=true&payment_id=${fakePaymentId}\n`);
})
.catch(err => console.error('❌ Simulation failed:', err));
