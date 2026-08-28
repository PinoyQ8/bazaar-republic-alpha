import { prisma } from '../lib/prisma';

async function main() {
  const node = await (prisma as any).pioneerNode.upsert({
    where: { uid: 'PinoyQ8-Node-01' },
    update: { status: 'ACTIVE', trustScore: 100.0 },
    create: {
      uid: 'PinoyQ8-Node-01',
      username: 'PinoyQ8_Genesis',
      walletAddress: 'GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3',
      tier: 'BAZAAR_FOUNDER',
      status: 'ACTIVE',
      mbzrBalance: 5000.0,
      trustScore: 100.0,
    },
  });
  console.log('✅ Identity forged:', node.uid);
}

main().catch(console.error).finally(() => (prisma as any).$disconnect());
