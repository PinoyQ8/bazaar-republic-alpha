import prisma from '../lib/prisma';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const TARGET_PUB = 'GCN3PWTGHVJ7HRMBD43THOWZ6KVGLUFIVGGYJDQMFSRJK3CTTTZ5PQJR';

async function seed() {
  console.log(`Checking PioneerNode for target wallet ${TARGET_PUB.slice(0, 8)}...`);

  const node = await prisma.pioneerNode.upsert({
    where: { uid: 'pioneer_test_target_01' },
    update: {
      walletAddress: TARGET_PUB,
      isElderEligible: true,
      isContributorUnlocked: true,
      status: 'ACTIVE',
      quarantineStatus: 'NONE',
      isUnderRemoteRescue: false,
    },
    create: {
      uid: 'pioneer_test_target_01',
      username: 'target_pioneer_alpha',
      walletAddress: TARGET_PUB,
      tier: 'PIONEER',
      status: 'ACTIVE',
      isElderEligible: true,
      isContributorUnlocked: true,
      trustScore: 98.5,
      completedAlphaSessions: 5,
    },
  });

  // Link ShieldAccount to PioneerNode
  await prisma.shieldAccount.update({
    where: { targetAddress: TARGET_PUB },
    data: { pioneerUid: node.uid },
  });

  console.log('✅ PioneerNode initialized with active contributor & elder privileges.');
  console.log({
    uid: node.uid,
    wallet: node.walletAddress,
    status: node.status,
    isElderEligible: node.isElderEligible,
    isContributorUnlocked: node.isContributorUnlocked,
  });
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());