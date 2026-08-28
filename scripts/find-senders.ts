import { Horizon } from '@stellar/stellar-sdk';

const HORIZON_TESTNET_URL = 'https://api.testnet.minepi.com';
const TARGET_WALLET = 'GDYQCPRIHTV3T7AOSWIWPJ3RPXHOGLUYHWZIIXLQWTCLAHQT42Z32YTU';

async function findUniqueSenders(walletAddress: string) {
  const server = new Horizon.Server(HORIZON_TESTNET_URL);
  const uniqueSenders = new Set<string>();

  console.log(`Scanning Pi Testnet ledger for incoming payments to:\n${walletAddress}\n`);

  try {
    // Fetch payments for the account, 200 records at a time
    let page = await server.payments().forAccount(walletAddress).limit(200).call();
    let totalScanned = 0;

    while (page.records.length > 0) {
      totalScanned += page.records.length;
      process.stdout.write(`Scanned ${totalScanned} operations...\r`);

      for (const record of page.records) {
        // Narrow down to native payments where the target is the recipient
        if (record.type === 'payment' && (record as any).to === walletAddress) {
          uniqueSenders.add((record as any).from);
        }
      }

      // Automatically fetch the next page of results
      const nextPage = await page.next();
      // Break if the next page is identical to prevent infinite loops on empty tails
      if (nextPage.records.length === 0) break;
      page = nextPage;
    }

    console.log('\n\nScan Complete.');
    console.log(`Found ${uniqueSenders.size} unique sender(s):`);
    
    Array.from(uniqueSenders).forEach((sender, index) => {
      console.log(`${index + 1}. ${sender}`);
    });

  } catch (error: any) {
    console.error('\nError fetching data from Horizon:', error?.response?.data || error.message);
  }
}

findUniqueSenders(TARGET_WALLET);