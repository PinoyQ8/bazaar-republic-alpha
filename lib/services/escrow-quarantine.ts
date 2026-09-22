import prisma from '../../lib/prisma';

export async function processQuarantinedEscrows(quarantinedNodeUid: string, coldVaultAddress: string) {
  console.log(`[EscrowInterceptor] Checking open escrows for quarantined node UID: ${quarantinedNodeUid}...`);

  let reroutedCount = 0;

  // 1. Check provider escrows
  const provider = await prisma.serviceProvider.findFirst({
    where: { providerUid: quarantinedNodeUid },
    include: {
      escrowLocks: {
        where: { status: { in: ['LOCKED', 'DISPUTED'] } },
      },
    },
  });

  if (provider && provider.escrowLocks.length > 0) {
    for (const lock of provider.escrowLocks) {
      if (!lock.serviceDescription.includes('[REROUTED_TO_COLD_VAULT')) {
        await prisma.escrowLock.update({
          where: { id: lock.id },
          data: {
            serviceDescription: `${lock.serviceDescription} [REROUTED_TO_COLD_VAULT: ${coldVaultAddress}]`,
          },
        });
        reroutedCount++;
      }
    }
  }

  // 2. Check consumer escrows (refund destination rerouting)
  const consumerLocks = await prisma.escrowLock.findMany({
    where: {
      consumerUid: quarantinedNodeUid,
      status: { in: ['LOCKED', 'DISPUTED'] },
    },
  });

  for (const lock of consumerLocks) {
    if (!lock.serviceDescription.includes('[REFUND_REROUTED_TO_COLD_VAULT')) {
      await prisma.escrowLock.update({
        where: { id: lock.id },
        data: {
          serviceDescription: `${lock.serviceDescription} [REFUND_REROUTED_TO_COLD_VAULT: ${coldVaultAddress}]`,
        },
      });
      reroutedCount++;
    }
  }

  console.log(`🔒 [EscrowInterceptor] Rerouted ${reroutedCount} active escrow contract(s) to cold vault ${coldVaultAddress.slice(0, 8)}...`);

  return { reroutedCount };
}