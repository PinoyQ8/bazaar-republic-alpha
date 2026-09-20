import dotenv from 'dotenv';
import path from 'path';
import { Keypair } from '@stellar/stellar-sdk';

// Load .env.local then .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

const keysToCheck = [
  { name: 'STELLAR_VAULT_SEED', secret: process.env.STELLAR_VAULT_SEED },
  { name: 'STELLAR_DEPLOYER_SECRET', secret: process.env.STELLAR_DEPLOYER_SECRET },
  { name: 'KEEPER_SIGNER_SECRET', secret: process.env.KEEPER_SIGNER_SECRET },
];

async function checkAccount(label: string, secret?: string) {
  if (!secret) {
    console.log(`[-] ${label}: Not found in environment\n`);
    return;
  }
  try {
    const kp = Keypair.fromSecret(secret.trim());
    const pub = kp.publicKey();
    const res = await fetch(`https://api.testnet.minepi.com/accounts/${pub}`);
    
    if (res.status === 200) {
      const data: any = await res.json();
      const nativeBal =
        data.balances?.find((b: any) => b.asset_type === 'native')?.balance || '0';
      console.log(`[+] ${label}:`);
      console.log(`    Public Key : ${pub}`);
      console.log(`    Status     : ACTIVE (${nativeBal} Test-Pi)\n`);
    } else {
      console.log(`[!] ${label}:`);
      console.log(`    Public Key : ${pub}`);
      console.log(`    Status     : UNFUNDED / NOT FOUND ON PI TESTNET (HTTP ${res.status})\n`);
    }
  } catch (err: any) {
    console.log(`[x] ${label}: Error checking account - ${err.message}\n`);
  }
}

async function main() {
  console.log('=== Checking Pi Testnet Account Balances ===\n');
  for (const item of keysToCheck) {
    await checkAccount(item.name, item.secret);
  }
}

main();