import { prisma } from '../lib/prisma';

async function runDisputeWorkflow() {
  const db = prisma as any;
  const escrowId = 'ESC_DISPUTE_7741';
  const consumerUid = 'usr_pioneer_consumer_01';
  const providerWallet = 'GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3';
  const bondAmount = 5000.0;

  console.log('1. Upserting Pioneer Nodes & Service Provider...');

  const accounts = [
    { uid: consumerUid, username: 'Consumer_Pioneer_01' },
    { uid: providerWallet, username: 'Provider_Node_01' },
    { uid: 'usr_elder_1', username: 'Elder_Judge_01' },
    { uid: 'usr_elder_2', username: 'Elder_Judge_02' },
    { uid: 'usr_elder_3', username: 'Elder_Judge_03' },
    { uid: 'usr_elder_4', username: 'Elder_Judge_04' },
    { uid: 'usr_elder_5', username: 'Elder_Judge_05' },
  ];

  for (const acc of accounts) {
    await db.pioneerNode.upsert({
      where: { uid: acc.uid },
      update: { username: acc.username },
      create: {
        uid: acc.uid,
        username: acc.username,
        walletAddress: acc.uid,
        trustScore: 100,
        mbzrBalance: 10000.0,
        status: 'ACTIVE'
      }
    }).catch(() => null);
  }

  let provider = await db.serviceProvider.findFirst({
    where: { providerUid: providerWallet }
  });

  if (!provider) {
    provider = await db.serviceProvider.create({
      data: {
        businessName: 'Apex DePIN Relayer Node',
        category: 'INFRASTRUCTURE',
        description: 'Protocol 28 telemetry bridge',
        providerUid: providerWallet,
        sectorLocation: 'SECTOR-01-KUWAIT',
        mbzrRate: 15.0,
        unitLabel: 'EPOCH',
        isVerified: true
      }
    });
  }

  console.log('2. Upserting EscrowLock & DisputeRecord...');

  const escrow = await db.escrowLock.upsert({
    where: { escrowId },
    update: { status: 'DISPUTED' },
    create: {
      escrowId,
      consumerUid,
      providerId: provider.id,
      amount: 50.0,
      token: 'PI',
      status: 'DISPUTED',
      timelockExpiresAt: new Date(Date.now() + 172800000),
      serviceDescription: 'DePIN Relayer Telemetry Audit'
    }
  });

  // Clean stale dispute records for this escrow
  await db.disputeRecord.deleteMany({
    where: {
      OR: [
        { escrowId: escrow.escrowId },
        { escrowLockId: escrow.id }
      ]
    }
  }).catch(() => null);

  const dispute = await db.disputeRecord.create({
    data: {
      escrowLockId: escrow.id,
      escrowId: escrow.escrowId,
      claimant: consumerUid,
      defendant: providerWallet,
      initiatorUid: consumerUid,
      bondAmount: bondAmount,
      selectedElders: ['usr_elder_1', 'usr_elder_2', 'usr_elder_3', 'usr_elder_4', 'usr_elder_5'],
      votesForConsumer: 3,
      votesForMerchant: 1,
      status: 'VOTING',
      reason: 'Node latency exceeds 450ms SLA; ZK relayer failed peer discovery.'
    }
  });

  console.log('✅ Fresh Dispute created with ID:', dispute.id);
  console.log('3. Triggering /api/escrow/dispute/resolve...');

  const res = await fetch('http://localhost:3000/api/escrow/dispute/resolve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      disputeId: dispute.id,
      ruling: 'FAVOR_CONSUMER'
    })
  });

  const data = await res.json();
  console.log('\n--- 75/25 SETTLEMENT RESULT ---');
  console.log(JSON.stringify(data, null, 2));
  process.exit(0);
}

runDisputeWorkflow().catch((err) => {
  console.error('Workflow failed:', err);
  process.exit(1);
});
