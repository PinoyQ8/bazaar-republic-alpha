import { NextRequest, NextResponse } from "next/server";
import { getStakingDb } from "@/app/lib/db/stakingDbHelper";
import {
  computeSwapAndFeeSplit,
  format7Decimals,
  parseDecimalTo7Decimals,
  SwapDirection,
} from "@/app/lib/economics/liquidityPoolMath";
import { accumulateEpochFee } from "@/app/lib/economics/epochSettlementHelper";

interface SwapRequestBody {
  direction?: SwapDirection;
  amount?: string | number;
  amountUnits?: string | number;
  rebateBps?: string | number;
  pioneerUid?: string;
  txHash?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SwapRequestBody;

    const direction: SwapDirection =
      body.direction === "MBZR_TO_PI" ? "MBZR_TO_PI" : "PI_TO_MBZR";

    let grossInputUnits: bigint;
    if (body.amountUnits !== undefined && body.amountUnits !== null && `${body.amountUnits}`.trim() !== "") {
      grossInputUnits = BigInt(`${body.amountUnits}`.trim());
    } else if (body.amount !== undefined && body.amount !== null && `${body.amount}`.trim() !== "") {
      grossInputUnits = parseDecimalTo7Decimals(body.amount);
    } else {
      return NextResponse.json(
        { success: false, error: "amount or amountUnits is required." },
        { status: 400 }
      );
    }

    if (grossInputUnits <= 0n) {
      return NextResponse.json(
        { success: false, error: "Swap amount must be greater than 0." },
        { status: 400 }
      );
    }

    let rebateBps = 0n;
    if (body.rebateBps !== undefined && body.rebateBps !== null && `${body.rebateBps}`.trim() !== "") {
      rebateBps = BigInt(`${body.rebateBps}`.trim());
    }

    const swapCalc = computeSwapAndFeeSplit(grossInputUnits, direction, rebateBps);

    // Replace or attach your actual L1/L2 execution tx hash here
    const swapTxHash =
      body.txHash?.trim() ||
      `swap_${direction.toLowerCase()}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const db = await getStakingDb();
    const feeAccrual = await accumulateEpochFee(
      {
        eventId: `swap_${swapTxHash}`,
        source: "SWAP_030_BPS",
        feeMbzrSubunits: swapCalc.feeMbzrSubunits,
        metadata: {
          direction,
          pioneerUid: body.pioneerUid?.trim() || "anonymous",
          grossInputUnits: grossInputUnits.toString(),
          effectiveFeeBps: swapCalc.effectiveFeeBps.toString(),
          swapTxHash,
        },
      },
      db
    );

    return NextResponse.json({
      success: true,
      swapTxHash,
      direction,
      grossInputUnits: grossInputUnits.toString(),
      grossInputFormatted: format7Decimals(grossInputUnits),
      feeInputUnits: swapCalc.feeInputUnits.toString(),
      netInputUnits: swapCalc.netInputUnits.toString(),
      netOutputUnits: swapCalc.netOutputUnits.toString(),
      netOutputFormatted: format7Decimals(swapCalc.netOutputUnits),
      feeSplit: {
        feeMbzrSubunits: swapCalc.feeMbzrSubunits.toString(),
        stakerShare70MbzrSubunits: swapCalc.stakerShareMbzrSubunits.toString(),
        polShare30MbzrSubunits: swapCalc.polShareMbzrSubunits.toString(),
      },
      feeAccrual,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to execute swap.";
    console.error("[POST /api/swap]", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}