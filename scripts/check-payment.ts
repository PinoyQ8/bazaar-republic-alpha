import axios from 'axios';
import * as dotenv from 'dotenv';
import * as https from 'https';

dotenv.config();

const PI_API_BASE = 'https://api.minepi.com/v2';
const PI_API_KEY = process.env.PI_API_KEY?.trim();

// Target Payment ID from CLI arg or fallback
const paymentId = process.argv[2] || 'luQpC5wqgyCMc8wogUl9uNl02IiI';

if (!PI_API_KEY) {
  console.error('FATAL: PI_API_KEY is missing in .env');
  process.exit(1);
}

// Hardened HTTP client forcing IPv4
const piClient = axios.create({
  baseURL: PI_API_BASE,
  timeout: 20000,
  proxy: false,
  httpsAgent: new https.Agent({
    keepAlive: true,
    family: 4, // Prevents Windows Node 24 socket hangs
  }),
  headers: {
    Authorization: `Key ${PI_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

async function checkPayment(id: string) {
  console.log(`\nQuerying payment record: ${id}...`);
  try {
    const response = await piClient.get(`/payments/${id}`);
    const p = response.data;

    console.log('\n--- PAYMENT VERIFICATION DETAILS ---');
    console.log(`Identifier:     ${p.identifier}`);
    console.log(`User UID:       ${p.user_uid}`);
    console.log(`Amount:         ${p.amount} Test-Pi`);
    console.log(`Direction:      ${p.direction}`);
    console.log(`To Wallet:      ${p.to_address}`);
    console.log(`Created At:     ${p.created_at}`);

    console.log('\nLifecycle Status:');
    console.log(`  • Developer Approved:  ${p.status?.developer_approved}`);
    console.log(`  • Transaction Verified:${p.status?.transaction_verified}`);
    console.log(`  • Developer Completed: ${p.status?.developer_completed}`);
    console.log(`  • Cancelled:           ${p.status?.cancelled}`);

    if (p.transaction) {
      console.log('\nOn-Chain Settlement:');
      console.log(`  • TXID:     ${p.transaction.txid}`);
      console.log(`  • Verified: ${p.transaction.verified}`);
    }

    const isComplete =
      p.status?.developer_approved &&
      (p.status?.developer_completed || p.transaction?.verified) &&
      !p.status?.cancelled;

    console.log(`\nValidation Gate Count: [ ${isComplete ? '1 OF 5 REGISTERED ✓' : 'PENDING ✗'} ]\n`);
  } catch (error: any) {
    console.error('\nQuery Failed:');
    if (error.response) {
      console.error(`HTTP ${error.response.status}:`, JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

checkPayment(paymentId);