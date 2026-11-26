import { NextRequest, NextResponse } from "next/server";
import { getStakingDb } from "@/app/lib/db/stakingDbHelper";
import { settleEpochFees, SettleEpochInput } from "@/app/lib/economics/epochSettlementHelper";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as SettleEpochInput;
    const db = await getStakingDb();
    const result = await settleEpochFees(body, db);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to settle epoch fees.";
    console.error("[POST /api/staking/settle-epoch]", err);
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}