import { NextRequest, NextResponse } from "next/server";
import { getStakingDb, safeBigInt } from "@/app/lib/db/stakingDbHelper";
import {
  LIQUIDITY_POOL_COLLECTIONS,
  LIQUIDITY_POOL_ID,
  LiquidityPoolConfigRecord,
  StakePositionRecord,
} from "@/app/lib/db/liquidityPoolSeed";
import {
  computeStakerEpochRewardMbzrSubunits,
  format7Decimals,
  mbzrSubunitsToPiStroops,
} from "@/app/lib/economics/liquidityPoolMath";

interface ClaimRequestBody {
  stakeId?: string;
  pioneerUid?: string;
  claimAll?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ClaimRequestBody;
    const stakeId = body.stakeId?.trim();
    const pioneerUid = body.pioneerUid?.trim();

    if (!stakeId && !pioneerUid) {
      return NextResponse.json(
        { success: false, error: "Provide stakeId or pioneerUid to claim rewards." },
        { status: 400 }
      );
    }

    const db = await getStakingDb();
    const configCol = db.collection<LiquidityPoolConfigRecord>(LIQUIDITY_POOL_COLLECTIONS.config);
    const stakesCol = db.collection<StakePositionRecord>(LIQUIDITY_POOL_COLLECTIONS.stakes);
    const epochsCol = db.collection(LIQUIDITY_POOL_COLLECTIONS.epochs);

    const pool = await configCol.findOne({ poolId: LIQUIDITY_POOL_ID });
    if (!pool) {
      return NextResponse.json(
        { success: false, error: "LiquidityPoolConfig GENESIS_LP_1000_PI not found." },
        { status: 404 }
      );
    }

    const query: Record<string, unknown> = { poolId: LIQUIDITY_POOL_ID };
    if (stakeId) query.stakeId = stakeId;
    if (pioneerUid) query.pioneerUid = pioneerUid;

    const targetStakes = await stakesCol.find(query).toArray();
    if (targetStakes.length === 0) {
      return NextResponse.json(
        { success: false, error: "No matching StakePosition found." },
        { status: 404 }
      );
    }

    // Pull settled epochs after each stake's lastClaimedEpoch for pro-rata real-fee share
    const settledEpochs = await epochsCol
      .find({ poolId: LIQUIDITY_POOL_ID, status: "SETTLED" })
      .sort({ epochNumber: 1 })
      .toArray();

    const now = new Date();
    let totalClaimedThisCallSubunits = 0n;
    const claimedPositions: Array<{
      stakeId: string;
      claimedNowMbzrSubunits: string;
      claimedNowMbzrFormatted: string;
      cumulativeClaimedMbzrSubunits: string;
      piEquivalentStroops: string;
    }> = [];

    for (const st of targetStakes) {
      let pendingSubunits = safeBigInt(st.accruedMbzrSubunits);
      const stWeight = safeBigInt(st.effectiveWeightUnits);
      const lastEpoch = typeof st.lastClaimedEpoch === "number" ? st.lastClaimedEpoch : 0;

      for (const ep of settledEpochs) {
        const epNum = typeof ep.epochNumber === "number" ? ep.epochNumber : 0;
        if (epNum > lastEpoch && st.status === "ACTIVE") {
          const epPool70 = safeBigInt(ep.stakerPool70MbzrSubunits);
          const epTotalWeight = safeBigInt(ep.totalPoolEffectiveWeight);
          pendingSubunits += computeStakerEpochRewardMbzrSubunits(
            stWeight,
            epTotalWeight,
            epPool70
          );
        }
      }

      const prevClaimed = safeBigInt(st.claimedMbzrSubunits);
      const nextClaimed = prevClaimed + pendingSubunits;

      await stakesCol.updateOne(
        { stakeId: st.stakeId },
        {
          $set: {
            accruedMbzrSubunits: "0",
            claimedMbzrSubunits: nextClaimed.toString(),
            lastClaimedEpoch: pool.currentEpochNumber,
            updatedAt: now,
          },
        }
      );

      totalClaimedThisCallSubunits += pendingSubunits;
      claimedPositions.push({
        stakeId: st.stakeId,
        claimedNowMbzrSubunits: pendingSubunits.toString(),
        claimedNowMbzrFormatted: format7Decimals(pendingSubunits),
        cumulativeClaimedMbzrSubunits: nextClaimed.toString(),
        piEquivalentStroops: mbzrSubunitsToPiStroops(pendingSubunits).toString(),
      });
    }

    return NextResponse.json({
      success: true,
      poolId: LIQUIDITY_POOL_ID,
      epochNumber: pool.currentEpochNumber,
      totalClaimedMbzrSubunits: totalClaimedThisCallSubunits.toString(),
      totalClaimedMbzrFormatted: format7Decimals(totalClaimedThisCallSubunits),
      piEquivalentStroops: mbzrSubunitsToPiStroops(totalClaimedThisCallSubunits).toString(),
      piEquivalentFormatted: format7Decimals(mbzrSubunitsToPiStroops(totalClaimedThisCallSubunits)),
      claimedPositions,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to claim staking rewards.";
    console.error("[POST /api/staking/claim]", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}