import { NextRequest, NextResponse } from "next/server";
import { recordEscrowSettlementFee } from "@/app/lib/economics/epochSettlementHelper";

interface TestEscrowFeeBody {
  escrowId?: string;
  txHash?: string;
  amountPi?: string | number;
  amountPiStroops?: string | number;
  marketplaceFeeBps?: string | number;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as TestEscrowFeeBody;

    const escrowId = body.escrowId?.trim() || "ESC_TEST_FEE_01";
    const txHash = body.txHash?.trim() || "TX_HASH_TEST_FEE_01";
    const amountPi = body.amountPi ?? "100";
    const marketplaceFeeBps = body.marketplaceFeeBps ?? "50"; // 50 bps = 0.50% -> 0.50 Pi = 500 mBZR = 5,000,000,000 subunits

    const result = await recordEscrowSettlementFee({
      escrowId,
      txHash,
      amountPi,
      marketplaceFeeBps,
    });

    return NextResponse.json({
      success: true,
      input: { escrowId, txHash, amountPi, marketplaceFeeBps },
      result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to test escrow settlement fee.";
    console.error("[POST /api/staking/test-escrow-fee]", err);
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}