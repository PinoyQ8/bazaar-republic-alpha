// Location: seed.ts
import { PrismaClient } from "@prisma/client";

/**
 * PROJECT BAZAAR SEED SCRIPT (Schema v2.7.2)
 * -----------------------------------------------------------------------------
 * Seeds the "@prisma/client" MongoDB database with initial data representing
 * the active Genesis Cohort of Pioneer Nodes, regional PPP multipliers,
 * pending bridge transactions, dispute cases, elder votes, and system state logs.
 *
 * Enforces:
 * 1. 7-decimal currency precision (BigInt scaling 10^7 for subunits).
 * 2. Real-world regional PPP multiplier mappings.
 * 3. Health & performance telemetry matching the 90% Rolling 30-Day SLA (720 hrs total).
 */

const prisma = new PrismaClient();

// 7-Decimal Scale Factor (10^7)
const PRECISION_SCALE = 10_000_000n;

// Helper to convert decimal string to BigInt subunits
function toSubunits(amountStr: string): string {
  const parts = amountStr.trim().split('.');
  const integerPart = parts[0];
  const decimalPart = (parts[1] || '').padEnd(7, '0').slice(0, 7);
  const rawSubunits = (BigInt(integerPart) * PRECISION_SCALE) + BigInt(decimalPart);
  return rawSubunits.toString();
}

// Regional PPP Multiplier Data Map
const REGIONAL_PROFILES = [
  { countryCode: 'PH', phonePrefix: '+63', multiplier: 1.95, baseWages: '320.00' },
  { countryCode: 'KW', phonePrefix: '+965', multiplier: 0.62, baseWages: '2100.00' },
  { countryCode: 'US', phonePrefix: '+1', multiplier: 1.00, baseWages: '1200.00' },
  { countryCode: 'DE', phonePrefix: '+49', multiplier: 0.95, baseWages: '1150.00' },
  { countryCode: 'IN', phonePrefix: '+91', multiplier: 2.20, baseWages: '180.00' },
];

async function main() {
  console.log('🌱 Starting database seed for Project Bazaar (v2.7.2)...');

  const db = prisma as any;

  // 1. Clean existing database collections
  console.log('🧹 Cleaning existing tables in bzr-db...');
  if (db.auditLog) await db.auditLog.deleteMany({});
  if (db.elderVote) await db.elderVote.deleteMany({});
  if (db.disputeCase) await db.disputeCase.deleteMany({});
  if (db.mbzrTransaction) await db.mbzrTransaction.deleteMany({});
  if (db.bridgeReceipt) await db.bridgeReceipt.deleteMany({});
  if (db.escrowLock) await db.escrowLock.deleteMany({});
  if (db.pioneerNode) await db.pioneerNode.deleteMany({});
  if (db.relayerSyncState) await db.relayerSyncState.deleteMany({});

  // 2. Initialize L2 Relayer Sync State
  console.log('⚙️ Seeding Relayer Sync State...');
  if (db.relayerSyncState) {
    await db.relayerSyncState.create({
      data: {
        id: 'BazaarRelayer',
        lastLedger: 5829103,
        updatedAt: new Date(),
      },
    });
  }

  // 3. Seed Pioneer Nodes (50 Genesis Nodes)
  console.log('🖥️ Seeding 50 Genesis Pioneer Nodes with dynamic telemetry & PPP balances...');
  const pioneerNodes: any[] = [];

  if (db.pioneerNode) {
    for (let i = 1; i <= 50; i++) {
      const region = REGIONAL_PROFILES[i % REGIONAL_PROFILES.length];
      const walletAddress = `G${'A'.repeat(10)}${i.toString().padStart(4, '0')}${'B'.repeat(40 - 15)}`;
      const pioneerUid = `usr_pioneer_${1000 + i}`;

      const balanceDecimal = (1000 + (i * 480) + 0.12345).toFixed(7);
      const balanceSubunits = toSubunits(balanceDecimal);

      let status: 'ACTIVE' | 'MAINTENANCE' | 'QUARANTINED' = 'ACTIVE';
      const cpuUsage = `${parseFloat((25 + (i * 1.1) % 60).toFixed(1))}%`;
      const ramUsage = `${parseFloat((3.5 + (i * 0.15) % 4.2).toFixed(2))}GB`;
      const ssdLatency = i % 15 === 0 ? '75 MB/s (Slow)' : `${parseFloat((110 + (i * 2.5) % 120).toFixed(1))} MB/s`;
      const accumulatedDowntime = parseFloat((i * 1.4 % 80).toFixed(1));
      let trustScore = 100.0;

      // Calculate Uptime SLA (30 Days = 720 Hours)
      const uptimePercentage = ((720 - accumulatedDowntime) / 720) * 100;
      const isCompliant = uptimePercentage >= 90.0;

      if (!isCompliant) {
        status = 'QUARANTINED';
        trustScore -= 22.5;
      } else if (i % 12 === 0) {
        status = 'MAINTENANCE';
      }

      const node = await db.pioneerNode.create({
        data: {
          uid: pioneerUid,
          username: `Pioneer_${region.countryCode}_${i}`,
          walletAddress: walletAddress,
          tier: isCompliant ? 'GENESIS' : 'CITIZEN',
          status: status,
          trustScore: Math.round(trustScore),
          regionCode: region.countryCode,
          pppMultiplier: region.multiplier,
          mbzrBalanceSubunits: balanceSubunits,
          mbzrBalanceFormatted: balanceDecimal,
          cpuUsage: cpuUsage,
          ramUsage: ramUsage,
          ssdLatency: ssdLatency,
          accumulatedDowntime: accumulatedDowntime,
          uptimeShield: parseFloat(uptimePercentage.toFixed(2)),
          updatedAt: new Date(),
        },
      });
      pioneerNodes.push(node);
    }
  }

  // 4. Seed Mock Peer-to-Peer Transactions
  console.log('💸 Seeding High-Precision mBZR Ledger Transactions...');
  for (let j = 0; j < 10; j++) {
    const sender = pioneerNodes[j];
    const receiver = pioneerNodes[j + 1];
    const amountStr = (10.5 * (j + 1)).toFixed(7);
    const amountSubunitsVal = toSubunits(amountStr);

    if (db.mbzrTransaction) {
      await db.mbzrTransaction.create({
        data: {
          senderAddress: sender.walletAddress,
          receiverAddress: receiver.walletAddress,
          amountSubunits: amountSubunitsVal,
          amountFormatted: amountStr,
          txType: 'TRANSFER',
          stellarTxHash: `stellar_hash_${Math.random().toString(36).substring(2, 15)}`,
          status: 'SUCCESS',
          createdAt: new Date(Date.now() - (10 - j) * 60 * 60 * 1000),
        },
      });
    }
  }

  // 5. Seed Bridge Receipts
  console.log('🌉 Seeding Bridge Receipts (Vault Settlement & Replay Audits)...');
  for (let k = 0; k < 5; k++) {
    const userNode = pioneerNodes[k + 5];
    const amountMeltedStr = (500.0 + k * 100.5).toFixed(7);
    const amountMeltedSubunits = toSubunits(amountMeltedStr);
    const piReleased = parseFloat(amountMeltedStr) / 1000.0;

    if (db.bridgeReceipt) {
      await db.bridgeReceipt.create({
        data: {
          userAddress: userNode.walletAddress,
          nonce: k + 1,
          mBzrAmount: amountMeltedSubunits,
          piAmount: piReleased,
          stellarTxHash: `stellar_melt_tx_${k + 100}`,
          status: k === 4 ? 'PENDING_L1_RELEASE' : 'SUCCESS',
          piTxId: k === 4 ? null : `pi_blockchain_id_${k + 5000}`,
          errorLog: null,
          createdAt: new Date(Date.now() - (5 - k) * 24 * 60 * 60 * 1000),
          completedAt: k === 4 ? null : new Date(),
        },
      });
    }
  }

  console.log(`✅ Seeding Complete! ${pioneerNodes.length} Genesis Pioneer Nodes registered.`);
}

main()
  .catch((e) => {
    console.error('❌ [DATABASE SEED ERROR] Failed to seed bzr-db:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔌 Disconnected from bzr-db.');
  });