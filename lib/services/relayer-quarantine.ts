import prisma from '../../lib/prisma';
import { NodeStatus } from '@prisma/client';
import { processQuarantinedEscrows } from './escrow-quarantine';

export interface QuarantineParams {
  targetAddress: string;
  vaultAddress: string;
  evacuatedAmount: number;
  sweepTxHash: string;
  settledLedger?: number | null;
}

export async function processShieldQuarantineAndRelay(params: QuarantineParams) {
  const { targetAddress, vaultAddress, evacuatedAmount, sweepTxHash, settledLedger } = params;

  console.log(`[Relayer] Synchronizing L2 state for target ${targetAddress.slice(0, 8)}...`);

  let escrowResult: { reroutedCount: number } = { reroutedCount: 0 };

  // 1. Locate and quarantine PioneerNode
  const node = await prisma.pioneerNode.findFirst({
    where: {
      OR: [
        { walletAddress: targetAddress },
        { shieldAccount: { targetAddress } },
      ],
    },
  });

  if (node) {
    await prisma.pioneerNode.update({
      where: { id: node.id },
      data: {
        status: NodeStatus.QUARANTINED,
        isUnderRemoteRescue: true,
        quarantineStatus: 'QUARANTINED',
        quarantineReason: `RFC-002: L1 Master key revoked. Evacuated to vault ${vaultAddress.slice(0, 8)}...`,
        quarantineDate: new Date(),
        vaultAddress: vaultAddress,
        isElderEligible: false,
        isContributorUnlocked: false,
      },
    });
    console.log(`🔒 [PioneerNode] Node UID ${node.uid} (${node.username || 'unnamed'}) quarantined and governance stripped.`);

    // 2. Intercept and reroute active merchant escrows
    escrowResult = await processQuarantinedEscrows(node.uid, vaultAddress);

    // 3. Write structured audit trail
    await prisma.auditLog.create({
      data: {
        action: 'RFC002_NODE_QUARANTINE',
        payload: JSON.stringify({
          targetAddress,
          vaultAddress,
          nodeUid: node.uid,
          evacuatedAmount,
          sweepTxHash,
          settledLedger,
          reroutedEscrows: escrowResult.reroutedCount,
        }),
        nodeId: node.id,
      },
    });
  } else {
    console.log(`ℹ️ [PioneerNode] No active L2 node profile found registered for ${targetAddress.slice(0, 8)}.`);
  }

  // 4. Query active shield count
  const activeShieldsCount = await prisma.shieldAccount.count({
    where: { status: 'NEUTRALIZED_REVOKED' },
  });

  // 5. Upsert RelayerSyncState using primary key `id`
  const syncState = await prisma.relayerSyncState.upsert({
    where: { id: 'pi-testnet-relayer' },
    update: {
      network: 'pi-testnet',
      lastLedger: settledLedger || undefined,
      lastSweepTx: sweepTxHash,
      totalPiEvacuated: { increment: evacuatedAmount },
      activeShields: activeShieldsCount,
      syncedAt: new Date(),
    },
    create: {
      id: 'pi-testnet-relayer',
      network: 'pi-testnet',
      lastLedger: settledLedger || 0,
      lastSweepTx: sweepTxHash,
      totalPiEvacuated: evacuatedAmount,
      activeShields: activeShieldsCount,
      syncedAt: new Date(),
    },
  });

  console.log(`🔄 [RelayerSyncState] Relayer height: ${syncState.lastLedger} | Total Evacuated: ${syncState.totalPiEvacuated} Pi | Active Shields: ${syncState.activeShields}`);

  return { node, syncState, reroutedEscrows: escrowResult.reroutedCount };
}