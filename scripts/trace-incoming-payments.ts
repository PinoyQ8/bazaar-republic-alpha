import axios from 'axios';
import * as http from 'http';
import * as https from 'https';

const HORIZON_TESTNET_URL = 'https://api.testnet.minepi.com';
const TARGET_WALLET = 'GDYQCPRIHTV3T7AOSWIWPJ3RPXHOGLUYHWZIIXLQWTCLAHQT42Z32YTU';

// Force IPv4 and keepalive to eliminate Node 24 DNS/socket drops
const httpClient = axios.create({
  timeout: 15000,
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true, rejectUnauthorized: true }),
  headers: {
    'User-Agent': 'Pi-Testnet-Auditor/1.0',
    Accept: 'application/json',
  },
});

interface PaymentRecord {
  id: string;
  type: string;
  created_at: string;
  transaction_hash: string;
  from?: string;
  to?: string;
  amount?: string;
}

interface HorizonResponse {
  _embedded: {
    records: PaymentRecord[];
  };
  _links: {
    next?: { href: string };
  };
}

async function traceIncomingPayments(walletAddress: string) {
  console.log(`\n--- TRACING INCOMING PI TESTNET TRANSACTIONS ---`);
  console.log(`Target Wallet: ${walletAddress}\n`);

  let currentUrl: string | null = `${HORIZON_TESTNET_URL}/accounts/${walletAddress}/payments?order=desc&limit=200`;
  const incomingPayments: Array<{ date: string; sender: string; amount: string; txHash: string }> = [];
  const senderSummary = new Map<string, { count: number; totalAmount: number; lastSeen: string }>();

  try {
    let totalScanned = 0;

    while (currentUrl) {
      process.stdout.write(`Fetching ledger records (Scanned: ${totalScanned})...\r`);
      const response = await httpClient.get<HorizonResponse>(currentUrl);
      const records = response.data._embedded?.records || [];

      if (records.length === 0) break;
      totalScanned += records.length;

      for (const record of records) {
        if (record.type === 'payment' && record.to === walletAddress && record.from && record.amount) {
          const sender = record.from;
          const amount = record.amount;
          const date = record.created_at;
          const txHash = record.transaction_hash;

          incomingPayments.push({ date, sender, amount, txHash });

          const existing = senderSummary.get(sender);
          if (existing) {
            existing.count += 1;
            existing.totalAmount += parseFloat(amount);
          } else {
            senderSummary.set(sender, {
              count: 1,
              totalAmount: parseFloat(amount),
              lastSeen: date,
            });
          }
        }
      }

      const nextHref = response.data._links?.next?.href;
      // Prevent loop if next page is identical or empty
      if (nextHref && nextHref !== currentUrl && records.length === 200) {
        currentUrl = nextHref;
      } else {
        currentUrl = null;
      }
    }

    console.log(`\n\n--- TRANSACTION LOG (${incomingPayments.length} Payments Found) ---`);
    incomingPayments.forEach((tx, idx) => {
      console.log(`[#${idx + 1}] Date:   ${tx.date}`);
      console.log(`     From:   ${tx.sender}`);
      console.log(`     Amount: ${tx.amount} Test-Pi`);
      console.log(`     TXID:   ${tx.txHash}\n`);
    });

    console.log(`================================================================`);
    console.log(`--- UNIQUE SENDER RECONCILIATION (${senderSummary.size} Unique Wallets) ---`);
    console.log(`================================================================`);

    let counter = 1;
    for (const [sender, data] of senderSummary.entries()) {
      console.log(
        `${counter}. Wallet: ${sender}\n` +
        `   Tx Count: ${data.count} | Total: ${data.totalAmount.toFixed(4)} Test-Pi | Last Active: ${data.lastSeen}\n`
      );
      counter++;
    }

  } catch (error: any) {
    console.error('\n\n--- CONNECTION DIAGNOSTIC ---');
    if (error.response) {
      console.error(`Horizon HTTP Status: ${error.response.status}`);
      console.error('Payload:', JSON.stringify(error.response.data, null, 2));
    } else if (error.code) {
      console.error(`Socket / Network Code: ${error.code}`);
      console.error(`Message: ${error.message}`);
    } else {
      console.error('Error Details:', error.cause || error);
    }
  }
}

traceIncomingPayments(TARGET_WALLET);