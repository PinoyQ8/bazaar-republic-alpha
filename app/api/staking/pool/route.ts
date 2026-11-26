import { NextRequest, NextResponse } from "next/server";
import { getStakingDb, safeBigInt } from "@/app/lib/db/stakingDbHelper";
import {
  EPOCH_REWARD_LEDGER_INDEXES,
  LIQUIDITY_POOL_COLLECTIONS,
  LIQUIDITY_POOL_ID,
  LiquidityPoolConfigRecord,
  StakePositionRecord,
} from "@/app/lib/db/liquidityPoolSeed";
import {
  computeCollateralRatioBps,
  format7Decimals,
  GLOBAL_POOL_CAP_PI_STROOPS,
  piStroopsToMbzrSubunits,
} from "@/app/lib/economics/liquidityPoolMath";

export async function GET(req: NextRequest) {
  try {
    const db = await getStakingDb();
    const pioneerUid = req.nextUrl.searchParams.get("pioneerUid")?.trim();

    const poolDoc = (await db
      .collection<LiquidityPoolConfigRecord>(LIQUIDITY_POOL_COLLECTIONS.config)
      .findOne({ poolId: LIQUIDITY_POOL_ID })) as LiquidityPoolConfigRecord | null;

    if (!poolDoc) {
      return NextResponse.json(
        { success: false, error: "LiquidityPoolConfig GENESIS_LP_1000_PI not initialized." },
        { status: 404 }
      );
    }

    const totalStakedPiStroops = safeBigInt(poolDoc.totalStakedPiStroops);
    const totalUnbondingPiStroops = safeBigInt(poolDoc.totalUnbondingPiStroops);
    const activeMbzrIssuedSubunits = safeBigInt(poolDoc.activeMbzrIssuedSubunits);
    const polReservePiStroops = safeBigInt(poolDoc.polReservePiStroops);
    const polReserveMbzrSubunits = safeBigInt(poolDoc.polReserveMbzrSubunits);
    const globalCapPiStroops = safeBigInt(poolDoc.globalCapPiStroops, GLOBAL_POOL_CAP_PI_STROOPS);

    const remainingGlobalCapPiStroops =
      globalCapPiStroops > totalStakedPiStroops
        ? globalCapPiStroops - totalStakedPiStroops
        : 0n;

    const collateralRatioBps = computeCollateralRatioBps(
      totalStakedPiStroops,
      activeMbzrIssuedSubunits
    );

    const activeEpoch = await db
      .collection(LIQUIDITY_POOL_COLLECTIONS.epochs)
      .findOne({ poolId: LIQUIDITY_POOL_ID, status: "OPEN" }, { sort: { epochNumber: -1 } });

    let stakes: StakePositionRecord[] = [];
    if (pioneerUid) {
      stakes = (await db
        .collection<StakePositionRecord>(LIQUIDITY_POOL_COLLECTIONS.stakes)
        .find({ poolId: LIQUIDITY_POOL_ID, pioneerUid })
        .sort({ stakedAt: -1 })
        .toArray()) as StakePositionRecord[];
    }

    return NextResponse.json({
      success: true,
      pool: {
        ...poolDoc,
        remainingGlobalCapPiStroops: remainingGlobalCapPiStroops.toString(),
        remainingGlobalCapPiFormatted: format7Decimals(remainingGlobalCapPiStroops),
        totalStakedPiFormatted: format7Decimals(totalStakedPiStroops),
        totalUnbondingPiFormatted: format7Decimals(totalUnbondingPiStroops),
        activeMbzrIssuedFormatted: format7Decimals(activeMbzrIssuedSubunits),
        polReservePiFormatted: format7Decimals(polReservePiStroops),
        polReserveMbzrFormatted: format7Decimals(polReserveMbzrSubunits),
        impliedMaxBackingMbzrSubunits: piStroopsToMbzrSubunits(globalCapPiStroops).toString(),
        collateralRatioBps: collateralRatioBps.toString(),
        collateralRatioPct: (Number(collateralRatioBps) / 100).toFixed(2),
      },
      activeEpoch,
      stakes,
      indexedCollections: Object.keys(EPOCH_REWARD_LEDGER_INDEXES).length > 0 ? LIQUIDITY_POOL_COLLECTIONS : undefined,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load staking pool state.";
    console.error("[GET /api/staking/pool]", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}