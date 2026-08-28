// Location: scripts/seed-canary-escrow.ts
import { prisma } from '../lib/prisma';

async function seedCanary() {
  console.log('🛡️ [ESCROW SEED] Initializing canary lock synchronization...');

  const db = prisma as any;

  // 1. Ensure Provider exists
  const provider = await db.serviceProvider.upsert({
    where: { id: '65f1a2b3c4d5e6f7a8b9c0d1' },
    update: {},
    create: {
      id: '65f1a2b3c4d5e6f7a8b9c0d1',
      businessName: 'Canary Protocol Provider',
      category: 'INFRASTRUCTURE',
      description: 'Validated Soroban smart contract provider node',
      providerUid: 'PinoyQ8-Node-01',
      sectorLocation: 'SECTOR-01-X570',
      mbzrRate: 1000.0,
      unitLabel: 'mBZR/hr',
      isVerified: true,
      totalSettlements: 1,
      rating: 5.0,
    },
  });

  console.log(`✅ [PROVIDER READY] ID: ${provider.id} (${provider.businessName})`);

  // 2. Upsert matching EscrowLock
  const escrow = await db.escrowLock.upsert({
    where: { escrowId: 'MBZR_ESCROW_CANARY_01' },
    update: {
      status: 'LOCKED',
      amount: 5.0,
      token: 'PI',
    },
    create: {
      escrowId: 'MBZR_ESCROW_CANARY_01',
      paymentId: `pay_canary_${Date.now()}`,
      txid: 'c548d3261b7cedf318cb0cd27b1300c821f76f7a169ff07e948ed73630c8eaea',
      consumerUid: 'PinoyQ8-Node-01',
      providerId: provider.id,
      amount: 5.0,
      token: 'PI',
      status: 'LOCKED',
      timelockExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      serviceDescription: 'Canary Testnet Escrow Lock',
    },
  });

  console.log(`✅ [ESCROW READY] EscrowID: ${escrow.escrowId} | Amount: ${escrow.amount} PI (${escrow.amount * 1000} mBZR)`);
}

seedCanary()
  .catch((e) => {
    console.error('❌ [SEED ERROR]', e);
    process.exit(1);
  })
  .finally(async () => {
    await (prisma as any).$disconnect();
  });