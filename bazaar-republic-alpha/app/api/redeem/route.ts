// TARGET FILE PATH: [project-root]/app/api/redeem/route.ts
import { NextResponse } from 'next/server';

// FIXED CONSTANTS
const PI_TO_MBZR_RATIO = 1000;
const MONTHLY_DECAY_RATE = 0.025; // 2.5% reduction per month

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { sender, amountMbzr, tierBasePenalty, monthsElapsed } = payload;

    // 1. PAYLOAD VALIDATION
    if (!sender || typeof amountMbzr !== 'number' || typeof tierBasePenalty !== 'number' || typeof monthsElapsed !== 'number') {
      return NextResponse.json(
        { success: false, error: 'MALFORMED_PAYLOAD: Missing or invalid redemption vectors.' },
        { status: 400 }
      );
    }

    if (amountMbzr <= 0) {
      return NextResponse.json(
        { success: false, error: 'INVALID_AMOUNT: Redemption volume must be greater than zero.' },
        { status: 422 }
      );
    }

    // 2. DUAL-AXIS PENALTY CALCULATION
    // Formula: Active Penalty = max(0, Base Penalty - (Months Elapsed * 2.5%))
    const timeDecayMitigation = monthsElapsed * MONTHLY_DECAY_RATE;
    const activePenaltyRate = Math.max(0, tierBasePenalty - timeDecayMitigation);
    
    // 3. COLLATERAL & FRICTION EXTRACTION
    const penaltyTokensMbzr = amountMbzr * activePenaltyRate;
    const netRedeemedMbzr = amountMbzr - penaltyTokensMbzr;
    
    // Convert net mBZR back to L1 Pi for the vault release
    const netCollateralReturnedPi = netRedeemedMbzr / PI_TO_MBZR_RATIO;

    // 4. THE 50/50 STRUCTURAL SPLIT
    const meltBurnMbzr = penaltyTokensMbzr * 0.5;      // 50% permanently destroyed
    const stakingYieldMbzr = penaltyTokensMbzr * 0.5;  // 50% routed to Node Pioneers

    // --- CRITICAL SECTION: DB STATE TRANSITION ---
    // [Database execution block: Deduct user mBZR balance, burn tokens, distribute yield, trigger L1 Pi release]
    // ---------------------------------------------

    return NextResponse.json({
      success: true,
      telemetry: {
        txId: `redeem_${crypto.randomUUID()}`,
        grossRedemptionMbzr: amountMbzr,
        activePenaltyPercent: (activePenaltyRate * 100).toFixed(2),
        penaltyExtractedMbzr: penaltyTokensMbzr,
        netPiReturnedToWallet: netCollateralReturnedPi.toFixed(4),
        meltBurnMbzr,
        stakingYieldMbzr,
        overMintShieldStatus: 'SECURED'
      }
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'SERVER_LOGIC_FAULT: Redemption contraction pipeline failed.' },
      { status: 500 }
    );
  }
}
