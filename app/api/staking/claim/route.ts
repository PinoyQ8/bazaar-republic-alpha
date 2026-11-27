import { NextRequest, NextResponse } from "next/server";
import { getStakingDb, safeBigInt } from "@/app/lib/db/stakingDbHelper";
import {
  LIQUIDITY_POOL_COLLECTIONS,
  LIQUIDITY_POOL_ID,
  LiquidityPoolConfigRecord,
  StakePositionRecord,
} from "@/app/lib/db/liquidityPoolSeed";
import {
  format7Decimals,
  mbzrSubunitsToPiStroops,
} from "@/app/lib/economics/liquidityPoolMath";

interface ClaimRequestBody {
  stakeId?: string;
  pioneerUid?: string;
  claimAll?: boolean;
}

interface ClaimedPositionSummary {
  stakeId: string;
  claimedNowMbzrSubunits: string;
  claimedNowMbzrFormatted: string;
  cumulativeClaimedMbzrSubunits: string;
  cumulativeClaimedMbzrFormatted: string;
  lastClaimedEpoch: number;
  piEquivalentStroops: string;
  piEquivalentFormatted: string;
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

    const targetStakes = (await stakesCol.find(query).toArray()) as StakePositionRecord[];
    if (targetStakes.length === 0) {
      return NextResponse.json(
        { success: false, error: "No matching StakePosition found." },
        { status: 404 }
      );
    }

    const latestSettledEpoch = await epochsCol.findOne(
      { poolId: LIQUIDITY_POOL_ID, status: "SETTLED" },
      { sort: { epochNumber: -1 } }
    );
    const latestSettledEpochNum =
      typeof latestSettledEpoch?.epochNumber === "number"
        ? latestSettledEpoch.epochNumber
        : 0;

    const now = new Date();
    let totalClaimedThisCallSubunits = 0n;
    const claimedPositions: ClaimedPositionSummary[] = [];

    for (const st of targetStakes) {
      const accruedSubunits = safeBigInt(st.accruedMbzrSubunits);
      const claimableSubunits = accruedSubunits > 0n ? accruedSubunits : 0n;
      const prevClaimed = safeBigInt(st.claimedMbzrSubunits);
      const nextClaimed = prevClaimed + claimableSubunits;

      const prevLastEpoch = typeof st.lastClaimedEpoch === "number" ? st.lastClaimedEpoch : 0;
      const nextLastClaimedEpoch =
        claimableSubunits > 0n && latestSettledEpochNum > prevLastEpoch
          ? latestSettledEpochNum
          : prevLastEpoch;

      await stakesCol.updateOne(
        { stakeId: st.stakeId },
        {
          $set: {
            accruedMbzrSubunits: "0",
            claimedMbzrSubunits: nextClaimed.toString(),
            lastClaimedEpoch: nextLastClaimedEpoch,
            updatedAt: now,
          },
        }
      );

      const piEquivalentStroops = mbzrSubunitsToPiStroops(claimableSubunits);
      totalClaimedThisCallSubunits += claimableSubunits;

      claimedPositions.push({
        stakeId: st.stakeId,
        claimedNowMbzrSubunits: claimableSubunits.toString(),
        claimedNowMbzrFormatted: format7Decimals(claimableSubunits),
        cumulativeClaimedMbzrSubunits: nextClaimed.toString(),
        cumulativeClaimedMbzrFormatted: format7Decimals(nextClaimed),
        lastClaimedEpoch: nextLastClaimedEpoch,
        piEquivalentStroops: piEquivalentStroops.toString(),
        piEquivalentFormatted: format7Decimals(piEquivalentStroops),
      });
    }

    const totalPiEquivalentStroops = mbzrSubunitsToPiStroops(totalClaimedThisCallSubunits);

    return NextResponse.json({
      success: true,
      poolId: LIQUIDITY_POOL_ID,
      currentEpochNumber: pool.currentEpochNumber,
      latestSettledEpochNumber: latestSettledEpochNum,
      totalClaimedMbzrSubunits: totalClaimedThisCallSubunits.toString(),
      totalClaimedMbzrFormatted: format7Decimals(totalClaimedThisCallSubunits),
      piEquivalentStroops: totalPiEquivalentStroops.toString(),
      piEquivalentFormatted: format7Decimals(totalPiEquivalentStroops),
      claimedPositions,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to claim staking rewards.";
    console.error("[POST /api/staking/claim]", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}