import axios from 'axios';
import * as dotenv from 'dotenv';
import * as https from 'https';

dotenv.config();

const PI_API_BASE = 'https://api.minepi.com/v2';
const PI_API_KEY = process.env.PI_API_KEY?.trim();
const paymentId = process.argv[2] || 'luQpC5wqgyCMc8wogUl9uNl02IiI';

if (!PI_API_KEY) {
  console.error('FATAL: PI_API_KEY is missing in .env');
  process.exit(1);
}

const piClient = axios.create({
  baseURL: PI_API_BASE,
  timeout: 15000,
  proxy: false,
  httpsAgent: new https.Agent({ keepAlive: true, family: 4 }),
  headers: {
    Authorization: `Key ${PI_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

async function cancelPayment(id: string) {
  console.log(`Cancelling pending payment: ${id}...`);
  try {
    const response = await piClient.post(`/payments/${id}/cancel`, {});
    console.log('✓ Payment cancelled successfully:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.error('Cancel Failed:', error.response?.data || error.message);
  }
}

cancelPayment(paymentId);