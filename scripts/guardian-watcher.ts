import {
  Horizon,
  Keypair,
  TransactionBuilder,
  Operation,
  Asset,
  TimeoutInfinite,
} from '@stellar/stellar-sdk';
import prisma from '../lib/prisma';
import { processShieldQuarantineAndRelay } from '../lib/services/relayer-quarantine';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const HORIZON_URL = process.env.PI_HORIZON_URL || 'https://api.testnet.minepi.com';
const NETWORK_PASSPHRASE = process.env.PI_NETWORK_PASSPHRASE || 'Pi Testnet';
const SHIELD_FEE = '100000'; // 0.01 Pi base reserve fee
const server = new Horizon.Server(HORIZON_URL);

// Guardian signer seed must be present in environment
const GUARDIAN_SECRET = process.env.PI_GUARDIAN_SECRET || process.env.GUARDIAN_SECRET;

if (!GUARDIAN_SECRET) {
  console.error(' Missing PI_GUARDIAN_SECRET or GUARDIAN_SECRET in environment variables.');
  process.exit(1);
}

const guardianKeypair = Keypair.fromSecret(GUARDIAN_SECRET.trim());
const activeStreams = new Set<string>();

async function sweepTarget(targetPub: string, vaultPub: string, shieldAccountId: string) {
  try {
    const account = await server.loadAccount(targetPub);
    const nativeBal = parseFloat(
      account.balances.find((b: any) => b.asset_type === 'native')?.balance || '0'
    );

    // Retain 1.60 Pi reserve buffer
    const sweepableRaw = nativeBal - 1.60;
    const sweepableAmount = (Math.floor(sweepableRaw * 1000000) / 1000000).toFixed(6);

    if (parseFloat(sweepableAmount) <= 0.01) {
      console.log(`[Watcher] ${targetPub.slice(0, 8)}: Balance ${nativeBal} Pi is at or below reserve buffer. No sweep needed.`);
      return;
    }

    console.log(`⚡ [Watcher] Incoming balance detected on ${targetPub.slice(0, 8)}! Evacuating ${sweepableAmount} Pi to ${vaultPub.slice(0, 8)}...`);

    // Verify vault existence
    let destinationExists = false;
    try {
      await server.loadAccount(vaultPub);
      destinationExists = true;
    } catch {
      destinationExists = false;
    }

    const op = destinationExists
      ? Operation.payment({
          destination: vaultPub,
          asset: Asset.native(),
          amount: sweepableAmount,
        })
      : Operation.createAccount({
          destination: vaultPub,
          startingBalance: sweepableAmount,
        });

    const tx = new TransactionBuilder(account, {
      fee: SHIELD_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(op)
      .setTimeout(TimeoutInfinite)
      .build();

    // Sole signature: Master key weight is 0; Guardian threshold 1 is satisfied
    tx.sign(guardianKeypair);

    const res = await server.submitTransaction(tx);
    console.log(` [Watcher] Sweep confirmed! Hash: ${res.hash}`);

    const evacuatedPi = parseFloat(sweepableAmount);
    const updatedBalance = parseFloat((nativeBal - evacuatedPi).toFixed(6));

    // 1. Update ShieldAccount persistence
    await prisma.shieldAccount.update({
      where: { id: shieldAccountId },
      data: { currentBalance: updatedBalance },
    });

    // 2. Insert RecoverySettlement record
    await prisma.recoverySettlement.create({
      data: {
        shieldAccountId,
        evacuatedAmount: evacuatedPi,
        vaultAddress: vaultPub,
        operationType: destinationExists ? 'PAYMENT' : 'CREATE_ACCOUNT',
        sweepTxHash: res.hash,
        settledLedger: res.ledger,
      },
    });

    // 3. Write into MeshLedger with deterministic txSignature
    await prisma.meshLedger.create({
      data: {
        walletId: vaultPub,
        txSignature: `SWEEP_${res.hash}`,
        txHash: res.hash,
        txType: 'SHIELD_SWEEP',
        piAmount: evacuatedPi,
        status: 'CONFIRMED',
        description: `Autonomous SSE sweep of ${sweepableAmount} Pi from neutralized ${targetPub.slice(0, 8)}...`,
      },
    });

    // 4. Record ShieldEvent audit log
    await prisma.shieldEvent.create({
      data: {
        shieldAccountId,
        eventType: 'SSE_AUTO_SWEEP',
        txHash: res.hash,
        details: JSON.stringify({ amount: sweepableAmount, vault: vaultPub, ledger: res.ledger }),
      },
    });

    // 5. Synchronize L2 Relayer state and place PioneerNode into Quarantine
    await processShieldQuarantineAndRelay({
      targetAddress: targetPub,
      vaultAddress: vaultPub,
      evacuatedAmount: evacuatedPi,
      sweepTxHash: res.hash,
      settledLedger: res.ledger,
    });

  } catch (err: any) {
    console.error(`🚨 [Watcher] Sweep failed for ${targetPub.slice(0, 8)}:`, err?.response?.data || err.message);
  }
}

async function attachStream(target: { id: string; targetAddress: string; recoveryVault: string }) {
  if (activeStreams.has(target.targetAddress)) return;
  activeStreams.add(target.targetAddress);

  console.log(`📡 Listening for payments to ${target.targetAddress} -> Sweep to ${target.recoveryVault}`);

  // Run an initial sweep check on boot
  await sweepTarget(target.targetAddress, target.recoveryVault, target.id);

  // Attach real-time Horizon payment SSE stream
  server
    .payments()
    .forAccount(target.targetAddress)
    .cursor('now')
    .stream({
      onmessage: async (payment: any) => {
        // Discard heartbeats or empty pings
        if (!payment || !payment.type) return;

        const receivedAmount = payment.amount || payment.starting_balance || 'unknown';
        console.log(`📥 Incoming operation detected on ${target.targetAddress}: ${receivedAmount} Pi (Type: ${payment.type})`);
        
        // Execute autonomous sweep
        await sweepTarget(target.targetAddress, target.recoveryVault, target.id);
      },
      onerror: (err: any) => {
        const errMsg = err?.message || err?.data || JSON.stringify(err) || 'Stream disconnected';
        console.error(`⚠️ Stream event notice on ${target.targetAddress.slice(0, 8)}:`, errMsg);
      },
    });
}

async function startDaemon() {
  console.log('🛡️  Starting RFC-002 Autonomous Shield Watcher Daemon...');
  console.log(`🔑 Guardian Key: ${guardianKeypair.publicKey()}`);

  const syncAccounts = async () => {
    const targets = await prisma.shieldAccount.findMany({
      where: {
        status: 'NEUTRALIZED_REVOKED',
        guardianAddress: guardianKeypair.publicKey(),
      },
    });

    if (targets.length === 0 && activeStreams.size === 0) {
      console.log('ℹ️  No neutralized accounts found for this guardian. Waiting for updates...');
    }

    for (const target of targets) {
      await attachStream(target);
    }
  };

  // Initial stream setup
  await syncAccounts();

  // Periodic polling check to pick up any newly neutralized accounts without daemon restarts
  setInterval(syncAccounts, 30000);

  console.log(' Active listeners engaged. Press Ctrl+C to stop.');
}

startDaemon().catch((err) => {
  console.error('Fatal Watcher Error:', err);
  process.exit(1);
});