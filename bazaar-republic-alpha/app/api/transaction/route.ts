// TARGET FILE PATH: [project-root]/app/api/transaction/route.ts
import { NextResponse } from 'next/server';

// FIXED STRUCTURAL BOUNDARIES
const TARGET_SAFETY_RESERVE_MBZR = 2500000; // 2.5 KG Synthetic Gold Target
const BASELINE_PROCESSING_RATE = 0.01;      // 1.0% Base Rate
const ALPHA_SENSITIVITY = 1.0;              // Linear sensitivity curve
const MIN_TAX_MBZR = 10;                    // Absolute Floor (Anti-Spam)
const MAX_TAX_MBZR = 500;                   // Absolute Ceiling (Whale Friction Limit)

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { sender, receiver, amountMbzr, currentTreasuryBalance } = payload;

    // 1. INBOUND PAYLOAD VALIDATION
    if (!sender || !receiver || typeof amountMbzr !== 'number' || typeof currentTreasuryBalance !== 'number') {
      return NextResponse.json(
        { success: false, error: 'MALFORMED_PAYLOAD: Missing or invalid transaction vectors.' },
        { status: 400 }
      );
    }

    // 2. MACRO-PRUDENTIAL HEALTH CALCULATION (Ht)
    const treasuryHealthRatio = currentTreasuryBalance / TARGET_SAFETY_RESERVE_MBZR;
    
    // Safety fallback to prevent divide-by-zero if Treasury is completely drained
    const safeHealthRatio = treasuryHealthRatio > 0.01 ? treasuryHealthRatio : 0.01;

    // 3. DYNAMIC RATE CALCULATION
    const dynamicRate = BASELINE_PROCESSING_RATE * Math.pow((1 / safeHealthRatio), ALPHA_SENSITIVITY);
    const calculatedBaseFee = amountMbzr * dynamicRate;

    // 4. THE CLAMP GATE (Enforcing Min/Max Boundaries)
    const finalAppliedTax = Math.min(MAX_TAX_MBZR, Math.max(MIN_TAX_MBZR, calculatedBaseFee));

    // 5. TRANSACTION BALANCE CHECK
    if (amountMbzr <= finalAppliedTax) {
      return NextResponse.json(
        { success: false, error: 'INSUFFICIENT_VALUE: Transaction volume is entirely consumed by the Minimum Tax Floor.' },
        { status: 422 }
      );
    }

    // 6. PIPELINE ROUTING & SPLIT LOGIC
    const netTransferMbzr = amountMbzr - finalAppliedTax;
    const meltBurnMbzr = finalAppliedTax * 0.5;      // 50% to Void
    const stakingYieldMbzr = finalAppliedTax * 0.5;  // 50% to Node Pioneers

    // --- CRITICAL SECTION: DB STATE TRANSITION ---
    // [Database execution block to safely deduct and route balances atomically]
    // ---------------------------------------------

    return NextResponse.json({
      success: true,
      telemetry: {
        txId: `tx_${crypto.randomUUID()}`,
        grossVolumeMbzr: amountMbzr,
        netDeliveredMbzr: netTransferMbzr,
        appliedTaxMbzr: finalAppliedTax,
        effectiveTaxRatePercent: ((finalAppliedTax / amountMbzr) * 100).toFixed(2),
        treasuryHealthRatio: (treasuryHealthRatio * 100).toFixed(2),
        meltBurnMbzr,
        stakingYieldMbzr,
        overMintShieldStatus: 'SECURED'
      }
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'SERVER_LOGIC_FAULT: Treasury correlation pipeline failed.' },
      { status: 500 }
    );
  }
}