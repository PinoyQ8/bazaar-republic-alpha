import { NextResponse } from 'next/server';
import { db } from '../../../lib/db'; // 🛡️ Strict relative path to avoid compiler ghosts

const MOCK_FLEET = [
  {
    uid: 'pi_node_alpha_01',
    status: 'ACTIVE',
    tier: 'MESH_GUARDIAN',
    stakedPi: 250,
    mbzrBalance: 250000,
    trustScore: 95,
  },
  {
    uid: 'pi_node_rogue_99', // 🎯 ROGUE TARGET NODE FOR SLASHING
    status: 'ACTIVE',
    tier: 'MESH_GUARDIAN',
    stakedPi: 500,
    mbzrBalance: 500000,
    trustScore: 15,
  },
  {
    uid: 'pi_node_beta_02',
    status: 'ACTIVE',
    tier: 'MESH_GUARDIAN',
    stakedPi: 100,
    mbzrBalance: 100000,
    trustScore: 88,
  },
  {
    uid: 'pi_node_gamma_03',
    status: 'SYNCING',
    tier: 'PIONEER',
    stakedPi: 0,
    mbzrBalance: 0,
    trustScore: 50,
  },
];

export async function POST() {
  try {
    const seededNodes = [];
    const seededTransactions = [];

    for (const nodeData of MOCK_FLEET) {
      // 1. Atomic Upsert Node State with Type Shielding
      const node = await db.pioneerNode.upsert({
        where: { uid: nodeData.uid },
        update: {
          status: nodeData.status as any,
          tier: nodeData.tier as any,
          stakedPi: nodeData.stakedPi,
          mbzrBalance: nodeData.mbzrBalance,
          trustScore: nodeData.trustScore,
          updatedAt: new Date(),
        },
        create: {
          uid: nodeData.uid,
          status: nodeData.status as any,
          tier: nodeData.tier as any,
          stakedPi: nodeData.stakedPi,
          mbzrBalance: nodeData.mbzrBalance,
          trustScore: nodeData.trustScore,
        },
      });
      seededNodes.push(node);

      // 2. Create Initial Ledger Genesis Entry if Staked > 0
      if (nodeData.stakedPi > 0) {
        const tx = await db.meshLedger.create({
          data: {
            walletId: nodeData.uid,
            txType: 'GENESIS_MINT' as any,
            piAmount: nodeData.stakedPi,
            mbzrAmount: nodeData.mbzrBalance,
            status: 'CONFIRMED',
          },
        });
        seededTransactions.push(tx);
      }
    }

    console.log(`[MESH-SEED] Test node fleet injected into MongoDB.`);

    return NextResponse.json({
      success: true,
      telemetry: {
        message: 'Mock fleet successfully seeded into MESH database.',
        seededNodesCount: seededNodes.length,
        seededTxCount: seededTransactions.length,
        rogueTargetUid: 'pi_node_rogue_99',
        timestamp: Date.now(),
      },
    }, { status: 200 });

  } catch (error) {
    console.error('[MESH-FRACTURE] Fleet Seeder Failed:', error);
    return NextResponse.json(
      { success: false, error: 'SERVER-LOGIC-FAULT: Mock fleet injection failed.' },
      { status: 500 }
    );
  }
}

// Allow GET request triggers directly from browser or curl for quick testing
export async function GET() {
  return POST();
}