import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Keypair } from '@stellar/stellar-sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function loadEnvFiles(): void {
  for (const file of ['.env.local', '.env']) {
    const fullPath = path.join(rootDir, file);
    if (!fs.existsSync(fullPath)) continue;

    const lines = fs.readFileSync(fullPath, 'utf-8').split(/\r?\n/);
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (!match) continue;

      const key = match[1];
      let value = (match[2] || '').trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }

  process.env.SOROBAN_RPC_URL =
    process.env.SOROBAN_RPC_URL ||
    process.env.PI_RPC_URL ||
    'https://rpc.testnet.minepi.com';

  process.env.STELLAR_NETWORK_PASSPHRASE =
    process.env.STELLAR_NETWORK_PASSPHRASE ||
    process.env.PI_NETWORK_PASSPHRASE ||
    'Pi Testnet';
}

async function resolveSigner(
  StellarSdk: typeof import('@stellar/stellar-sdk')
): Promise<Keypair> {
  const envSeed = String(
    process.env.STELLAR_DEPLOYER_SECRET ||
      process.env.STELLAR_VAULT_SEED ||
      ''
  )
    .replace(/["'\r\n]/g, '')
    .trim();

  if (envSeed && envSeed.startsWith('S') && envSeed.length === 56) {
    try {
      return StellarSdk.Keypair.fromSecret(envSeed);
    } catch {
      // Fall through to CLI lookup
    }
  }

  try {
    const cliOutput = execSync('stellar keys secret s23-deployer', {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();

    const match = cliOutput.match(/S[A-Z2-7]{55}/);
    if (match) {
      return StellarSdk.Keypair.fromSecret(match[0]);
    }
  } catch {
    // Throw below
  }

  throw new Error('Failed to resolve valid secret key for s23-deployer.');
}

async function resolveProviderId(db: any, providerUid: string): Promise<string> {
  const existing =
    (await db.serviceProvider?.findFirst({ where: { providerUid } }).catch(() => null)) ||
    (await db.serviceProvider?.findFirst().catch(() => null));

  if (existing?.id) {
    return existing.id;
  }

  const created = await db.serviceProvider.create({
    data: {
      businessName: 'E2E Test Provider',
      category: 'MESH',
      description: 'Automated E2E verification provider',
      providerUid,
      sectorLocation: 'Testnet',
      mbzrRate: 10,
      unitLabel: 'job',
    },
  });

  return created.id;
}

async function runE2ETest(): Promise<void> {
  loadEnvFiles();

  console.log('[E2E Runner] Starting Closed-Loop Escrow Lifecycle Test...');

  const StellarSdk = await import('@stellar/stellar-sdk');
  const { submitContractCall } = await import('../lib/soroban-relayer');
  const { prisma } = await import('../lib/prisma');

  try {
    const contractId =
      process.env.NEXT_PUBLIC_BAZAAR_VAULT_CONTRACT_ID ||
      process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ID ||
      'CAQMHSA6M2LSDJIHDLPCFJMXC2DQNTNZHV6QMWD3IR6FW3FLR4J7EGEV';

    const sacToken =
      process.env.NEXT_PUBLIC_PI_TOKEN_CONTRACT ||
      'CDG6ZM2SHXIHD5HZ2E62B7D76RY5DUHDNQVPSHRVDNN7W4EW47FXLEXQ';

    const defaultProvider =
      process.env.E2E_PROVIDER_ADDRESS ||
      'GA7UMIANNCXSZK5NQ7GCAWL3BP3GOBGVRHLSRYY5WI2KZG4SRFLZSARW';

    const signer = await resolveSigner(StellarSdk);
    const consumerPub = signer.publicKey();
    const providerPub =
      defaultProvider !== consumerPub
        ? defaultProvider
        : 'GA7UMIANNCXSZK5NQ7GCAWL3BP3GOBGVRHLSRYY5WI2KZG4SRFLZSARW';

    const testEscrowId = `ESC_E2E_${Math.floor(Date.now() / 1000)}`;
    const amountStroops = 10_000_000n; // 1.0 Pi (10^7 stroops)
    const amountPi = Number(amountStroops) / 10_000_000;
    const durationSecs = 172800n; // 48 hours

    console.log(`Target Contract ID : ${contractId}`);
    console.log(
      `RPC / Passphrase   : ${process.env.SOROBAN_RPC_URL} (${process.env.STELLAR_NETWORK_PASSPHRASE})`
    );
    console.log(`Consumer Address   : ${consumerPub}`);
    console.log(`Provider Address   : ${providerPub}`);
    console.log(`Token Contract SAC : ${sacToken}`);
    console.log(`Generated EscrowID : ${testEscrowId}`);

    const escrowIdArg = StellarSdk.nativeToScVal(testEscrowId, { type: 'symbol' });
    const tokenContractArg = StellarSdk.Address.fromString(sacToken).toScVal();
    const consumerArg = StellarSdk.Address.fromString(consumerPub).toScVal();
    const providerArg = StellarSdk.Address.fromString(providerPub).toScVal();
    const amountArg = StellarSdk.nativeToScVal(amountStroops, { type: 'i128' });
    const durationArg = StellarSdk.nativeToScVal(durationSecs, { type: 'u64' });

    const db = prisma as any;
    const expiresAt = new Date(Date.now() + Number(durationSecs) * 1000);
    const resolvedProviderId = db?.escrowLock
      ? await resolveProviderId(db, providerPub)
      : '';

    // --- PHASE 1: LOCK FUNDS ON-CHAIN ---
    console.log('\n[Phase 1] Executing On-Chain Lock (6-arg ABI)...');
    const lockResult = await submitContractCall(
      contractId,
      'lock_funds',
      [escrowIdArg, tokenContractArg, consumerArg, providerArg, amountArg, durationArg],
      signer
    );

    if (!lockResult.success || !lockResult.hash) {
      throw new Error(`LOCK_FAILED: ${lockResult.error || 'Missing tx hash'}`);
    }
    console.log(`Lock Successful! Tx Hash: ${lockResult.hash}`);

    if (db?.escrowLock && resolvedProviderId) {
      await db.escrowLock.upsert({
        where: { escrowId: testEscrowId },
        update: {
          status: 'LOCKED',
          amount: amountPi,
          timelockExpiresAt: expiresAt,
          txid: lockResult.hash,
        },
        create: {
          escrowId: testEscrowId,
          consumerUid: consumerPub,
          provider: { connect: { id: resolvedProviderId } },
          amount: amountPi,
          token: 'PI',
          status: 'LOCKED',
          timelockExpiresAt: expiresAt,
          serviceDescription: `Closed-Loop E2E Escrow (${testEscrowId})`,
          txid: lockResult.hash,
        },
      });
      console.log(`Synced ${testEscrowId} -> LOCKED in MongoDB (EscrowLock).`);
    }

    console.log('Cooldown: Waiting 4 seconds for ledger sequence synchronization...');
    await new Promise((resolve) => setTimeout(resolve, 4000));

    // --- PHASE 2: RELEASE FUNDS ON-CHAIN ---
    console.log('\n[Phase 2] Executing On-Chain Release (2-arg ABI)...');
    const releaseResult = await submitContractCall(
      contractId,
      'release_funds',
      [escrowIdArg, consumerArg],
      signer
    );

    if (!releaseResult.success || !releaseResult.hash) {
      throw new Error(`RELEASE_FAILED: ${releaseResult.error || 'Missing tx hash'}`);
    }
    console.log(`Release Successful! Tx Hash: ${releaseResult.hash}`);

    if (db?.escrowLock && resolvedProviderId) {
      await db.escrowLock.upsert({
        where: { escrowId: testEscrowId },
        update: {
          status: 'RELEASED',
          txid: releaseResult.hash,
        },
        create: {
          escrowId: testEscrowId,
          consumerUid: consumerPub,
          provider: { connect: { id: resolvedProviderId } },
          amount: amountPi,
          token: 'PI',
          status: 'RELEASED',
          timelockExpiresAt: expiresAt,
          serviceDescription: `Closed-Loop E2E Escrow (${testEscrowId})`,
          txid: releaseResult.hash,
        },
      });
      console.log(`Synced ${testEscrowId} -> RELEASED in MongoDB (EscrowLock).`);
    }

    console.log('\nClosed-Loop E2E Escrow Lifecycle Verified on Pi Testnet + MongoDB!');
  } finally {
    if (prisma) {
      await prisma.$disconnect().catch(() => {});
    }
  }
}

runE2ETest().catch((err) => {
  console.error('[E2E Error]:', err?.message || err);
  process.exit(1);
});