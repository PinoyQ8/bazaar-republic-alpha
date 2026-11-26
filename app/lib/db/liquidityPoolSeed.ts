import { Collection, Db, Document, IndexDescription, ObjectId } from "mongodb";
import {
  DEFAULT_MAX_STAKE_PER_PIONEER_PI_STROOPS,
  DEFAULT_MIN_STAKE_PI_STROOPS,
  GLOBAL_POOL_CAP_PI_STROOPS,
  LockTierDays,
  MELT_TARIFF_BPS,
  MIN_UPTIME_THRESHOLD_PCT,
  PEG_MBZR_PER_PI,
  PI_STROOPS_PER_MBZR,
  POL_SHARE_BPS,
  STAKER_SHARE_BPS,
  STROOPS_PER_PI,
  SUBUNITS_PER_MBZR,
  SWAP_FEE_BPS,
  piStroopsToMbzrSubunits,
} from "../economics/liquidityPoolMath";

export const LIQUIDITY_POOL_ID = "GENESIS_LP_1000_PI" as const;
export const DEFAULT_VAULT_CONTRACT_ID =
  process.env.BAZAAR_VAULT_CONTRACT_ID ||
  process.env.NEXT_PUBLIC_BAZAAR_VAULT_CONTRACT_ID ||
  "CAQMHSA6M2LSDJIHDLPCFJMXC2DQNTNZHV6QMWD3IR6FW3FLR4J7EGEV";

export const UNBONDING_COOLDOWN_SECONDS = 7 * 24 * 60 * 60; // 604,800s (7 days)

export type PoolLifecycleStatus = "ACTIVE" | "PAUSED" | "CAP_REACHED";
export type StakePositionStatus = "ACTIVE" | "UNBONDING" | "WITHDRAWN" | "SLASHED";
export type EpochLedgerStatus = "OPEN" | "SETTLED";

export interface LiquidityPoolConfigRecord {
  _id?: ObjectId;
  poolId: typeof LIQUIDITY_POOL_ID;
  status: PoolLifecycleStatus;

  // Precision & 1:1,000 Peg Constants
  stroopsPerPi: string;
  stroopsPerMbzr: string;
  subunitsPerMbzr: string;
  pegRatioMbzrPerPi: number;

  // Caps & Limits (BigInt stroop / subunit decimal strings)
  globalCapPiStroops: string;
  globalCapMbzrSubunits: string;
  minStakePiStroops: string;
  maxStakePerPioneerPiStroops: string;

  // Live Pool Balances & Reserves (BigInt decimal strings)
  totalStakedPiStroops: string;
  totalUnbondingPiStroops: string;
  activeMbzrIssuedSubunits: string;
  polReservePiStroops: string;
  polReserveMbzrSubunits: string;

  // Fee Split (70% Staker/Node, 30% POL), Melt Tariff & Cooldown
  swapFeeBps: number;
  stakerNodeShareBps: number;
  polTreasuryShareBps: number;
  meltExitTariffBps: number;
  unbondingCooldownSeconds: number;
  minUptimeShieldPct: number;

  // Soroban Vault & Epoch Tracking
  vaultContractId: string;
  currentEpochNumber: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StakePositionRecord {
  _id?: ObjectId;
  stakeId: string;
  poolId: typeof LIQUIDITY_POOL_ID;
  pioneerUid: string;
  stellarAddress: string;

  // Principal & Pegged L2 Equivalent (BigInt decimal strings)
  principalPiStroops: string;
  equivalentMbzrSubunits: string;

  // Lock Tier & Reward Weighting
  lockTierDays: LockTierDays;
  lockMultiplierBps: number;
  uptimeShieldPct: number;
  activityMultiplierBps: number;
  effectiveWeightUnits: string;

  // Real-Fee Reward Tracking (BigInt mBZR subunit strings)
  accruedMbzrSubunits: string;
  claimedMbzrSubunits: string;
  lastClaimedEpoch: number;

  // Lifecycle & On-Chain Tx Proofs
  status: StakePositionStatus;
  lockTxHash: string;
  releaseTxHash?: string;
  stakedAt: Date;
  unlocksAt: Date;
  unbondRequestedAt?: Date;
  unbondCompletesAt?: Date;
  updatedAt: Date;
}

export interface EpochRewardLedgerRecord {
  _id?: ObjectId;
  epochNumber: number;
  poolId: typeof LIQUIDITY_POOL_ID;
  status: EpochLedgerStatus;

  // Real Fee Inflows (mBZR 10^7 subunit strings)
  swapFeesCollectedMbzrSubunits: string;
  marketplaceFeesCollectedMbzrSubunits: string;
  meltTariffsCollectedMbzrSubunits: string;
  slashedPenaltiesMbzrSubunits: string;
  grossFeePoolMbzrSubunits: string;

  // 70 / 30 Distribution & Remainder Carryover
  stakerPool70MbzrSubunits: string;
  polTreasury30MbzrSubunits: string;
  dustRemainderMbzrSubunits: string;

  // Weight Snapshot
  totalPoolEffectiveWeight: string;
  activeStakerCount: number;
  openedAt: Date;
  settledAt?: Date;
}

export const LIQUIDITY_POOL_COLLECTIONS = {
  config: "LiquidityPoolConfig",
  stakes: "StakePosition",
  epochs: "EpochRewardLedger",
} as const;

export const POOL_CONFIG_INDEXES: IndexDescription[] = [
  { key: { poolId: 1 }, name: "idx_pool_config_poolId_unique", unique: true },
];

export const STAKE_POSITION_INDEXES: IndexDescription[] = [
  { key: { stakeId: 1 }, name: "idx_stake_position_stakeId_unique", unique: true },
  { key: { pioneerUid: 1, status: 1 }, name: "idx_stake_position_pioneer_status" },
  { key: { poolId: 1, status: 1 }, name: "idx_stake_position_pool_status" },
  { key: { unlocksAt: 1, status: 1 }, name: "idx_stake_position_unlocksAt_status" },
];

export const EPOCH_REWARD_LEDGER_INDEXES: IndexDescription[] = [
  { key: { epochNumber: 1 }, name: "idx_epoch_ledger_epochNumber_unique", unique: true },
  { key: { poolId: 1, status: 1 }, name: "idx_epoch_ledger_pool_status" },
];

export function buildGenesisPoolConfig(
  now: Date = new Date(),
  vaultContractId: string = DEFAULT_VAULT_CONTRACT_ID
): Omit<LiquidityPoolConfigRecord, "_id"> {
  const globalCapMbzrSubunits = piStroopsToMbzrSubunits(GLOBAL_POOL_CAP_PI_STROOPS).toString();

  return {
    poolId: LIQUIDITY_POOL_ID,
    status: "ACTIVE",
    stroopsPerPi: STROOPS_PER_PI.toString(),
    stroopsPerMbzr: PI_STROOPS_PER_MBZR.toString(),
    subunitsPerMbzr: SUBUNITS_PER_MBZR.toString(),
    pegRatioMbzrPerPi: Number(PEG_MBZR_PER_PI),
    globalCapPiStroops: GLOBAL_POOL_CAP_PI_STROOPS.toString(),
    globalCapMbzrSubunits,
    minStakePiStroops: DEFAULT_MIN_STAKE_PI_STROOPS.toString(),
    maxStakePerPioneerPiStroops: DEFAULT_MAX_STAKE_PER_PIONEER_PI_STROOPS.toString(),
    totalStakedPiStroops: "0",
    totalUnbondingPiStroops: "0",
    activeMbzrIssuedSubunits: "0",
    polReservePiStroops: "0",
    polReserveMbzrSubunits: "0",
    swapFeeBps: Number(SWAP_FEE_BPS),
    stakerNodeShareBps: Number(STAKER_SHARE_BPS),
    polTreasuryShareBps: Number(POL_SHARE_BPS),
    meltExitTariffBps: Number(MELT_TARIFF_BPS),
    unbondingCooldownSeconds: UNBONDING_COOLDOWN_SECONDS,
    minUptimeShieldPct: MIN_UPTIME_THRESHOLD_PCT,
    vaultContractId,
    currentEpochNumber: 1,
    createdAt: now,
    updatedAt: now,
  };
}

export function buildInitialEpochLedger(
  epochNumber: number = 1,
  openedAt: Date = new Date()
): Omit<EpochRewardLedgerRecord, "_id"> {
  return {
    epochNumber,
    poolId: LIQUIDITY_POOL_ID,
    status: "OPEN",
    swapFeesCollectedMbzrSubunits: "0",
    marketplaceFeesCollectedMbzrSubunits: "0",
    meltTariffsCollectedMbzrSubunits: "0",
    slashedPenaltiesMbzrSubunits: "0",
    grossFeePoolMbzrSubunits: "0",
    stakerPool70MbzrSubunits: "0",
    polTreasury30MbzrSubunits: "0",
    dustRemainderMbzrSubunits: "0",
    totalPoolEffectiveWeight: "0",
    activeStakerCount: 0,
    openedAt,
  };
}

/** Ensures indexes exist across LiquidityPoolConfig, StakePosition, and EpochRewardLedger. */
export async function ensureLiquidityPoolIndexes(db: Db): Promise<void> {
  await Promise.all([
    db.collection(LIQUIDITY_POOL_COLLECTIONS.config).createIndexes(POOL_CONFIG_INDEXES),
    db.collection(LIQUIDITY_POOL_COLLECTIONS.stakes).createIndexes(STAKE_POSITION_INDEXES),
    db.collection(LIQUIDITY_POOL_COLLECTIONS.epochs).createIndexes(EPOCH_REWARD_LEDGER_INDEXES),
  ]);
}

/**
 * Idempotently initializes GENESIS_LP_1000_PI in LiquidityPoolConfig, creates indexes
 * for all three collections, and ensures Epoch 1 exists in EpochRewardLedger.
 */
export async function seedLiquidityPoolCollections(
  db: Db,
  vaultContractId: string = DEFAULT_VAULT_CONTRACT_ID
): Promise<{
  pool: LiquidityPoolConfigRecord;
  createdPool: boolean;
  createdInitialEpoch: boolean;
}> {
  await ensureLiquidityPoolIndexes(db);

  const now = new Date();
  const configCol: Collection<Document> = db.collection(LIQUIDITY_POOL_COLLECTIONS.config);
  const epochsCol: Collection<Document> = db.collection(LIQUIDITY_POOL_COLLECTIONS.epochs);

  const existingPool = await configCol.findOne({ poolId: LIQUIDITY_POOL_ID });
  let createdPool = false;

  if (!existingPool) {
    const genesisDoc = buildGenesisPoolConfig(now, vaultContractId);
    await configCol.insertOne(genesisDoc);
    createdPool = true;
  } else {
    await configCol.updateOne(
      { poolId: LIQUIDITY_POOL_ID },
      {
        $set: {
          vaultContractId,
          updatedAt: now,
        },
      }
    );
  }

  const existingEpoch1 = await epochsCol.findOne({ epochNumber: 1 });
  let createdInitialEpoch = false;

  if (!existingEpoch1) {
    await epochsCol.insertOne(buildInitialEpochLedger(1, now));
    createdInitialEpoch = true;
  }

  const pool = (await configCol.findOne({ poolId: LIQUIDITY_POOL_ID })) as unknown as LiquidityPoolConfigRecord;

  return {
    pool,
    createdPool,
    createdInitialEpoch,
  };
}