// TARGET FILE PATH: [project-root]/app/api/transaction/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// FIXED STRUCTURAL BOUNDARIES
const TARGET_SAFETY_RESERVE_MBZR = 2_500_000; // 2.5M mBZR target reserve
const BASELINE_PROCESSING_RATE = 0.01;      // 1.0% base rate
const ALPHA_SENSITIVITY = 1.0;              // Linear sensitivity curve
const MIN_TAX_MBZR = 10;                    // Absolute floor (anti-spam)
const MAX_TAX_MBZR = 500;                   // Absolute ceiling

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => null);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'MALFORMED_PAYLOAD: Invalid JSON stream.' },
        { status: 400 }
      );
    }

    const sender = typeof payload.sender === 'string' ? payload.sender.trim() : '';
    const receiver = typeof payload.receiver === 'string' ? payload.receiver.trim() : '';
    const amountMbzr = Number(payload.amountMbzr);
    const currentTreasuryBalance = Number(payload.currentTreasuryBalance);

    // 1. INBOUND PAYLOAD VALIDATION
    if (
      !sender ||
      !receiver ||
      !Number.isFinite(amountMbzr) ||
      amountMbzr <= 0 ||
      !Number.isFinite(currentTreasuryBalance)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'MALFORMED_PAYLOAD: Missing or invalid transaction vectors.',
        },
        { status: 400 }
      );
    }

    // 2. MACRO-PRUDENTIAL HEALTH CALCULATION (Ht)
    const treasuryHealthRatio = currentTreasuryBalance / TARGET_SAFETY_RESERVE_MBZR;
    const safeHealthRatio = treasuryHealthRatio > 0.01 ? treasuryHealthRatio : 0.01;

    // 3. DYNAMIC RATE CALCULATION
    const dynamicRate =
      BASELINE_PROCESSING_RATE * Math.pow(1 / safeHealthRatio, ALPHA_SENSITIVITY);
    const calculatedBaseFee = amountMbzr * dynamicRate;

    // 4. THE CLAMP GATE (Enforcing Min/Max Boundaries)
    const finalAppliedTax = Math.min(
      MAX_TAX_MBZR,
      Math.max(MIN_TAX_MBZR, calculatedBaseFee)
    );

    // 5. TRANSACTION BALANCE CHECK
    if (amountMbzr <= finalAppliedTax) {
      return NextResponse.json(
        {
          success: false,
          error:
            'INSUFFICIENT_VALUE: Transaction volume is entirely consumed by the Minimum Tax Floor.',
        },
        { status: 422 }
      );
    }

    // 6. PIPELINE ROUTING & SPLIT LOGIC
    const netTransferMbzr = amountMbzr - finalAppliedTax;
    const meltBurnMbzr = finalAppliedTax * 0.5;
    const stakingYieldMbzr = finalAppliedTax * 0.5;

    return NextResponse.json(
      {
        success: true,
        telemetry: {
          txId: `tx_${crypto.randomUUID()}`,
          sender,
          receiver,
          grossVolumeMbzr: amountMbzr,
          netDeliveredMbzr: netTransferMbzr,
          appliedTaxMbzr: finalAppliedTax,
          effectiveTaxRatePercent: ((finalAppliedTax / amountMbzr) * 100).toFixed(2),
          treasuryHealthRatio: (treasuryHealthRatio * 100).toFixed(2),
          meltBurnMbzr,
          stakingYieldMbzr,
          overMintShieldStatus: 'SECURED',
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'SERVER_LOGIC_FAULT: Treasury correlation pipeline failed.',
      },
      { status: 500 }
    );
  }
}