import prisma from '../lib/prisma';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

async function runDisputeSimulation() {
  console.log('🏛️  Initializing 5-Elder VRF Dispute Escalation Simulation...');

  const now = Date.now();
  const escrowId = `ESC_VRF_SIM_${now}`;
  const consumerUid = 'usr_pioneer_consumer_01';
  const providerUid = 'usr_provider_node_01';
  const bondAmount = 5000.0; // 5,000 mBZR security bond

  // 1. Ensure Provider exists
  let provider = await prisma.serviceProvider.findFirst({
    where: { providerUid },
  });

  if (!provider) {
    provider = await prisma.serviceProvider.create({
      data: {
        businessName: 'Alpha Mesh Compute Provider',
        category: 'COMPUTE',
        description: 'Decentralized high-throughput compute node',
        providerUid,
        sectorLocation: 'Sector-9',
        mbzrRate: 20.0,
        unitLabel: 'hr',
      },
    });
  }

  // 2. Ensure PioneerNodes exist (Consumer, Provider, and 5 Elders)
  const nodeIds = [
    consumerUid,
    providerUid,
    'usr_elder_1',
    'usr_elder_2',
    'usr_elder_3',
    'usr_elder_4',
    'usr_elder_5',
  ];

  for (const uid of nodeIds) {
    await prisma.pioneerNode.upsert({
      where: { uid },
      update: {
        isElderEligible: uid.startsWith('usr_elder_'),
        isContributorUnlocked: true,
      },
      create: {
        uid,
        username: uid,
        walletAddress: uid,
        status: 'ACTIVE',
        isElderEligible: uid.startsWith('usr_elder_'),
        isContributorUnlocked: true,
        mbzrBalance: 10000.0,
      },
    });
  }

  // 3. Create EscrowLock with unique nonces
  const escrow = await prisma.escrowLock.create({
    data: {
      escrowId,
      paymentId: `pay_dispute_${now}`,
      txid: `tx_dispute_${now}`,
      consumerUid,
      providerId: provider.id,
      amount: 50.0,
      token: 'PI',
      status: 'DISPUTED',
      timelockExpiresAt: new Date(Date.now() + 172800000), // 48h
      serviceDescription: 'Protocol 28 DePIN Computing Relay Contract',
    },
  });

  console.log(`✅ EscrowLock created: ${escrow.escrowId} (Status: ${escrow.status})`);

  // 4. VRF Council Selection: Pick 5 distinct active Elders
  const availableElders = await prisma.pioneerNode.findMany({
    where: {
      isElderEligible: true,
      status: 'ACTIVE',
      isUnderRemoteRescue: false,
      uid: { notIn: [consumerUid, providerUid] },
    },
    take: 5,
  });

  const selectedElderUids = availableElders.map((e) => e.uid);
  console.log(`🎲 VRF Council Selected: [${selectedElderUids.join(', ')}]`);

  // 5. Create DisputeRecord using pure relation connect
  const dispute = await prisma.disputeRecord.create({
    data: {
      escrowLock: {
        connect: { id: escrow.id },
      },
      initiatorUid: consumerUid,
      bondAmount: bondAmount,
      reason: 'Relay latency exceeded 450ms SLA; ZK peer discovery dropped packets.',
      status: 'VOTING',
    },
  });

  // 6. Record 4 Elder Votes (3 for Consumer, 1 for Merchant = 3-1 Majority)
  await prisma.voteRecord.createMany({
    data: [
      { disputeId: dispute.id, voterUid: selectedElderUids[0] || 'usr_elder_1', decision: 'REFUND_CONSUMER' },
      { disputeId: dispute.id, voterUid: selectedElderUids[1] || 'usr_elder_2', decision: 'REFUND_CONSUMER' },
      { disputeId: dispute.id, voterUid: selectedElderUids[2] || 'usr_elder_3', decision: 'REFUND_CONSUMER' },
      { disputeId: dispute.id, voterUid: selectedElderUids[3] || 'usr_elder_4', decision: 'RELEASE_MERCHANT' },
    ],
  });

  console.log(`📥 4 Elder votes cast: 3 REFUND_CONSUMER vs 1 RELEASE_MERCHANT.`);
  console.log(`⚖️  Resolving Dispute ID: ${dispute.id}...`);

  // 7. Execute 75/25 Schelling settlement directly in DB
  const nonBiasVotes = [selectedElderUids[0] || 'usr_elder_1', selectedElderUids[1] || 'usr_elder_2', selectedElderUids[2] || 'usr_elder_3'];
  const winningEldersCount = nonBiasVotes.length;
  const winnerCompensationMbzr = bondAmount * 0.75;
  const elderPoolTotalMbzr = bondAmount * 0.25;
  const rewardPerElderMbzr = elderPoolTotalMbzr / winningEldersCount;
  const principalEscrowMbzr = escrow.amount * 1000;
  const totalWinnerCreditMbzr = principalEscrowMbzr + winnerCompensationMbzr;

  await prisma.$transaction(async (tx) => {
    await tx.disputeRecord.update({
      where: { id: dispute.id },
      data: { status: 'RESOLVED_CONSUMER' },
    });

    await tx.escrowLock.update({
      where: { id: escrow.id },
      data: { status: 'REFUNDED' },
    });

    await tx.pioneerNode.update({
      where: { uid: consumerUid },
      data: {
        mbzrBalance: { increment: totalWinnerCreditMbzr },
      },
    });

    for (const elderUid of nonBiasVotes) {
      await tx.pioneerNode.update({
        where: { uid: elderUid },
        data: {
          mbzrBalance: { increment: rewardPerElderMbzr },
        },
      });
    }

    await tx.meshLedger.create({
      data: {
        walletId: consumerUid,
        txSignature: `DISPUTE_SETTLE_${dispute.id}_${now}`,
        txType: 'SERVICE_SETTLEMENT',
        piAmount: escrow.amount,
        mbzrAmount: totalWinnerCreditMbzr,
        status: 'CONFIRMED',
        description: `Dispute ${dispute.id} settled in RESOLVED_CONSUMER. Winner credited ${totalWinnerCreditMbzr} mBZR (Principal: ${escrow.amount} Pi + 75% Bond: ${winnerCompensationMbzr} mBZR). Elder yield: ${rewardPerElderMbzr.toFixed(2)} mBZR across ${winningEldersCount} elders.`,
      },
    });

    await tx.auditLog.create({
      data: {
        action: '5_ELDER_VRF_DISPUTE_RESOLVED',
        payload: JSON.stringify({
          disputeId: dispute.id,
          escrowId: escrow.escrowId,
          ruling: 'RESOLVED_CONSUMER',
          winnerUid: consumerUid,
          loserUid: providerUid,
          loserBondMbzr: bondAmount,
          winnerCompensationMbzr,
          elderPoolTotalMbzr,
          participatingMajorityElders: winningEldersCount,
          rewardPerElderMbzr,
        }),
        nodeId: consumerUid,
      },
    });
  });

  console.log('\n--- 75/25 Schelling Mathematical Settlement ---');
  console.log(`Status:                       DISPUTE SETTLED -> RESOLVED_CONSUMER`);
  console.log(`Escrow State:                 REFUNDED`);
  console.log(`Forfeited Loser Bond:         ${bondAmount.toFixed(2)} mBZR`);
  console.log(`Principal Escrow Refund:      ${principalEscrowMbzr.toFixed(2)} mBZR (${escrow.amount} PI)`);
  console.log(`Winner 75% Bond Compensation: ${winnerCompensationMbzr.toFixed(2)} mBZR`);
  console.log(`Total Winner Credit:          ${totalWinnerCreditMbzr.toFixed(2)} mBZR`);
  console.log(`Total 25% Elder Pool:         ${elderPoolTotalMbzr.toFixed(2)} mBZR`);
  console.log(`Majority Voters (3 Elders):   ${rewardPerElderMbzr.toFixed(2)} mBZR each`);
  console.log(`Minority Dissenter (1 Elder): 0.00 mBZR (Slashed)`);
}

runDisputeSimulation()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
