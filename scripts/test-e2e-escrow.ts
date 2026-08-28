// 🛡️ PROJECT BAZAAR DAO - PROTOCOL 28
// MODULE: END-TO-END ESCROW TEST RUNNER (TARGET: CCLEEATNMEUZGVSYL4NSZYADVCAPU2EFCJNCNV77KVOUDFO3CGM3SKKL)

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Keypair, Address, nativeToScVal } from '@stellar/stellar-sdk';
import { submitContractCall } from '../lib/soroban-relayer';
import { prisma } from '../lib/prisma';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Manually parse .env.local
for (const file of ['.env.local', '.env']) {
  const fullPath = path.join(rootDir, file);
  if (fs.existsSync(fullPath)) {
    const lines = fs.readFileSync(fullPath, 'utf-8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = (match[2] || '').trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        if (!process.env[key]) process.env[key] = value;
      }
    }
  }
}

const CONTRACT_ID =
  process.env.NEXT_PUBLIC_BAZAAR_VAULT_CONTRACT_ID ||
  'CCLEEATNMEUZGVSYL4NSZYADVCAPU2EFCJNCNV77KVOUDFO3CGM3SKKL';

// Testnet Native Stellar Asset Contract (SAC)
const SAC_TOKEN = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';

function resolveSigner(): Keypair {
  const envSeed = (
    process.env.STELLAR_VAULT_SEED ||
    process.env.STELLAR_DEPLOYER_SECRET ||
    ''
  ).trim();

  if (envSeed && envSeed.startsWith('S') && envSeed.length === 56) {
    try {
      return Keypair.fromSecret(envSeed);
    } catch {}
  }

  try {
    const cliOutput = execSync('stellar keys secret s23-deployer', {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();

    const match = cliOutput.match(/S[A-Z2-7]{55}/);
    if (match) {
      return Keypair.fromSecret(match[0]);
    }
  } catch {}

  throw new Error('Failed to resolve valid secret key for s23-deployer.');
}

async function runE2ETest() {
  console.log('🛡️ [E2E Runner] Starting End-to-End Escrow Lifecycle Test...');

  const signer = resolveSigner();
  const testEscrowId = `ESC_${Date.now().toString().slice(-4)}`;
  const amount = 10_000_000n; // 1.0 XLM (10^7 Stroops)
  const durationSecs = 172800n; // 48 Hours

  console.log(`🔌 Target Contract ID : ${CONTRACT_ID}`);
  console.log(`🔑 Signer Address     : ${signer.publicKey()}`);
  console.log(`🪙 Token Contract SAC : ${SAC_TOKEN}`);
  console.log(`📦 Generated Escrow ID : ${testEscrowId}`);

  // Construct precise ScVal arguments matching on-chain ABI
  const escrowIdArg = nativeToScVal(testEscrowId, { type: 'symbol' });
  const tokenContractArg = Address.fromString(SAC_TOKEN).toScVal();
  const consumerArg = Address.fromString(signer.publicKey()).toScVal();
  const providerArg = Address.fromString(signer.publicKey()).toScVal();
  const amountArg = nativeToScVal(amount, { type: 'i128' });
  const durationArg = nativeToScVal(durationSecs, { type: 'u64' });

  // --- PHASE 1: LOCK FUNDS ---
  console.log('\n🚀 [Phase 1] Executing On-Chain Lock (6-arg ABI)...');
  const lockResult = await submitContractCall(
    CONTRACT_ID,
    'lock_funds',
    [escrowIdArg, tokenContractArg, consumerArg, providerArg, amountArg, durationArg],
    signer
  );

  if (!lockResult.success) {
    throw new Error(`LOCK_FAILED: ${lockResult.error}`);
  }
  console.log(`✅ Lock Successful! Tx Hash: ${lockResult.hash}`);

  console.log('⏳ Cooldown: Waiting 4 seconds for ledger sequence synchronization...');
  await new Promise((resolve) => setTimeout(resolve, 4000));

  // --- PHASE 2: RELEASE FUNDS ---
  console.log('\n🚀 [Phase 2] Executing On-Chain Release (2-arg ABI)...');
  const releaseResult = await submitContractCall(
    CONTRACT_ID,
    'release_funds',
    [escrowIdArg, consumerArg],
    signer
  );

  if (!releaseResult.success) {
    throw new Error(`RELEASE_FAILED: ${releaseResult.error}`);
  }
  console.log(`✅ Release Successful! Tx Hash: ${releaseResult.hash}`);

  console.log('\n🎉 End-to-End Escrow Lifecycle Verified Successfully on Stellar Testnet!');
}

runE2ETest()
  .catch((err) => {
    console.error('❌ [E2E Error]:', err.message || err);
    process.exit(1);
  })
  .finally(async () => {
    if (prisma) await prisma.$disconnect().catch(() => {});
  });