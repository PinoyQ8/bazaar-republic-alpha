import { prisma } from '../lib/prisma';

async function runDisputeWorkflow() {
  const db = prisma as any;
  const escrowId = 'ESC_VRF_SIM_9928';
  const consumerUid = 'usr_pioneer_consumer_01';
  const providerUidVal = 'usr_provider_node_01';

  console.log('1. Initializing ServiceProvider and Escrow in DB...');

  // 1. Fetch or create valid ServiceProvider
  let provider = await db.serviceProvider.findFirst({
    where: { providerUid: providerUidVal }
  });

  if (!provider) {
    provider = await db.serviceProvider.create({
      data: {
        providerUid: providerUidVal,
        businessName: 'MeshTech Relayer Node',
        category: 'DePIN Compute',
        description: 'Decentralized Compute & Storage Node',
        sectorLocation: 'X570-Master',
        mbzrRate: 10.0,
        unitLabel: 'hr',
        isVerified: true
      }
    });
  }

  // 2. Create or update the disputed EscrowLock
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
      serviceDescription: 'Protocol 28 DePIN Dispute Simulation'
    }
  });

  // 3. Seed PioneerNode records to receive bond and refund balances
  const accounts = [consumerUid, providerUidVal, 'usr_elder_1', 'usr_elder_2', 'usr_elder_3', 'usr_elder_4', 'usr_elder_5'];
  for (const uid of accounts) {
    await db.pioneerNode.upsert({
      where: { uid },
      update: {},
      create: {
        uid,
        username: uid,
        walletAddress: uid,
        trustScore: 100.0,
        mbzrBalance: 10000.0,
        status: 'ACTIVE'
      }
    }).catch(() => null);
  }

  // 4. Safely clean up any existing test dispute for this initiator
  try {
    const existing = await db.disputeRecord.findFirst({
      where: { initiatorUid: consumerUid }
    });
    if (existing) {
      if (db.voteRecord) {
        await db.voteRecord.deleteMany({ where: { disputeId: existing.id } }).catch(() => null);
      }
      await db.disputeRecord.delete({ where: { id: existing.id } }).catch(() => null);
    }
  } catch {}

  // 5. Create DisputeRecord with schema-verified fields only
  const dispute = await db.disputeRecord.create({
    data: {
      escrowLock: {
        connect: { id: escrow.id }
      },
      initiatorUid: consumerUid,
      status: 'VOTING'
    }
  });

  // 6. Record 4 Elder votes (3 YES -> Refund Consumer, 1 NO -> Release Merchant)
  if (db.voteRecord) {
    try {
      await db.voteRecord.createMany({
        data: [
          { disputeId: dispute.id, voterUid: 'usr_elder_1', decision: 'YES' },
          { disputeId: dispute.id, voterUid: 'usr_elder_2', decision: 'YES' },
          { disputeId: dispute.id, voterUid: 'usr_elder_3', decision: 'YES' },
          { disputeId: dispute.id, voterUid: 'usr_elder_4', decision: 'NO' }
        ]
      });
    } catch (vErr: any) {
      console.log('VoteRecord registration note:', vErr?.message || vErr);
    }
  }

  console.log('✅ VRF Dispute created successfully! ID:', dispute.id);
  console.log('2. Triggering API Resolution Endpoint...');

  // 7. Invoke resolution API endpoint
  const response = await fetch('http://localhost:3000/api/escrow/dispute/resolve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      disputeId: dispute.id,
      escrowId: escrow.escrowId,
      ruling: 'FAVOR_CONSUMER'
    })
  });

  const result = await response.json();
  console.log('====================================');
  console.log('RESOLVE API RESPONSE:');
  console.log(JSON.stringify(result, null, 2));
  console.log('====================================');

  process.exit(0);
}

runDisputeWorkflow().catch((err) => {
  console.error('Workflow failed:', err);
  process.exit(1);
});
