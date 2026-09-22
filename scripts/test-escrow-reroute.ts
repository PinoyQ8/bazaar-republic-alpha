import prisma from '../lib/prisma';
import { processShieldQuarantineAndRelay } from '../lib/services/relayer-quarantine';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

async function test() {
  const TARGET_PUB = 'GCN3PWTGHVJ7HRMBD43THOWZ6KVGLUFIVGGYJDQMFSRJK3CTTTZ5PQJR';
  const VAULT_PUB = 'GB2OSGJYMSUVSRECWDBVEP3F5HQEW2OXFTHPEXRQP2DMBKKVLALSSSRV';
  const UID = 'pioneer_test_target_01';

  console.log(`Setting up test escrow locks for node ${UID}...`);

  // 1. Ensure provider exists
  let provider = await prisma.serviceProvider.findFirst({ where: { providerUid: UID } });
  if (!provider) {
    provider = await prisma.serviceProvider.create({
      data: {
        businessName: 'Alpha Secure Services',
        category: 'COMPUTE',
        description: 'Decentralized compute relay node',
        providerUid: UID,
        sectorLocation: 'Sector-7',
        mbzrRate: 15.0,
        unitLabel: 'hr',
      },
    });
  }

  // 2. Create mock locked escrows with unique paymentId and txid nonces
  const now = Date.now();
  const providerEscrowId = `escrow_prov_${now}`;
  const consumerEscrowId = `escrow_cons_${now}`;

  const provLock = await prisma.escrowLock.create({
    data: {
      escrowId: providerEscrowId,
      paymentId: `pay_prov_${now}`,
      txid: `tx_prov_${now}`,
      consumerUid: 'usr_pioneer_consumer_01',
      providerId: provider.id,
      amount: 25.0,
      token: 'PI',
      status: 'LOCKED',
      timelockExpiresAt: new Date(Date.now() + 86400000),
      serviceDescription: 'Compute relay allocation contract',
    },
  });

  const consLock = await prisma.escrowLock.create({
    data: {
      escrowId: consumerEscrowId,
      paymentId: `pay_cons_${now}`,
      txid: `tx_cons_${now}`,
      consumerUid: UID,
      providerId: provider.id,
      amount: 10.0,
      token: 'PI',
      status: 'LOCKED',
      timelockExpiresAt: new Date(Date.now() + 86400000),
      serviceDescription: 'Hardware mesh lease agreement',
    },
  });

  console.log(`Created test locks: ${provLock.escrowId} and ${consLock.escrowId}`);

  // 3. Trigger Quarantine & Escrow Interception
  const result = await processShieldQuarantineAndRelay({
    targetAddress: TARGET_PUB,
    vaultAddress: VAULT_PUB,
    evacuatedAmount: 0,
    sweepTxHash: `MOCK_ESCROW_TX_${now}`,
  });

  console.log(`Interception result: ${result.reroutedEscrows} escrow(s) tagged.`);

  // 4. Verify DB updates
  const updatedProv = await prisma.escrowLock.findUnique({ where: { id: provLock.id } });
  const updatedCons = await prisma.escrowLock.findUnique({ where: { id: consLock.id } });
  const auditLogs = await prisma.auditLog.findMany({
    where: { action: 'RFC002_NODE_QUARANTINE' },
    orderBy: { timestamp: 'desc' },
    take: 1,
  });

  console.log('\n--- Updated Escrow Descriptions ---');
  console.log('Provider Escrow:', updatedProv?.serviceDescription);
  console.log('Consumer Escrow:', updatedCons?.serviceDescription);
  console.log('\n--- Latest AuditLog Entry ---');
  console.dir(auditLogs[0], { depth: null, colors: true });
}

test()
  .catch(console.error)
  .finally(() => prisma.$disconnect());