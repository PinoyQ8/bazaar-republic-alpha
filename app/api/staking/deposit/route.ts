import { NextRequest, NextResponse } from "next/server";
import { getStakingDb, generateStakeId, safeBigInt } from "@/app/lib/db/stakingDbHelper";
import {
  LIQUIDITY_POOL_COLLECTIONS,
  LIQUIDITY_POOL_ID,
  LiquidityPoolConfigRecord,
  StakePositionRecord,
} from "@/app/lib/db/liquidityPoolSeed";
import {
  computeStakeWeightBreakdown,
  format7Decimals,
  GLOBAL_POOL_CAP_PI_STROOPS,
  LockTierDays,
  parseDecimalTo7Decimals,
  piStroopsToMbzrSubunits,
  TARGET_UPTIME_SHIELD_PCT,
} from "@/app/lib/economics/liquidityPoolMath";

interface DepositRequestBody {
  pioneerUid?: string;
  stellarAddress?: string;
  amountPi?: string | number;
  amountPiStroops?: string | number;
  lockTierDays?: number;
  uptimeShieldPct?: number;
  lockTxHash?: string;
}

function normalizeLockTier(rawTier?: number): LockTierDays {
  if (rawTier === 90) return 90;
  if (rawTier === 60) return 60;
  return 30;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as DepositRequestBody;
    const pioneerUid = body.pioneerUid?.trim();
    const stellarAddress = body.stellarAddress?.trim() || pioneerUid || "";

    if (!pioneerUid) {
      return NextResponse.json(
        { success: false, error: "pioneerUid is required." },
        { status: 400 }
      );
    }

    let depositPiStroops: bigint;
    if (body.amountPiStroops !== undefined && body.amountPiStroops !== null) {
      depositPiStroops = safeBigInt(body.amountPiStroops, -1n);
    } else if (body.amountPi !== undefined && body.amountPi !== null) {
      depositPiStroops = parseDecimalTo7Decimals(body.amountPi);
    } else {
      return NextResponse.json(
        { success: false, error: "amountPi or amountPiStroops is required." },
        { status: 400 }
      );
    }

    const lockTierDays = normalizeLockTier(body.lockTierDays);
    const uptimeShieldPct =
      typeof body.uptimeShieldPct === "number" && Number.isFinite(body.uptimeShieldPct)
        ? Math.min(100, Math.max(0, body.uptimeShieldPct))
        : TARGET_UPTIME_SHIELD_PCT;

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

    if (pool.status === "PAUSED") {
      return NextResponse.json(
        { success: false, error: "Staking pool is currently PAUSED." },
        { status: 409 }
      );
    }

    const totalStakedPiStroops = safeBigInt(pool.totalStakedPiStroops);
    const activeMbzrIssuedSubunits = safeBigInt(pool.activeMbzrIssuedSubunits);
    const globalCapPiStroops = safeBigInt(pool.globalCapPiStroops, GLOBAL_POOL_CAP_PI_STROOPS);
    const minStakePiStroops = safeBigInt(pool.minStakePiStroops);
    const maxStakePerPioneerPiStroops = safeBigInt(pool.maxStakePerPioneerPiStroops);

    const existingUserStakes = await stakesCol
      .find({
        poolId: LIQUIDITY_POOL_ID,
        pioneerUid,
        status: { $in: ["ACTIVE", "UNBONDING"] },
      })
      .toArray();

    const userCurrentStakedPiStroops = existingUserStakes.reduce(
      (acc, item) => acc + safeBigInt(item.principalPiStroops),
      0n
    );

    if (depositPiStroops <= 0n) {
      return NextResponse.json(
        { success: false, error: "Deposit amount must be greater than 0." },
        { status: 400 }
      );
    }

    if (depositPiStroops < minStakePiStroops) {
      return NextResponse.json(
        {
          success: false,
          error: `Deposit below minimum stake (${format7Decimals(minStakePiStroops)} Pi).`,
        },
        { status: 400 }
      );
    }

    const nextTotalStakedPiStroops = totalStakedPiStroops + depositPiStroops;
    if (nextTotalStakedPiStroops > globalCapPiStroops) {
      const remaining = globalCapPiStroops > totalStakedPiStroops ? globalCapPiStroops - totalStakedPiStroops : 0n;
      return NextResponse.json(
        {
          success: false,
          error: "GLOBAL_1000_PI_CAP_EXCEEDED",
          remainingGlobalCapPiStroops: remaining.toString(),
          remainingGlobalCapPiFormatted: format7Decimals(remaining),
        },
        { status: 409 }
      );
    }

    if (userCurrentStakedPiStroops + depositPiStroops > maxStakePerPioneerPiStroops) {
      const remainingUser =
        maxStakePerPioneerPiStroops > userCurrentStakedPiStroops
          ? maxStakePerPioneerPiStroops - userCurrentStakedPiStroops
          : 0n;
      return NextResponse.json(
        {
          success: false,
          error: "PIONEER_STAKE_CAP_EXCEEDED",
          remainingPioneerCapPiStroops: remainingUser.toString(),
          remainingPioneerCapPiFormatted: format7Decimals(remainingUser),
        },
        { status: 409 }
      );
    }

    const equivalentMbzrSubunits = piStroopsToMbzrSubunits(depositPiStroops);
    const nextActiveMbzrIssuedSubunits = activeMbzrIssuedSubunits + equivalentMbzrSubunits;
    const weightBreakdown = computeStakeWeightBreakdown(
      depositPiStroops,
      lockTierDays,
      uptimeShieldPct
    );

    const now = new Date();
    const unlocksAt = new Date(now.getTime() + lockTierDays * 24 * 60 * 60 * 1000);
    const stakeId = generateStakeId(now.getTime());
    const lockTxHash =
      body.lockTxHash?.trim() || `lp_lock_${stakeId.toLowerCase()}_${now.getTime()}`;

    const position: StakePositionRecord = {
      stakeId,
      poolId: LIQUIDITY_POOL_ID,
      pioneerUid,
      stellarAddress,
      principalPiStroops: depositPiStroops.toString(),
      equivalentMbzrSubunits: equivalentMbzrSubunits.toString(),
      lockTierDays,
      lockMultiplierBps: Number(weightBreakdown.lockMultiplierBps),
      uptimeShieldPct,
      activityMultiplierBps: Number(weightBreakdown.activityMultiplierBps),
      effectiveWeightUnits: weightBreakdown.effectiveWeightUnits.toString(),
      accruedMbzrSubunits: "0",
      claimedMbzrSubunits: "0",
      lastClaimedEpoch: pool.currentEpochNumber,
      status: "ACTIVE",
      lockTxHash,
      stakedAt: now,
      unlocksAt,
      updatedAt: now,
    };

    await stakesCol.insertOne(position);

    const nextPoolStatus =
      nextTotalStakedPiStroops >= globalCapPiStroops ? "CAP_REACHED" : "ACTIVE";

    await configCol.updateOne(
      { poolId: LIQUIDITY_POOL_ID },
      {
        $set: {
          status: nextPoolStatus,
          totalStakedPiStroops: nextTotalStakedPiStroops.toString(),
          activeMbzrIssuedSubunits: nextActiveMbzrIssuedSubunits.toString(),
          updatedAt: now,
        },
      }
    );

    const openEpoch = await epochsCol.findOne({
      poolId: LIQUIDITY_POOL_ID,
      epochNumber: pool.currentEpochNumber,
    });
    const prevWeight = safeBigInt(openEpoch?.totalPoolEffectiveWeight);
    const prevCount = typeof openEpoch?.activeStakerCount === "number" ? openEpoch.activeStakerCount : 0;

    await epochsCol.updateOne(
      { poolId: LIQUIDITY_POOL_ID, epochNumber: pool.currentEpochNumber },
      {
        $set: {
          totalPoolEffectiveWeight: (prevWeight + weightBreakdown.effectiveWeightUnits).toString(),
          activeStakerCount: prevCount + 1,
        },
      },
      { upsert: true }
    );

    return NextResponse.json(
      {
        success: true,
        stake: {
          ...position,
          principalPiFormatted: format7Decimals(depositPiStroops),
          equivalentMbzrFormatted: format7Decimals(equivalentMbzrSubunits),
        },
        poolSummary: {
          status: nextPoolStatus,
          totalStakedPiStroops: nextTotalStakedPiStroops.toString(),
          totalStakedPiFormatted: format7Decimals(nextTotalStakedPiStroops),
          remainingGlobalCapPiStroops: (globalCapPiStroops - nextTotalStakedPiStroops).toString(),
          remainingGlobalCapPiFormatted: format7Decimals(globalCapPiStroops - nextTotalStakedPiStroops),
          activeMbzrIssuedSubunits: nextActiveMbzrIssuedSubunits.toString(),
          activeMbzrIssuedFormatted: format7Decimals(nextActiveMbzrIssuedSubunits),
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to process staking deposit.";
    console.error("[POST /api/staking/deposit]", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}