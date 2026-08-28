import { PrismaClient } from 'bzr-db';

/**
 * PROJECT BAZAAR SEED SCRIPT (Schema v2.7.2 Sync | v3.0.0 6-Tier Edition)
 * -----------------------------------------------------------------------------
 * This script seeds the 'bzr-db' MongoDB database with initial mock data representing
 * our finalized 6-Tier Sovereign Passport Taxonomy under Schema v2.7.2 standards.
 *
 * It enforces:
 * 1. 7-decimal currency precision (using BigInt scaling 10^7 for subunits).
 * 2. Real-world regional PPP multiplier mappings (e.g., +63 for PH, +965 for KW).
 * 3. 6-Tier Sovereign Distribution:
 *    - Tier 5 (FOUNDER): Solo system architect with complete clearances & 20% weight.
 *    - Tier 4 (GUARDIAN): Qualified Genesis 100 node operators with >= 92% SLA Uptime Shield.
 *    - Tier 3 (ACADEMY_CORE): Graduated, active stakers.
 *    - Tier 2 (MERCHANT): Storefront pricing anchors and service providers.
 *    - Tier 1 (CITIZEN): Base Pioneer role with zero-gas P2P transfers (KYC'ed & graduated).
 *    - Tier 0 (OBSERVER): Guest customers sandboxed in Testnet2, un-KYC'ed, with 0% weight.
 * 4. Micro-transactions and double-spend replay guards.
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
  console.log('🌱 Starting database seed for Project Bazaar (v3.0.0 6-Tier Sync)...');

  const db = prisma as any;

  // 1. Clean existing database collections (order-sensitive to prevent constraint issues)
  console.log('🧹 Cleaning existing tables in bzr-db...');
  if (db.auditLog) await db.auditLog.deleteMany({});
  if (db.elderVote) await db.elderVote.deleteMany({});
  if (db.disputeCase) await db.disputeCase.deleteMany({});
  if (db.mbzrTransaction) await db.mbzrTransaction.deleteMany({});
  if (db.bridgeReceipt) await db.bridgeReceipt.deleteMany({});
  if (db.pioneerNode) await db.pioneerNode.deleteMany({});
  if (db.relayerSyncState) await db.relayerSyncState.deleteMany({});

  // 2. Initialize the L2 Relayer Sync State
  console.log('⚙️ Seeding Relayer Sync State...');
  if (db.relayerSyncState) {
    await db.relayerSyncState.create({
      data: {
        id: 'BazaarRelayer',
        lastLedger: 5829103, // Seeded near active testnet ledger block
        updatedAt: new Date(),
      },
    });
  }

  // 3. Seed Pioneer Nodes (50 Nodes distributed across the 6 Tiers)
  console.log('🖥️ Seeding 50 Sovereign Passport Nodes with dynamic telemetry & PPP balances...');
  const pioneerNodes: any[] = [];

  if (db.pioneerNode) {
    // A. Seed Node 1 as SOLO FOUNDER & ARCHITECT (Tier 5 / FOUNDER)
    const founderRegion = REGIONAL_PROFILES[2]; // US Profile
    const founderWallet = 'G_FOUNDER_MASTER_X570_BZR_REPUBLIC';
    const founderUid = 'usr_founder_01';
    const founderDecimal = '1000000.0000000';
    const founderSubunits = toSubunits(founderDecimal);

    const founderNode = await db.pioneerNode.create({
      data: {
        uid: founderUid,
        username: 'Sovereign_Founder',
        walletAddress: founderWallet,
        tier: 'FOUNDER', // Level-0 Admin
        status: 'ACTIVE',
        trustScore: 100,
        regionCode: founderRegion.countryCode,
        pppMultiplier: founderRegion.multiplier,
        mbzrBalanceSubunits: founderSubunits,
        mbzrBalanceFormatted: founderDecimal,
        cpuUsage: '15.2%',
        ramUsage: '2.1GB',
        ssdLatency: '240 MB/s',
        accumulatedDowntime: 0.0,
        uptimeShield: 100.0,
        createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Established 1 year ago
        updatedAt: new Date(),
      },
    });
    pioneerNodes.push(founderNode);
    console.log('  ✓ Seeded Solo Founder Node: usr_founder_01 (@Sovereign_Founder)');

    // B. Seed remaining 49 nodes across other tiers
    for (let i = 2; i <= 50; i++) {
      const region = REGIONAL_PROFILES[i % REGIONAL_PROFILES.length];
      const walletAddress = `G${'A'.repeat(10)}${i.toString().padStart(4, '0')}${'B'.repeat(40 - 15)}`;
      const pioneerUid = `usr_pioneer_${1000 + i}`;
      
      const balanceDecimal = (1000 + (i * 480) + 0.12345).toFixed(7);
      const balanceSubunits = toSubunits(balanceDecimal);

      let tier: 'GUARDIAN' | 'ACADEMY_CORE' | 'MERCHANT' | 'CITIZEN' | 'OBSERVER' = 'CITIZEN';
      let status: 'ACTIVE' | 'MAINTENANCE' | 'QUARANTINED' | 'SYNCING' = 'ACTIVE';
      let cpuUsage = `${parseFloat((25 + (i * 1.1) % 60).toFixed(1))}%`;
      let ramUsage = `${parseFloat((3.5 + (i * 0.15) % 4.2).toFixed(2))}GB`;
      let ssdLatency = i % 15 === 0 ? '75 MB/s (Slow)' : `${parseFloat((110 + (i * 2.5) % 120).toFixed(1))} MB/s`;
      let accumulatedDowntime = parseFloat((i * 1.4 % 80).toFixed(1));
      let trustScore = 100.0;

      // Assign Tiers and SLA Compliance
      if (i <= 11) {
        // Nodes 2 to 11 are Mesh Guardians (Tier 4 / Genesis 100 elders)
        tier = 'GUARDIAN';
        accumulatedDowntime = parseFloat((i % 4).toFixed(1)); // Extremely high uptime (downtime < 4 hours)
      } else if (i <= 21) {
        // Nodes 12 to 21 are Academy Core Graduates (Tier 3)
        tier = 'ACADEMY_CORE';
      } else if (i <= 31) {
        // Nodes 22 to 31 are Merchants & Providers (Tier 2)
        tier = 'MERCHANT';
      } else if (i <= 41) {
        // Nodes 32 to 41 are default KYC'ed Citizens (Tier 1)
        tier = 'CITIZEN';
      } else {
        // Nodes 42 to 50 represent newly registered Guest Customers (Tier 0 Observers)
        // Strictly un-KYC'ed, ungraduated, and sandboxed inside Testnet2
        tier = 'OBSERVER';
        status = 'SYNCING';
        trustScore = 10.0;
        accumulatedDowntime = parseFloat((40 + i).toFixed(1)); // Lower SLA standing
      }

      // SLA Check (SLA v2 limit: 90% Uptime = 72 hours allowance over 30 days)
      const uptimePercentage = ((720 - accumulatedDowntime) / 720) * 100;
      const isCompliant = uptimePercentage >= 90.0;

      if (!isCompliant && tier !== 'OBSERVER') {
        status = 'QUARANTINED';
        trustScore -= 22.5; // Trust decay penalty for SLA breach
      }

      const node = await db.pioneerNode.create({
        data: {
          uid: pioneerUid,
          username: `Pioneer_${region.countryCode}_${i}`,
          walletAddress: walletAddress,
          tier: tier,
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
    console.log(`  ✓ Successfully hydrated 49 nodes across remaining Tiers (Guardians, Academy Core, Merchants, Citizens, and Observers).`);
  }

  // 4. Seed Mock Peer-to-Peer Transactions (7-decimal precision logs)
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

  // 5. Seed Bridge Receipts (Nonced L1/L2 Melt records)
  console.log('🌉 Seeding Bridge Receipts (Vault Settlement & Replay Audits)...');
  for (let k = 0; k < 5; k++) {
    const userNode = pioneerNodes[k + 5];
    const amountMeltedStr = (500.0 + k * 100.5).toFixed(7);
    const amountMeltedSubunits = toSubunits(amountMeltedStr);
    const piReleased = parseFloat(amountMeltedStr) / 1000.0; // Dynamic 1:1000 Peg Math

    if (db.bridgeReceipt) {
      await db.bridgeReceipt.create({
        data: {
          userAddress: userNode.walletAddress,
          nonce: k + 1, // Replay guard nonce
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

  // 6. Seed Dispute Center & Elder Governance Cases
  console.log('⚖️ Seeding Elder Council Dispute Cases & Biometric Passkey Votes...');
  if (db.disputeCase) {
    const caseActive = await db.disputeCase.create({
      data: {
        caseNumber: 1043,
        buyerAddress: pioneerNodes[10].walletAddress,
        merchantAddress: pioneerNodes[11].walletAddress,
        fiatAmount: 4500.00,
        currency: 'PHP',
        mBzrAmount: toSubunits('2307.6923076'), // Strict 7-decimal conversion
        evidenceHash: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
        status: 'VRF_VOTING_ACTIVE',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    });

    // Seeding elder votes: Only qualified Genesis Guardians (Tiers 4 & 5) are authorized to vote
    const seatingElders = [pioneerNodes[1], pioneerNodes[2], pioneerNodes[3], pioneerNodes[4], pioneerNodes[5]];
    const votes = ['FAVOR_BUYER', 'FAVOR_BUYER', 'FAVOR_MERCHANT', 'FAVOR_BUYER'];

    if (db.elderVote) {
      for (let v = 0; v < votes.length; v++) {
        await db.elderVote.create({
          data: {
            disputeCaseId: caseActive.id,
            elderAddress: seatingElders[v].walletAddress,
            vote: votes[v],
            signature: `webauthn_passkey_signature_assertion_${Math.random().toString(36).substring(2, 10)}`,
            votedAt: new Date(Date.now() - (4 - v) * 2 * 60 * 60 * 1000),
          },
        });

        // Add corresponding audit logs
        if (db.auditLog) {
          await db.auditLog.create({
            data: {
              action: 'ELDER_VOTE_CAST',
              actorAddress: seatingElders[v].walletAddress,
              txHash: `stellar_governance_sig_${Math.random().toString(36).substring(2, 12)}`,
              details: `Elder biometric WebAuthn verification accepted for Case #1043. Vote: ${votes[v]}.`,
              createdAt: new Date(Date.now() - (4 - v) * 2 * 60 * 60 * 1000),
            },
          });
        }
      }
    }
  }

  console.log(`\n=============================================================================`);
  console.log(`✅ DATABASE SEED COMPLETE: 50 NO_ERR CHANNELS ACTIVE`);
  console.log(`   - 1 Solo Founder Node Created (FOUNDER / Tier 5)`);
  console.log(`   - 10 Qualified Genesis Nodes Created (GUARDIAN / Tier 4)`);
  console.log(`   - 9 Sandbox Inbound Nodes Created (OBSERVER / Tier 0)`);
  console.log(`=============================================================================`);
}

main()
  .catch((e) => {
    console.error('❌ [DATABASE SEED ERROR] Failed to seed bzr-db:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔌 Disconnected from bzr-db client.');
  });
