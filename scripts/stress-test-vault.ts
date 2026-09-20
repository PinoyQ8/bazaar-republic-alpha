// scripts/stress-test-vault.ts
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

const CONTRACT_ID =
  process.env.NEXT_PUBLIC_BAZAAR_VAULT_CONTRACT_ID ||
  'CBM5SVJHLHNAEUR4GA3IV5KZFPCCMGTZGMAJUNURUQIEFPTKZLKXQ3RY';

const SAC_TOKEN =
  process.env.NEXT_PUBLIC_PI_TOKEN_CONTRACT ||
  'CDG6ZM2SHXIHD5HZ2E62B7D76RY5DUHDNQVPSHRVDNN7W4EW47FXLEXQ';

const ADMIN_PUB = 'GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3';
const RPC_URL = 'https://rpc.testnet.minepi.com';
const NETWORK_PASSPHRASE = 'Pi Testnet';

function sleep(ms: number) {
  try {
    execSync(`ping 127.0.0.1 -n ${Math.max(2, Math.ceil(ms / 1000))} > nul`, { stdio: 'ignore' });
  } catch {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
  }
}

function execWithRetry(cmd: string, retries = 5, initialDelayMs = 5000): string {
  let delay = initialDelayMs;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return execSync(cmd, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (err: any) {
      const errOutput = err?.stderr || err?.message || String(err);
      if (attempt === retries) {
        throw new Error(errOutput);
      }
      console.warn(`[WARN] RPC connection dropped. Retrying (${attempt}/${retries}) in ${delay / 1000}s...`);
      sleep(delay);
      delay *= 2; // Exponential backoff (5s -> 10s -> 20s -> 40s)
    }
  }
  throw new Error('Max retries exceeded');
}

async function runStressTest() {
  console.log('=== Protocol 28 Escrow Stress Test (10 Cycles with Rate-Limit Shield) ===');
  console.log(`Vault Contract ID : ${CONTRACT_ID}`);
  console.log(`SAC Token Contract: ${SAC_TOKEN}`);
  console.log(`Signer Account    : ${ADMIN_PUB}\n`);

  for (let i = 1; i <= 10; i++) {
    const escrowId = `ST_${Math.floor(Math.random() * 900000 + 100000)}_${i}`;
    console.log(`[Cycle ${i}/10] Locking escrow: ${escrowId}...`);
    const startTime = Date.now();

    try {
      // 1. Lock Funds with backoff
      const lockCmd = `stellar contract invoke --id ${CONTRACT_ID} --source s23-deployer --rpc-url ${RPC_URL} --network-passphrase "${NETWORK_PASSPHRASE}" --inclusion-fee 10000000 -- lock_funds --escrow_id ${escrowId} --token_contract ${SAC_TOKEN} --consumer ${ADMIN_PUB} --provider ${ADMIN_PUB} --amount 100000 --duration_secs 3600`;

      execWithRetry(lockCmd);
      console.log(`[Cycle ${i}/10] Locked successfully. Pausing 3s before release...`);
      sleep(3000);

      // 2. Release Funds with backoff
      const releaseCmd = `stellar contract invoke --id ${CONTRACT_ID} --source s23-deployer --rpc-url ${RPC_URL} --network-passphrase "${NETWORK_PASSPHRASE}" --inclusion-fee 10000000 -- release_funds --escrow_id ${escrowId} --consumer ${ADMIN_PUB}`;

      execWithRetry(releaseCmd);
      const elapsed = Date.now() - startTime;

      console.log(`[Cycle ${i}/10] Released successfully (${elapsed}ms)\n`);

      // Cooldown between cycles to keep RPC connection stable
      if (i < 10) {
        console.log(`[Cooldown] Pausing 5s before next cycle...\n`);
        sleep(5000);
      }
    } catch (err: any) {
      console.error(`[Cycle ${i}/10] Failed after retries:`, err);
      process.exit(1);
    }
  }

  console.log('✅ Protocol 28 Escrow Stress Test Completed: 10/10 Cycles Successful on Pi Testnet!');
}

runStressTest().catch((err) => {
  console.error('\nFatal stress test failure:', err);
  process.exitCode = 1;
});