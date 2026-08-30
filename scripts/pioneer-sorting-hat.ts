// Location: scripts/pioneer-sorting-hat.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export type DaoRole =
  | 'GENESIS_ELDER'
  | 'MESH_VALIDATOR'
  | 'DEFI_ARBITRAGEUR'
  | 'ECO_DEVELOPER'
  | 'CADET_INITIATE';

interface SortingDecision {
  uid: string;
  assignedRole: DaoRole;
  trustScore: number;
  completedModules: number;
  tier: string;
  recommendation: string;
}

export async function sortPioneerRoster(): Promise<SortingDecision[]> {
  console.log('🎩 [MESH-SORTING-HAT] Initializing Pioneer Talent Evaluation...');

  // Location: scripts/pioneer-sorting-hat.ts

// 1. Fetch all Pioneer nodes using the type-safe bypass
const pioneers = await (prisma as any).pioneerNode.findMany();

// 2. Fetch all completed academy module records using schema-matched fields
const academyLogs = await (prisma as any).academyLog.findMany({
    where: {
      status: 'COMPLETED',
    },
  });

  const decisions: SortingDecision[] = [];

  for (const node of pioneers) {
    // Match completed logs by pioneerUid
    const userLogs = academyLogs.filter(
      (log: any) => log.pioneerUid === node.uid
    );
    const completedModules = userLogs.length;
    const ts = node.trustScore ?? 0;
    const currentTier = String(node.tier || 'CITIZEN');

    let assignedRole: DaoRole = 'CADET_INITIATE';
    let recommendation = 'Complete Module 01 & 02 in Academy.';

    // Sorting Decision Matrix
    if (completedModules >= 3 && ts >= 85) {
      assignedRole = 'GENESIS_ELDER';
      recommendation = 'Deploy to 5-Elder VRF Adjudication & Governance Council.';
    } else if (completedModules >= 2 && ts >= 60) {
      assignedRole = 'MESH_VALIDATOR';
      recommendation = 'Assign to SoloHost RPC Relay & TTL Keeper node cluster.';
    } else if (completedModules >= 3) {
      assignedRole = 'DEFI_ARBITRAGEUR';
      recommendation = 'Deploy to Mesh Vaults & AMM Liquidity pools.';
    } else if (completedModules >= 1) {
      assignedRole = 'ECO_DEVELOPER';
      recommendation = 'Deploy to E-Network Merchant Escrows & ZK Attestation bridges.';
    }

    // Touch updatedAt timestamp to register the evaluation cycle
    await (prisma as any).pioneerNode.update({
  where: { uid: node.uid },
  data: {
    updatedAt: new Date(),
  },
});

    decisions.push({
      uid: node.uid,
      assignedRole,
      trustScore: ts,
      completedModules,
      tier: currentTier,
      recommendation,
    });
  }

  return decisions;
}

// CLI Execution Entrypoint
sortPioneerRoster()
  .then((results) => {
    console.table(results);
    console.log(`✅ [SORTING COMPLETE] ${results.length} Pioneers evaluated into DAO roles.`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ [SORTING FAULT]:', err);
    process.exit(1);
  });