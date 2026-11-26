import { NextRequest, NextResponse } from "next/server";
import { getStakingDb, safeBigInt } from "@/app/lib/db/stakingDbHelper";
import {
  LIQUIDITY_POOL_COLLECTIONS,
  LIQUIDITY_POOL_ID,
  LiquidityPoolConfigRecord,
  StakePositionRecord,
  UNBONDING_COOLDOWN_SECONDS,
} from "@/app/lib/db/liquidityPoolSeed";
import {
  computeMeltExit,
  format7Decimals,
  GLOBAL_POOL_CAP_PI_STROOPS,
} from "@/app/lib/economics/liquidityPoolMath";

interface UnstakeRequestBody {
  stakeId?: string;
  pioneerUid?: string;
  action?: "REQUEST_UNBOND" | "COMPLETE_UNBOND";
  releaseTxHash?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as UnstakeRequestBody;
    const stakeId = body.stakeId?.trim();
    const pioneerUid = body.pioneerUid?.trim();

    if (!stakeId) {
      return NextResponse.json(
        { success: false, error: "stakeId is required." },
        { status: 400 }
      );
    }

    const db = await getStakingDb();
    const configCol = db.collection<LiquidityPoolConfigRecord>(LIQUIDITY_POOL_COLLECTIONS.config);
    const stakesCol = db.collection<StakePositionRecord>(LIQUIDITY_POOL_COLLECTIONS.stakes);
    const epochsCol = db.collection(LIQUIDITY_POOL_COLLECTIONS.epochs);

    const stake = await stakesCol.findOne({ stakeId, poolId: LIQUIDITY_POOL_ID });
    if (!stake) {
      return NextResponse.json(
        { success: false, error: `StakePosition ${stakeId} not found.` },
        { status: 404 }
      );
    }

    if (pioneerUid && stake.pioneerUid !== pioneerUid) {
      return NextResponse.json(
        { success: false, error: "pioneerUid does not match stake owner." },
        { status: 403 }
      );
    }

    const pool = await configCol.findOne({ poolId: LIQUIDITY_POOL_ID });
    if (!pool) {
      return NextResponse.json(
        { success: false, error: "LiquidityPoolConfig GENESIS_LP_1000_PI not found." },
        { status: 404 }
      );
    }

    const now = new Date();
    const principalPiStroops = safeBigInt(stake.principalPiStroops);
    const equivalentMbzrSubunits = safeBigInt(stake.equivalentMbzrSubunits);
    const action = body.action ?? (stake.status === "UNBONDING" ? "COMPLETE_UNBOND" : "REQUEST_UNBOND");

    if (action === "REQUEST_UNBOND") {
      if (stake.status !== "ACTIVE") {
        return NextResponse.json(
          { success: false, error: `Cannot request unbond from status ${stake.status}.` },
          { status: 409 }
        );
      }

      const unlocksAt = new Date(stake.unlocksAt);
      if (now < unlocksAt) {
        return NextResponse.json(
          {
            success: false,
            error: "STAKE_LOCK_ACTIVE",
            unlocksAt: unlocksAt.toISOString(),
          },
          { status: 409 }
        );
      }

      const cooldownSec =
        typeof pool.unbondingCooldownSeconds === "number" && pool.unbondingCooldownSeconds > 0
          ? pool.unbondingCooldownSeconds
          : UNBONDING_COOLDOWN_SECONDS;
      const unbondCompletesAt = new Date(now.getTime() + cooldownSec * 1000);

      await stakesCol.updateOne(
        { stakeId },
        {
          $set: {
            status: "UNBONDING",
            effectiveWeightUnits: "0",
            unbondRequestedAt: now,
            unbondCompletesAt,
            updatedAt: now,
          },
        }
      );

      const nextStaked = safeBigInt(pool.totalStakedPiStroops) - principalPiStroops;
      const nextUnbonding = safeBigInt(pool.totalUnbondingPiStroops) + principalPiStroops;

      await configCol.updateOne(
        { poolId: LIQUIDITY_POOL_ID },
        {
          $set: {
            totalStakedPiStroops: (nextStaked > 0n ? nextStaked : 0n).toString(),
            totalUnbondingPiStroops: nextUnbonding.toString(),
            updatedAt: now,
          },
        }
      );

      const weightToRemove = safeBigInt(stake.effectiveWeightUnits);
      const openEpoch = await epochsCol.findOne({
        poolId: LIQUIDITY_POOL_ID,
        epochNumber: pool.currentEpochNumber,
      });
      if (openEpoch) {
        const nextEpochWeight = safeBigInt(openEpoch.totalPoolEffectiveWeight) - weightToRemove;
        const nextCount = Math.max(0, (openEpoch.activeStakerCount ?? 1) - 1);
        await epochsCol.updateOne(
          { poolId: LIQUIDITY_POOL_ID, epochNumber: pool.currentEpochNumber },
          {
            $set: {
              totalPoolEffectiveWeight: (nextEpochWeight > 0n ? nextEpochWeight : 0n).toString(),
              activeStakerCount: nextCount,
            },
          }
        );
      }

      return NextResponse.json({
        success: true,
        stage: "UNBONDING",
        stakeId,
        unbondRequestedAt: now.toISOString(),
        unbondCompletesAt: unbondCompletesAt.toISOString(),
        principalPiStroops: principalPiStroops.toString(),
        principalPiFormatted: format7Decimals(principalPiStroops),
      });
    }

    // COMPLETE_UNBOND
    if (stake.status !== "UNBONDING") {
      return NextResponse.json(
        { success: false, error: `Cannot complete unbond from status ${stake.status}.` },
        { status: 409 }
      );
    }

    const completesAt = stake.unbondCompletesAt ? new Date(stake.unbondCompletesAt) : now;
    if (now < completesAt) {
      return NextResponse.json(
        {
          success: false,
          error: "UNBONDING_COOLDOWN_IN_PROGRESS",
          unbondCompletesAt: completesAt.toISOString(),
        },
        { status: 409 }
      );
    }

    const meltPreview = computeMeltExit(
      equivalentMbzrSubunits,
      safeBigInt(pool.meltExitTariffBps, 50n)
    );
    const releaseTxHash =
      body.releaseTxHash?.trim() || `lp_release_${stakeId.toLowerCase()}_${now.getTime()}`;

    await stakesCol.updateOne(
      { stakeId },
      {
        $set: {
          status: "WITHDRAWN",
          releaseTxHash,
          updatedAt: now,
        },
      }
    );

    const currentStaked = safeBigInt(pool.totalStakedPiStroops);
    const nextUnbonding = safeBigInt(pool.totalUnbondingPiStroops) - principalPiStroops;
    const clampedUnbonding = nextUnbonding > 0n ? nextUnbonding : 0n;
    const nextActiveMbzr = safeBigInt(pool.activeMbzrIssuedSubunits) - equivalentMbzrSubunits;
    const clampedActiveMbzr = nextActiveMbzr > 0n ? nextActiveMbzr : 0n;

    const globalCap = safeBigInt(pool.globalCapPiStroops, GLOBAL_POOL_CAP_PI_STROOPS);
    const nextPoolStatus =
      pool.status === "PAUSED"
        ? "PAUSED"
        : currentStaked + clampedUnbonding >= globalCap
          ? "CAP_REACHED"
          : "ACTIVE";

    await configCol.updateOne(
      { poolId: LIQUIDITY_POOL_ID },
      {
        $set: {
          status: nextPoolStatus,
          totalUnbondingPiStroops: clampedUnbonding.toString(),
          activeMbzrIssuedSubunits: clampedActiveMbzr.toString(),
          updatedAt: now,
        },
      }
    );

    return NextResponse.json({
      success: true,
      stage: "WITHDRAWN",
      stakeId,
      releaseTxHash,
      releasedPrincipalPiStroops: principalPiStroops.toString(),
      releasedPrincipalPiFormatted: format7Decimals(principalPiStroops),
      retiredMbzrSubunits: equivalentMbzrSubunits.toString(),
      meltTariffPreview: {
        tariffBps: meltPreview.tariffBps.toString(),
        tariffMbzrSubunits: meltPreview.tariffMbzrSubunits.toString(),
        netPiStroops: meltPreview.netPiStroops.toString(),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to process unstake request.";
    console.error("[POST /api/staking/unstake]", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}