import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const PI_API_KEY = process.env.PI_API_KEY?.trim();
const paymentId = 'luQpC5wqgyCMc8wogUl9uNl02IiI';
const txid = 'afe2a3a074da0582934158a31594bd24ea53264d1f271f3319fb689f34087c0b';

if (!PI_API_KEY) {
  console.error('FATAL: PI_API_KEY not found in .env');
  process.exit(1);
}

async function finalizePayment() {
  console.log(`Finalizing Payment: ${paymentId}`);
  console.log(`Linking TXID:       ${txid}`);

  const response = await axios.post(
    `https://api.minepi.com/v2/payments/${paymentId}/complete`,
    { txid },
    {
      headers: {
        Authorization: `Key ${PI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  console.log('\nPayment successfully completed on Pi Platform:');
  console.log(JSON.stringify(response.data, null, 2));
}

finalizePayment().catch((error) => {
  console.error('Completion Error:', error.response?.data || error.message);
});