import prisma from '../lib/prisma';
import { processShieldQuarantineAndRelay } from '../lib/services/relayer-quarantine';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

async function main() {
  const neutralized = await prisma.shieldAccount.findMany({
    where: { status: 'NEUTRALIZED_REVOKED' },
    include: { recoveries: true },
  });

  console.log(`Found ${neutralized.length} neutralized accounts to sync.`);

  for (const acc of neutralized) {
    const totalEvacuated = acc.recoveries.reduce((sum, r) => sum + r.evacuatedAmount, 0);
    const latestRecovery = acc.recoveries[acc.recoveries.length - 1];

    if (latestRecovery) {
      await processShieldQuarantineAndRelay({
        targetAddress: acc.targetAddress,
        vaultAddress: acc.recoveryVault,
        evacuatedAmount: totalEvacuated,
        sweepTxHash: latestRecovery.sweepTxHash,
        settledLedger: latestRecovery.settledLedger ?? undefined,
      });
    }
  }

  const nodes = await prisma.pioneerNode.findMany({
    select: {
      uid: true,
      username: true,
      walletAddress: true,
      status: true,
      isUnderRemoteRescue: true,
      quarantineStatus: true,
      quarantineReason: true,
      vaultAddress: true,
      isElderEligible: true,
      isContributorUnlocked: true,
    },
  });
  console.log('\n--- Pioneer Nodes in DB ---');
  console.dir(nodes, { depth: null, colors: true });

  const relayer = await prisma.relayerSyncState.findMany();
  console.log('\n--- Relayer Sync State ---');
  console.dir(relayer, { depth: null, colors: true });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
