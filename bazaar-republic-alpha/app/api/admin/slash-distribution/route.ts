import { NextResponse } from 'next/server';
import { db } from '../../../lib/db'; // 🛡️ Strict relative path to avoid compiler ghosts

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { targetNodeUid, reason } = body;

    // 1. INBOUND PAYLOAD VALIDATION
    if (!targetNodeUid) {
      return NextResponse.json(
        { success: false, error: 'MALFORMED_PAYLOAD: Missing targetNodeUid vector.' },
        { status: 400 }
      );
    }

    // 2. FETCH TARGET BLACKLIST NODE
    const targetNode = await db.pioneerNode.findUnique({
      where: { uid: targetNodeUid },
    });

    if (!targetNode) {
      return NextResponse.json(
        { success: false, error: `NODE_NOT_FOUND: Node [${targetNodeUid}] does not exist.` },
        { status: 404 }
      );
    }

    if (targetNode.status === 'FROZEN') {
      return NextResponse.json(
        { success: false, error: `NODE_ALREADY_FROZEN: Node [${targetNodeUid}] is already blacklisted.` },
        { status: 422 }
      );
    }

    const slashedPiPool = targetNode.stakedPi;
    const slashedMbzrPool = targetNode.mbzrBalance;

    if (slashedPiPool <= 0 && slashedMbzrPool <= 0) {
      return NextResponse.json(
        { success: false, error: `ZERO_COLLATERAL: Node [${targetNodeUid}] has no assets to slash.` },
        { status: 422 }
      );
    }

    // 3. CALCULATE THE 70/30 MESH YIELD SPLIT
    const guardianPiYield = slashedPiPool * 0.70;
    const daoTreasuryPiYield = slashedPiPool * 0.30;

    // 4. FETCH ELIGIBLE ACTIVE GUARDIANS (Trust Score > 0)
    const activeGuardians = await db.pioneerNode.findMany({
      where: {
        uid: { not: targetNodeUid },
        status: 'ACTIVE',
        tier: { in: ['MESH_GUARDIAN', 'BAZAAR_FOUNDER'] },
        trustScore: { gt: 0 },
      },
    });

    const totalTrustScore = activeGuardians.reduce(
      (sum, guardian) => sum + (guardian.trustScore || 100),
      0
    );

    // 5. ASSEMBLE ATOMIC TRANSACTION OPERATIONS
    const dbOperations: any[] = [];

    // Operation A: Freeze Target Node & Purge Balances
    dbOperations.push(
      db.pioneerNode.update({
        where: { uid: targetNodeUid },
        data: {
          status: 'FROZEN',
          trustScore: 0,
          stakedPi: 0,
          mbzrBalance: 0,
          updatedAt: new Date(),
        },
      })
    );

    // Operation B: Log Target Slashing in Immutable Ledger
    dbOperations.push(
      db.meshLedger.create({
        data: {
          walletId: targetNodeUid,
          txType: 'SLASH_EXECUTED' as any,
          piAmount: slashedPiPool,
          mbzrAmount: slashedMbzrPool,
          status: 'CONFIRMED',
        },
      })
    );

    // Operation C: Stream 70% Yield Pro-Rata to Active Guardians
    const distributionBreakdown: Array<{ uid: string; piYield: number; trustScore: number }> = [];

    if (activeGuardians.length > 0 && totalTrustScore > 0) {
      for (const guardian of activeGuardians) {
        const guardianTS = guardian.trustScore || 100;
        const weightedShare = (guardianTS / totalTrustScore) * guardianPiYield;

        distributionBreakdown.push({
          uid: guardian.uid,
          piYield: weightedShare,
          trustScore: guardianTS,
        });

        // Credit Active Guardian Balance
        dbOperations.push(
          db.pioneerNode.update({
            where: { uid: guardian.uid },
            data: {
              stakedPi: { increment: weightedShare },
              updatedAt: new Date(),
            },
          })
        );

        // Record Guardian Yield Transaction
        dbOperations.push(
          db.meshLedger.create({
            data: {
              walletId: guardian.uid,
              txType: 'SLASH_YIELD_REWARD' as any,
              piAmount: weightedShare,
              mbzrAmount: 0,
              status: 'CONFIRMED',
            },
          })
        );
      }
    }

    // Operation D: Deposit 30% Yield to DAO Treasury Reserve
    dbOperations.push(
      db.meshLedger.create({
        data: {
          walletId: 'DAO_TREASURY_RESERVE',
          txType: 'DAO_TREASURY_SWEEP' as any,
          piAmount: daoTreasuryPiYield,
          mbzrAmount: 0,
          status: 'CONFIRMED',
        },
      })
    );

    // 6. EXECUTE ATOMIC STATE TRANSITION
    await db.$transaction(dbOperations);

    console.log(`[MESH-SECURITY] Slashing & Yield Event Complete.`);
    console.log(` > Blacklisted Node: ${targetNodeUid}`);
    console.log(` > Total Slashed Pi: ${slashedPiPool}`);
    console.log(` > 70% Streamed to Guardians: ${guardianPiYield} Pi (${activeGuardians.length} nodes)`);
    console.log(` > 30% Swept to DAO Treasury: ${daoTreasuryPiYield} Pi`);

    // 7. DISPATCH TELEMETRY
    return NextResponse.json({
      success: true,
      telemetry: {
        blacklistedNodeUid: targetNodeUid,
        reason: reason || 'PCT_BLACKLIST_TRIGGER',
        slashedPiTotal: slashedPiPool,
        slashedMbzrTotal: slashedMbzrPool,
        guardianStreamTotalPi: guardianPiYield,
        daoTreasurySweepPi: daoTreasuryPiYield,
        activeGuardiansRewardedCount: activeGuardians.length,
        distributionBreakdown,
        timestamp: Date.now(),
      },
    }, { status: 200 });

  } catch (error) {
    console.error('[MESH-FRACTURE] Slashing Pipeline Terminated:', error);
    return NextResponse.json(
      { success: false, error: 'SERVER-LOGIC-FAULT: Slashing & yield distribution pipeline failed.' },
      { status: 500 }
    );
  }
}