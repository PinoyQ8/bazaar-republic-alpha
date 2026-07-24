import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // 🛡️ Database Bridge

// 🛡️ PROTOCOL CONSTANTS
const MONTHLY_DECAY_RATE = 0.025; // 2.5% penalty decay per month
const MAX_REDEEM_CAP = 1000000;   // 🛡️ ALPHA SAFETY VALVE (1,000 Pi equivalent)

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const senderWallet = payload.sender || payload.senderWallet;
    const { amountMbzr, tierBasePenalty, monthsElapsed } = payload;

    // 1. INBOUND PAYLOAD VALIDATION
    if (!senderWallet || typeof amountMbzr !== 'number' || typeof tierBasePenalty !== 'number' || typeof monthsElapsed !== 'number') {
      return NextResponse.json(
        { success: false, error: 'MALFORMED_PAYLOAD: Missing required Redemption vectors.' },
        { status: 400 }
      );
    }

    if (amountMbzr <= 0) {
      return NextResponse.json(
        { success: false, error: 'INVALID_AMOUNT: Redemption must be > 0.' },
        { status: 422 }
      );
    }

    if (amountMbzr > MAX_REDEEM_CAP) {
      console.warn(`[MESH-REJECT] Node [${senderWallet}] attempted redeem overflow: ${amountMbzr} mBZR`);
      return NextResponse.json(
        { success: false, error: `ALPHA-LIMIT: Maximum Early Redemption is ${MAX_REDEEM_CAP} mBZR.` },
        { status: 422 }
      );
    }

    // 2. DYNAMIC PENALTY ALGORITHM
    const activePenalty = Math.max(0, tierBasePenalty - (monthsElapsed * MONTHLY_DECAY_RATE));
    const totalPenaltyMbzr = amountMbzr * activePenalty;
    
    // 🛡️ 50/50 SPLIT
    const meltBurnMbzr = totalPenaltyMbzr * 0.5; 
    const stakingYieldMbzr = totalPenaltyMbzr * 0.5;
    const netMbzrToUser = amountMbzr - totalPenaltyMbzr;

    // --- CRITICAL SECTION: DB STATE TRANSITION ---
    await prisma.$transaction([
      prisma.pioneerNode.update({
        where: { uid: senderWallet },
        data: {
          mbzrBalance: { decrement: amountMbzr },
          stakedPi: { decrement: amountMbzr / 1000 }, 
          lastActivityTimestamp: new Date(),
        },
      }),
      prisma.meshLedger.create({
        data: {
          walletId: senderWallet,
          txType: 'EARLY_REDEEM',
          mbzrAmount: amountMbzr,
          penaltyApplied: activePenalty,
          meltBurnAmount: meltBurnMbzr,
          yieldAmount: stakingYieldMbzr,
        },
      }),
    ]);
    // ---------------------------------------------

    console.log(`[MESH-SYNC] Early Redemption Authorized.`);
    console.log(` > Node: ${senderWallet}`);
    console.log(` > Gross Redemption: ${amountMbzr} mBZR`);
    console.log(` > Applied Penalty: ${(activePenalty * 100).toFixed(2)}%`);
    console.log(` > Melted/Burned: ${meltBurnMbzr} mBZR`);
    console.log(` > Staking Yield: ${stakingYieldMbzr} mBZR`);

    // 3. TELEMETRY DISPATCH
    return NextResponse.json({
      success: true,
      telemetry: {
        txId: `redeem_${crypto.randomUUID()}`,
        grossRedeemedMbzr: amountMbzr,
        netMbzrToUser,
        meltBurnMbzr,
        stakingYieldMbzr,
        appliedPenaltyPercent: activePenalty * 100,
        timestamp: Date.now()
      }
    }, { status: 200 });

  } catch (error) {
    console.error("[MESH-FRACTURE] API Route Terminated:", error);
    return NextResponse.json(
      { success: false, error: 'SERVER-LOGIC-FAULT: Redemption pipeline failed.' },
      { status: 500 }
    );
  }
}