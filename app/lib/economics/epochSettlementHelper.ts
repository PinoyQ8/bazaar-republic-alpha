import { Db } from "mongodb";
import { getStakingDb, safeBigInt } from "@/app/lib/db/stakingDbHelper";
import {
  buildInitialEpochLedger,
  EPOCH_REWARD_LEDGER_INDEXES,
  EpochRewardLedgerRecord,
  LIQUIDITY_POOL_COLLECTIONS,
  LIQUIDITY_POOL_ID,
  LiquidityPoolConfigRecord,
  StakePositionRecord,
} from "@/app/lib/db/liquidityPoolSeed";
import {
  BPS_DENOMINATOR,
  computeEpochFeePoolSplit,
  computeStakerEpochRewardMbzrSubunits,
  computeSwapAndFeeSplit,
  format7Decimals,
  mbzrSubunitsToPiStroops,
  parseDecimalTo7Decimals,
  piStroopsToMbzrSubunits,
} from "@/app/lib/economics/liquidityPoolMath";

export interface SettleEpochInput {
  epochNumber?: number;
  // Direct mBZR 7-decimal subunit inputs (or decimal mBZR strings via convenience fields)
  swapFeesMbzrSubunits?: string | number | bigint;
  swapFeesMbzr?: string | number;
  marketplaceFeesMbzrSubunits?: string | number | bigint;
  marketplaceFeesMbzr?: string | number;
  meltTariffsMbzrSubunits?: string | number | bigint;
  meltTariffsMbzr?: string | number;
  slashedPenaltiesMbzrSubunits?: string | number | bigint;
  slashedPenaltiesMbzr?: string | number;
  // Optional convenience: derive 0.30% swap fee from a gross Pi swap volume
  grossSwapPi?: string | number;
  rebateBps?: string | number | bigint;
  advanceEpoch?: boolean;
  allowResettle?: boolean;
}

export interface StakerAccrualSummary {
  stakeId: string;
  pioneerUid: string;
  effectiveWeightUnits: string;
  accruedThisEpochMbzrSubunits: string;
  accruedThisEpochMbzrFormatted: string;
  newAccruedTotalMbzrSubunits: string;
  newAccruedTotalMbzrFormatted: string;
}

export interface AccumulateEpochFeeInput {
  eventId: string; // e.g. `swap_${txHash}` or `escrow_release_${escrowId}_${txHash}`
  source: "SWAP_030_BPS" | "MARKETPLACE_ESCROW" | "MELT_EXIT_TARIFF" | "DISPUTE_SLASH";
  feeMbzrSubunits: string | number | bigint;
  metadata?: Record<string, string | number>;
}

export interface RecordEscrowSettlementFeeInput {
  escrowId: string;
  txHash: string;
  amountPi?: string | number;
  amountPiStroops?: string | number | bigint;
  marketplaceFeeBps?: string | number | bigint; // e.g. 50n = 0.50%
}

const FEE_EVENTS_COLLECTION = "ProcessedEpochFeeEvent";

function isDuplicateKeyError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const record = err as { code?: unknown; cause?: { code?: unknown } };
  return record.code === 11000 || record.cause?.code === 11000;
}

function resolveMbzrSubunits(
  rawSubunits?: string | number | bigint,
  rawMbzr?: string | number
): bigint {
  if (rawSubunits !== undefined && rawSubunits !== null && `${rawSubunits}`.trim() !== "") {
    const parsed = safeBigInt(rawSubunits, -1n);
    if (parsed < 0n) throw new Error(`Invalid mBZR subunit amount: ${rawSubunits}`);
    return parsed;
  }
  if (rawMbzr !== undefined && rawMbzr !== null && `${rawMbzr}`.trim() !== "") {
    const parsed = parseDecimalTo7Decimals(rawMbzr);
    if (parsed < 0n) throw new Error(`Invalid mBZR amount: ${rawMbzr}`);
    return parsed;
  }
  return 0n;
}

export async function accumulateEpochFee(
  input: AccumulateEpochFeeInput,
  existingDb?: Db
): Promise<{ recorded: boolean; duplicate: boolean; epochNumber: number; addedMbzrSubunits: string }> {
  const eventId = input.eventId?.trim();
  if (!eventId) {
    throw new Error("eventId is required for idempotent epoch fee accumulation.");
  }

  const db = existingDb ?? (await getStakingDb());
  const eventsCol = db.collection(FEE_EVENTS_COLLECTION);
  const epochsCol = db.collection<EpochRewardLedgerRecord>(LIQUIDITY_POOL_COLLECTIONS.epochs);
  const configCol = db.collection<LiquidityPoolConfigRecord>(LIQUIDITY_POOL_COLLECTIONS.config);

  const feeSubunits = resolveMbzrSubunits(input.feeMbzrSubunits);
  const pool = await configCol.findOne({ poolId: LIQUIDITY_POOL_ID });
  const epochNumber = pool?.currentEpochNumber ?? 1;

  if (feeSubunits <= 0n) {
    return { recorded: false, duplicate: false, epochNumber, addedMbzrSubunits: "0" };
  }

  const now = new Date();
  try {
    await eventsCol.insertOne({
      eventId,
      poolId: LIQUIDITY_POOL_ID,
      epochNumber,
      source: input.source,
      feeMbzrSubunits: feeSubunits.toString(),
      metadata: input.metadata ?? {},
      recordedAt: now,
    });
  } catch (err: unknown) {
    if (isDuplicateKeyError(err)) {
      return {
        recorded: false,
        duplicate: true,
        epochNumber,
        addedMbzrSubunits: "0",
      };
    }
    throw err;
  }

  let currentEpoch: EpochRewardLedgerRecord | null =
    (await epochsCol.findOne({ poolId: LIQUIDITY_POOL_ID, epochNumber, status: "OPEN" })) ??
    (await epochsCol.findOne({ poolId: LIQUIDITY_POOL_ID, epochNumber }));

  if (!currentEpoch) {
    const initialDoc: EpochRewardLedgerRecord = buildInitialEpochLedger(epochNumber, now);
    await epochsCol.insertOne(initialDoc);
    currentEpoch = initialDoc;
  }

  let swapSubunits = safeBigInt(currentEpoch.swapFeesCollectedMbzrSubunits);
  let marketSubunits = safeBigInt(currentEpoch.marketplaceFeesCollectedMbzrSubunits);
  let meltSubunits = safeBigInt(currentEpoch.meltTariffsCollectedMbzrSubunits);
  let slashSubunits = safeBigInt(currentEpoch.slashedPenaltiesMbzrSubunits);

  let targetField: keyof EpochRewardLedgerRecord;
  let nextStreamSubunits: bigint;

  switch (input.source) {
    case "SWAP_030_BPS":
      swapSubunits += feeSubunits;
      targetField = "swapFeesCollectedMbzrSubunits";
      nextStreamSubunits = swapSubunits;
      break;
    case "MARKETPLACE_ESCROW":
      marketSubunits += feeSubunits;
      targetField = "marketplaceFeesCollectedMbzrSubunits";
      nextStreamSubunits = marketSubunits;
      break;
    case "MELT_EXIT_TARIFF":
      meltSubunits += feeSubunits;
      targetField = "meltTariffsCollectedMbzrSubunits";
      nextStreamSubunits = meltSubunits;
      break;
    case "DISPUTE_SLASH":
      slashSubunits += feeSubunits;
      targetField = "slashedPenaltiesMbzrSubunits";
      nextStreamSubunits = slashSubunits;
      break;
  }

  const split = computeEpochFeePoolSplit({
    swapFeesMbzrSubunits: swapSubunits,
    marketplaceFeesMbzrSubunits: marketSubunits,
    meltTariffsMbzrSubunits: meltSubunits,
    slashedPenaltiesMbzrSubunits: slashSubunits,
  });

  await epochsCol.updateOne(
    { poolId: LIQUIDITY_POOL_ID, epochNumber },
    {
      $set: {
        [targetField]: nextStreamSubunits.toString(),
        grossFeePoolMbzrSubunits: split.grossFeePoolMbzrSubunits.toString(),
        stakerPool70MbzrSubunits: split.stakerPool70MbzrSubunits.toString(),
        polTreasury30MbzrSubunits: split.polTreasury30MbzrSubunits.toString(),
      },
    }
  );

  return {
    recorded: true,
    duplicate: false,
    epochNumber,
    addedMbzrSubunits: feeSubunits.toString(),
  };
}

export async function recordEscrowSettlementFee(
  params: RecordEscrowSettlementFeeInput,
  existingDb?: Db
) {
  const grossPiStroops =
    params.amountPiStroops !== undefined &&
    params.amountPiStroops !== null &&
    `${params.amountPiStroops}`.trim() !== ""
      ? safeBigInt(params.amountPiStroops, 0n)
      : params.amountPi !== undefined &&
          params.amountPi !== null &&
          `${params.amountPi}`.trim() !== ""
        ? parseDecimalTo7Decimals(params.amountPi)
        : 0n;

  const feeBps = safeBigInt(params.marketplaceFeeBps, 50n); // default 50 bps = 0.50%
  if (grossPiStroops <= 0n || feeBps <= 0n) {
    return { recorded: false, duplicate: false, epochNumber: 0, addedMbzrSubunits: "0" };
  }

  const marketplaceFeePiStroops = (grossPiStroops * feeBps) / BPS_DENOMINATOR;
  const marketplaceFeeMbzrSubunits = piStroopsToMbzrSubunits(marketplaceFeePiStroops);

  if (marketplaceFeeMbzrSubunits <= 0n) {
    return { recorded: false, duplicate: false, epochNumber: 0, addedMbzrSubunits: "0" };
  }

  const db = existingDb ?? (await getStakingDb());
  return accumulateEpochFee(
    {
      eventId: `escrow_release_${params.escrowId}_${params.txHash}`,
      source: "MARKETPLACE_ESCROW",
      feeMbzrSubunits: marketplaceFeeMbzrSubunits,
      metadata: {
        escrowId: params.escrowId,
        txHash: params.txHash,
        grossPiStroops: grossPiStroops.toString(),
        feeBps: feeBps.toString(),
        marketplaceFeePiStroops: marketplaceFeePiStroops.toString(),
      },
    },
    db
  );
}

export async function settleEpochFees(
  input: SettleEpochInput,
  existingDb?: Db
) {
  const db = existingDb ?? (await getStakingDb());
  const configCol = db.collection<LiquidityPoolConfigRecord>(LIQUIDITY_POOL_COLLECTIONS.config);
  const stakesCol = db.collection<StakePositionRecord>(LIQUIDITY_POOL_COLLECTIONS.stakes);
  const epochsCol = db.collection(LIQUIDITY_POOL_COLLECTIONS.epochs);

  const pool = await configCol.findOne({ poolId: LIQUIDITY_POOL_ID });
  if (!pool) {
    throw new Error("LiquidityPoolConfig GENESIS_LP_1000_PI not found.");
  }

  const targetEpochNumber =
    typeof input.epochNumber === "number" && Number.isFinite(input.epochNumber)
      ? Math.trunc(input.epochNumber)
      : pool.currentEpochNumber;

  const existingEpoch = await epochsCol.findOne({
    poolId: LIQUIDITY_POOL_ID,
    epochNumber: targetEpochNumber,
  });

  if (existingEpoch?.status === "SETTLED" && !input.allowResettle) {
    throw new Error(
      `Epoch ${targetEpochNumber} is already SETTLED. Pass allowResettle: true to re-settle.`
    );
  }

  let swapFeesMbzrSubunits = resolveMbzrSubunits(
    input.swapFeesMbzrSubunits,
    input.swapFeesMbzr
  );

  if (input.grossSwapPi !== undefined && input.grossSwapPi !== null && `${input.grossSwapPi}`.trim() !== "") {
    const grossPiStroops = parseDecimalTo7Decimals(input.grossSwapPi);
    const rebateBps = safeBigInt(input.rebateBps, 0n);
    const swapCalc = computeSwapAndFeeSplit(grossPiStroops, "PI_TO_MBZR", rebateBps);
    swapFeesMbzrSubunits += swapCalc.feeMbzrSubunits;
  }

  const marketplaceFeesMbzrSubunits = resolveMbzrSubunits(
    input.marketplaceFeesMbzrSubunits,
    input.marketplaceFeesMbzr
  );
  const meltTariffsMbzrSubunits = resolveMbzrSubunits(
    input.meltTariffsMbzrSubunits,
    input.meltTariffsMbzr
  );
  const slashedPenaltiesMbzrSubunits = resolveMbzrSubunits(
    input.slashedPenaltiesMbzrSubunits,
    input.slashedPenaltiesMbzr
  );

  const priorSwap = safeBigInt(existingEpoch?.swapFeesCollectedMbzrSubunits);
  const priorMarket = safeBigInt(existingEpoch?.marketplaceFeesCollectedMbzrSubunits);
  const priorMelt = safeBigInt(existingEpoch?.meltTariffsCollectedMbzrSubunits);
  const priorSlashed = safeBigInt(existingEpoch?.slashedPenaltiesMbzrSubunits);
  const priorDust = safeBigInt(existingEpoch?.dustRemainderMbzrSubunits);

  const totalSwapSubunits = priorSwap + swapFeesMbzrSubunits;
  const totalMarketSubunits = priorMarket + marketplaceFeesMbzrSubunits;
  const totalMeltSubunits = priorMelt + meltTariffsMbzrSubunits;
  const totalSlashedSubunits = priorSlashed + slashedPenaltiesMbzrSubunits;

  const split = computeEpochFeePoolSplit({
    swapFeesMbzrSubunits: totalSwapSubunits,
    marketplaceFeesMbzrSubunits: totalMarketSubunits,
    meltTariffsMbzrSubunits: totalMeltSubunits,
    slashedPenaltiesMbzrSubunits: totalSlashedSubunits,
  });

  const activeStakes = (await stakesCol
    .find({ poolId: LIQUIDITY_POOL_ID, status: "ACTIVE" })
    .toArray()) as StakePositionRecord[];

  const totalPoolEffectiveWeight = activeStakes.reduce(
    (sum, st) => sum + safeBigInt(st.effectiveWeightUnits),
    0n
  );

  const now = new Date();
  const stakerSummaries: StakerAccrualSummary[] = [];
  let distributedToStakersSubunits = 0n;

  for (const st of activeStakes) {
    const weight = safeBigInt(st.effectiveWeightUnits);
    const prevAccrued = safeBigInt(st.accruedMbzrSubunits);

    const rewardThisRun = computeStakerEpochRewardMbzrSubunits(
      weight,
      totalPoolEffectiveWeight,
      split.stakerPool70MbzrSubunits
    );

    const nextAccrued = prevAccrued + rewardThisRun;
    distributedToStakersSubunits += rewardThisRun;

    await stakesCol.updateOne(
      { stakeId: st.stakeId },
      {
        $set: {
          accruedMbzrSubunits: nextAccrued.toString(),
          updatedAt: now,
        },
      }
    );

    stakerSummaries.push({
      stakeId: st.stakeId,
      pioneerUid: st.pioneerUid,
      effectiveWeightUnits: weight.toString(),
      accruedThisEpochMbzrSubunits: rewardThisRun.toString(),
      accruedThisEpochMbzrFormatted: format7Decimals(rewardThisRun),
      newAccruedTotalMbzrSubunits: nextAccrued.toString(),
      newAccruedTotalMbzrFormatted: format7Decimals(nextAccrued),
    });
  }

  const dustRemainder =
    totalPoolEffectiveWeight > 0n && split.stakerPool70MbzrSubunits > distributedToStakersSubunits
      ? split.stakerPool70MbzrSubunits - distributedToStakersSubunits
      : priorDust;

  await epochsCol.updateOne(
    { poolId: LIQUIDITY_POOL_ID, epochNumber: targetEpochNumber },
    {
      $set: {
        epochNumber: targetEpochNumber,
        poolId: LIQUIDITY_POOL_ID,
        status: "SETTLED",
        swapFeesCollectedMbzrSubunits: totalSwapSubunits.toString(),
        marketplaceFeesCollectedMbzrSubunits: totalMarketSubunits.toString(),
        meltTariffsCollectedMbzrSubunits: totalMeltSubunits.toString(),
        slashedPenaltiesMbzrSubunits: totalSlashedSubunits.toString(),
        grossFeePoolMbzrSubunits: split.grossFeePoolMbzrSubunits.toString(),
        stakerPool70MbzrSubunits: split.stakerPool70MbzrSubunits.toString(),
        polTreasury30MbzrSubunits: split.polTreasury30MbzrSubunits.toString(),
        dustRemainderMbzrSubunits: dustRemainder.toString(),
        totalPoolEffectiveWeight: totalPoolEffectiveWeight.toString(),
        activeStakerCount: activeStakes.length,
        openedAt: existingEpoch?.openedAt ? new Date(existingEpoch.openedAt) : now,
        settledAt: now,
      },
    },
    { upsert: true }
  );

  // Add the 30% POL share to LiquidityPoolConfig reserves
  const currentPolMbzr = safeBigInt(pool.polReserveMbzrSubunits);
  const nextPolMbzr = currentPolMbzr + split.polTreasury30MbzrSubunits;
  const nextPolPiStroops = mbzrSubunitsToPiStroops(nextPolMbzr);

  const shouldAdvance = input.advanceEpoch !== false;
  const nextEpochNumber = shouldAdvance ? targetEpochNumber + 1 : targetEpochNumber;

  if (shouldAdvance) {
    const nextEpochDoc = await epochsCol.findOne({
      poolId: LIQUIDITY_POOL_ID,
      epochNumber: nextEpochNumber,
    });
    if (!nextEpochDoc) {
      await epochsCol.insertOne(buildInitialEpochLedger(nextEpochNumber, now));
    }
  }

  await configCol.updateOne(
    { poolId: LIQUIDITY_POOL_ID },
    {
      $set: {
        polReserveMbzrSubunits: nextPolMbzr.toString(),
        polReservePiStroops: nextPolPiStroops.toString(),
        currentEpochNumber: nextEpochNumber,
        updatedAt: now,
      },
    }
  );

  return {
    poolId: LIQUIDITY_POOL_ID,
    settledEpochNumber: targetEpochNumber,
    nextEpochNumber,
    totalPoolEffectiveWeight: totalPoolEffectiveWeight.toString(),
    activeStakerCount: activeStakes.length,
    feeStreams: {
      swapFeesMbzrSubunits: totalSwapSubunits.toString(),
      swapFeesMbzrFormatted: format7Decimals(totalSwapSubunits),
      marketplaceFeesMbzrSubunits: totalMarketSubunits.toString(),
      marketplaceFeesMbzrFormatted: format7Decimals(totalMarketSubunits),
      meltTariffsMbzrSubunits: totalMeltSubunits.toString(),
      meltTariffsMbzrFormatted: format7Decimals(totalMeltSubunits),
      slashedPenaltiesMbzrSubunits: totalSlashedSubunits.toString(),
      slashedPenaltiesMbzrFormatted: format7Decimals(totalSlashedSubunits),
      grossFeePoolMbzrSubunits: split.grossFeePoolMbzrSubunits.toString(),
      grossFeePoolMbzrFormatted: format7Decimals(split.grossFeePoolMbzrSubunits),
      grossFeePoolPiEquivalentFormatted: format7Decimals(
        mbzrSubunitsToPiStroops(split.grossFeePoolMbzrSubunits)
      ),
    },
    split70_30: {
      stakerPool70MbzrSubunits: split.stakerPool70MbzrSubunits.toString(),
      stakerPool70MbzrFormatted: format7Decimals(split.stakerPool70MbzrSubunits),
      polTreasury30MbzrSubunits: split.polTreasury30MbzrSubunits.toString(),
      polTreasury30MbzrFormatted: format7Decimals(split.polTreasury30MbzrSubunits),
      dustRemainderMbzrSubunits: dustRemainder.toString(),
      polReserveTotalMbzrSubunits: nextPolMbzr.toString(),
      polReserveTotalMbzrFormatted: format7Decimals(nextPolMbzr),
      polReserveTotalPiFormatted: format7Decimals(nextPolPiStroops),
    },
    stakerAccruals: stakerSummaries,
    indexCount: EPOCH_REWARD_LEDGER_INDEXES.length,
  };
}