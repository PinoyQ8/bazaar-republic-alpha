import { NextResponse } from 'next/server';
import { db } from '../../lib/db'; // 🛡️ Strict relative path to prevent compiler ghosts

// 🛡️ PROTOCOL CONSTANTS
const PI_TO_MBZR_RATIO = 1000;    // 1 Pi = 1,000 mBZR (Algorithmic Peg)
const MONTHLY_DECAY_RATE = 0.025; // 2.5% penalty decay per month
const MAX_REDEEM_CAP = 1000000;   // 🛡️ ALPHA SAFETY VALVE (1,000 Pi equivalent in mBZR)

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
    
    // 🛡️ 50/50 SPLIT OVERRIDE
    const meltBurnMbzr = totalPenaltyMbzr * 0.5; 
    const stakingYieldMbzr = totalPenaltyMbzr * 0.5;
    const netMbzrToUser = amountMbzr - totalPenaltyMbzr;
    
    // 🛡️ ALGORITHMIC PEG ROUTING
    const piReturned = netMbzrToUser / PI_TO_MBZR_RATIO; 

    // Generate internal synthetic signature for the burn event
    const internalBurnSignature = `mesh_burn_${crypto.randomUUID()}`;

    // --- CRITICAL SECTION: DB STATE TRANSITION ($transaction) ---
    await db.$transaction([
      db.pioneerNode.update({
        where: { uid: senderWallet },
        data: {
          mbzrBalance: { decrement: amountMbzr },
          stakedPi: { decrement: piReturned }, 
          updatedAt: new Date(),
        },
      }),
      db.meshLedger.create({
        data: {
          walletId: senderWallet, 
          txSignature: internalBurnSignature, // 🛡️ Prevents Prisma constraint fracture
          txType: 'EARLY_REDEEM',
          piAmount: piReturned,
          mbzrAmount: amountMbzr,
          status: 'CONFIRMED',
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
        txId: internalBurnSignature,
        grossRedeemedMbzr: amountMbzr,
        netMbzrToUser,
        meltBurnMbzr,
        stakingYieldMbzr,
        piReturned,
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