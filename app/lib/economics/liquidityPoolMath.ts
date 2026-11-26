/**
 * Bazaar Republic — Liquidity Pool & Staking BigInt Math Engine
 *
 * Precision & Peg Invariants:
 * - 1.0000000 Pi    = 10,000,000n stroops (10^7)
 * - 1.0000000 mBZR  = 10,000,000n mBZR subunits (10^7) = 10,000n Pi stroops
 * - Fixed Utility Peg: 1 Pi = 1,000 mBZR (1 Pi stroop = 1,000n mBZR subunits)
 * - Global Pool Cap:   1,000.0000000 Pi = 10,000,000,000n stroops
 * - Basis Points:      10,000n bps = 100.00%
 */

export const STROOPS_PER_PI = 10_000_000n;
export const SUBUNITS_PER_MBZR = 10_000_000n;
export const PEG_MBZR_PER_PI = 1_000n;
export const PI_STROOPS_PER_MBZR = 10_000n;

export const GLOBAL_POOL_CAP_PI_STROOPS = 10_000_000_000n; // 1,000.0000000 Pi
export const DEFAULT_MIN_STAKE_PI_STROOPS = 10_000_000n;    // 1.0000000 Pi
export const DEFAULT_MAX_STAKE_PER_PIONEER_PI_STROOPS = 250_000_000n; // 25.0000000 Pi

export const BPS_DENOMINATOR = 10_000n;
export const SWAP_FEE_BPS = 30n;         // 0.30%
export const STAKER_SHARE_BPS = 7_000n;  // 70.00% of fees -> Stakers / Nodes
export const POL_SHARE_BPS = 3_000n;     // 30.00% of fees -> Protocol-Owned Liquidity
export const MELT_TARIFF_BPS = 50n;      // 0.50% L1 exit/melt tariff

export const MIN_UPTIME_THRESHOLD_PCT = 85;
export const TARGET_UPTIME_SHIELD_PCT = 92;

export type LockTierDays = 30 | 60 | 90;
export type SwapDirection = "PI_TO_MBZR" | "MBZR_TO_PI";

export interface PoolDepositValidationResult {
  allowed: boolean;
  reason?:
    | "INVALID_AMOUNT"
    | "BELOW_MIN_STAKE"
    | "GLOBAL_1000_PI_CAP_EXCEEDED"
    | "PIONEER_STAKE_CAP_EXCEEDED";
  remainingGlobalCapPiStroops: bigint;
  remainingPioneerCapPiStroops: bigint;
  projectedEquivalentMbzrSubunits: bigint;
}

export interface SwapAndFeeSplitResult {
  direction: SwapDirection;
  grossInputUnits: bigint;
  effectiveFeeBps: bigint;
  feeInputUnits: bigint;
  netInputUnits: bigint;
  netOutputUnits: bigint;
  feeMbzrSubunits: bigint;
  stakerShareMbzrSubunits: bigint; // 70%
  polShareMbzrSubunits: bigint;    // 30% (exact remainder)
}

export interface MeltExitResult {
  grossMbzrSubunits: bigint;
  tariffBps: bigint;
  tariffMbzrSubunits: bigint;
  netMbzrSubunits: bigint;
  grossPiStroops: bigint;
  netPiStroops: bigint;
}

export interface StakeWeightBreakdown {
  principalPiStroops: bigint;
  lockTierDays: LockTierDays;
  lockMultiplierBps: bigint;
  uptimeShieldPct: number;
  activityMultiplierBps: bigint;
  effectiveWeightUnits: bigint;
}

export interface EpochPoolSplitResult {
  swapFeesMbzrSubunits: bigint;
  marketplaceFeesMbzrSubunits: bigint;
  meltTariffsMbzrSubunits: bigint;
  slashedPenaltiesMbzrSubunits: bigint;
  grossFeePoolMbzrSubunits: bigint;
  stakerPool70MbzrSubunits: bigint;
  polTreasury30MbzrSubunits: bigint;
}

/** Parse decimal string or bigint into exact 7-decimal BigInt stroops/subunits (truncates beyond 7 decimals). */
export function parseDecimalTo7Decimals(value: string | number | bigint): bigint {
  if (typeof value === "bigint") return value;
  const raw = typeof value === "number" ? value.toString() : value.trim();
  if (!raw || !/^-?\d+(\.\d+)?$/.test(raw)) {
    throw new Error(`Invalid decimal value for 7-decimal conversion: "${value}"`);
  }

  const negative = raw.startsWith("-");
  const unsigned = negative ? raw.slice(1) : raw;
  const [wholePart, fracPart = ""] = unsigned.split(".");
  const paddedFrac = (fracPart + "0000000").slice(0, 7);
  const combined = BigInt(`${wholePart}${paddedFrac}`);
  return negative ? -combined : combined;
}

/** Format 7-decimal BigInt stroops/subunits into a fixed 7-decimal string (e.g. "10.0000000"). */
export function format7Decimals(units: bigint): string {
  const negative = units < 0n;
  const abs = negative ? -units : units;
  const whole = abs / STROOPS_PER_PI;
  const frac = (abs % STROOPS_PER_PI).toString().padStart(7, "0");
  return `${negative ? "-" : ""}${whole.toString()}.${frac}`;
}

/** Convert L1 Pi stroops -> L2 mBZR subunits at 1 Pi = 1,000 mBZR (1 Pi stroop = 1,000 mBZR subunits). */
export function piStroopsToMbzrSubunits(piStroops: bigint): bigint {
  return piStroops * PEG_MBZR_PER_PI;
}

/** Convert L2 mBZR subunits -> L1 Pi stroops at 1 Pi = 1,000 mBZR (10,000 Pi stroops = 1 mBZR = 10^7 subunits). */
export function mbzrSubunitsToPiStroops(mbzrSubunits: bigint): bigint {
  return mbzrSubunits / PEG_MBZR_PER_PI;
}

/** Compute collateralization ratio in basis points (10,000n = 1.00x = 100% backed). */
export function computeCollateralRatioBps(
  vaultCollateralPiStroops: bigint,
  activeMbzrSubunits: bigint
): bigint {
  if (activeMbzrSubunits <= 0n) return BPS_DENOMINATOR;
  const backedMbzrSubunits = piStroopsToMbzrSubunits(vaultCollateralPiStroops);
  return (backedMbzrSubunits * BPS_DENOMINATOR) / activeMbzrSubunits;
}

/** Validate a staking deposit against the 1,000 Pi global cap and per-Pioneer limit. */
export function validatePoolDeposit(params: {
  currentTotalStakedPiStroops: bigint;
  depositPiStroops: bigint;
  userCurrentStakedPiStroops: bigint;
  globalCapPiStroops?: bigint;
  minStakePiStroops?: bigint;
  maxStakePerPioneerPiStroops?: bigint;
}): PoolDepositValidationResult {
  const globalCap = params.globalCapPiStroops ?? GLOBAL_POOL_CAP_PI_STROOPS;
  const minStake = params.minStakePiStroops ?? DEFAULT_MIN_STAKE_PI_STROOPS;
  const userCap = params.maxStakePerPioneerPiStroops ?? DEFAULT_MAX_STAKE_PER_PIONEER_PI_STROOPS;

  const remainingGlobalBefore = globalCap > params.currentTotalStakedPiStroops
    ? globalCap - params.currentTotalStakedPiStroops
    : 0n;
  const remainingUserBefore = userCap > params.userCurrentStakedPiStroops
    ? userCap - params.userCurrentStakedPiStroops
    : 0n;

  if (params.depositPiStroops <= 0n) {
    return {
      allowed: false,
      reason: "INVALID_AMOUNT",
      remainingGlobalCapPiStroops: remainingGlobalBefore,
      remainingPioneerCapPiStroops: remainingUserBefore,
      projectedEquivalentMbzrSubunits: 0n,
    };
  }

  if (params.depositPiStroops < minStake) {
    return {
      allowed: false,
      reason: "BELOW_MIN_STAKE",
      remainingGlobalCapPiStroops: remainingGlobalBefore,
      remainingPioneerCapPiStroops: remainingUserBefore,
      projectedEquivalentMbzrSubunits: piStroopsToMbzrSubunits(params.depositPiStroops),
    };
  }

  if (params.currentTotalStakedPiStroops + params.depositPiStroops > globalCap) {
    return {
      allowed: false,
      reason: "GLOBAL_1000_PI_CAP_EXCEEDED",
      remainingGlobalCapPiStroops: remainingGlobalBefore,
      remainingPioneerCapPiStroops: remainingUserBefore,
      projectedEquivalentMbzrSubunits: piStroopsToMbzrSubunits(params.depositPiStroops),
    };
  }

  if (params.userCurrentStakedPiStroops + params.depositPiStroops > userCap) {
    return {
      allowed: false,
      reason: "PIONEER_STAKE_CAP_EXCEEDED",
      remainingGlobalCapPiStroops: remainingGlobalBefore,
      remainingPioneerCapPiStroops: remainingUserBefore,
      projectedEquivalentMbzrSubunits: piStroopsToMbzrSubunits(params.depositPiStroops),
    };
  }

  return {
    allowed: true,
    remainingGlobalCapPiStroops: globalCap - (params.currentTotalStakedPiStroops + params.depositPiStroops),
    remainingPioneerCapPiStroops: userCap - (params.userCurrentStakedPiStroops + params.depositPiStroops),
    projectedEquivalentMbzrSubunits: piStroopsToMbzrSubunits(params.depositPiStroops),
  };
}

/**
 * Compute swap conversion at 1 Pi = 1,000 mBZR with 0.30% base fee (rebate-adjustable)
 * and exact 70% Staker/Node / 30% POL split.
 * - When direction === "PI_TO_MBZR", grossInputUnits is in Pi stroops and netOutputUnits is in mBZR subunits.
 * - When direction === "MBZR_TO_PI", grossInputUnits is in mBZR subunits and netOutputUnits is in Pi stroops.
 */
export function computeSwapAndFeeSplit(
  grossInputUnits: bigint,
  direction: SwapDirection,
  rebateBps: bigint = 0n,
  baseFeeBps: bigint = SWAP_FEE_BPS
): SwapAndFeeSplitResult {
  if (grossInputUnits < 0n) {
    throw new Error("Swap gross input cannot be negative.");
  }

  const clampedRebateBps = rebateBps < 0n ? 0n : rebateBps > BPS_DENOMINATOR ? BPS_DENOMINATOR : rebateBps;
  const effectiveFeeBps = (baseFeeBps * (BPS_DENOMINATOR - clampedRebateBps)) / BPS_DENOMINATOR;
  const feeInputUnits = (grossInputUnits * effectiveFeeBps) / BPS_DENOMINATOR;
  const netInputUnits = grossInputUnits - feeInputUnits;

  const feeMbzrSubunits =
    direction === "PI_TO_MBZR" ? piStroopsToMbzrSubunits(feeInputUnits) : feeInputUnits;

  const stakerShareMbzrSubunits = (feeMbzrSubunits * STAKER_SHARE_BPS) / BPS_DENOMINATOR;
  const polShareMbzrSubunits = feeMbzrSubunits - stakerShareMbzrSubunits;

  const netOutputUnits =
    direction === "PI_TO_MBZR"
      ? piStroopsToMbzrSubunits(netInputUnits)
      : mbzrSubunitsToPiStroops(netInputUnits);

  return {
    direction,
    grossInputUnits,
    effectiveFeeBps,
    feeInputUnits,
    netInputUnits,
    netOutputUnits,
    feeMbzrSubunits,
    stakerShareMbzrSubunits,
    polShareMbzrSubunits,
  };
}

/** Compute L1 Melt exit tariff (default 0.50% / 50 bps) when redeeming mBZR back to Pi stroops. */
export function computeMeltExit(
  grossMbzrSubunits: bigint,
  tariffBps: bigint = MELT_TARIFF_BPS
): MeltExitResult {
  if (grossMbzrSubunits < 0n) {
    throw new Error("Melt amount cannot be negative.");
  }
  const clampedTariffBps = tariffBps < 0n ? 0n : tariffBps > BPS_DENOMINATOR ? BPS_DENOMINATOR : tariffBps;
  const tariffMbzrSubunits = (grossMbzrSubunits * clampedTariffBps) / BPS_DENOMINATOR;
  const netMbzrSubunits = grossMbzrSubunits - tariffMbzrSubunits;

  return {
    grossMbzrSubunits,
    tariffBps: clampedTariffBps,
    tariffMbzrSubunits,
    netMbzrSubunits,
    grossPiStroops: mbzrSubunitsToPiStroops(grossMbzrSubunits),
    netPiStroops: mbzrSubunitsToPiStroops(netMbzrSubunits),
  };
}

/** Get lock-tier multiplier in basis points: 30d = 1.00x (10,000n), 60d = 1.25x (12,500n), 90d = 1.50x (15,000n). */
export function getLockMultiplierBps(lockTierDays: LockTierDays): bigint {
  switch (lockTierDays) {
    case 90:
      return 15_000n;
    case 60:
      return 12_500n;
    case 30:
    default:
      return 10_000n;
  }
}

/**
 * Compute activity multiplier in basis points from Uptime Shield percentage:
 * - < 85%: 0n (circuit breaker / ineligible)
 * - >= 92%: 10,000n (1.00x full shield)
 * - 85%..91%: linear ramp scaled against 92% shield
 */
export function computeUptimeActivityMultiplierBps(uptimeShieldPct: number): bigint {
  if (Number.isNaN(uptimeShieldPct) || uptimeShieldPct < MIN_UPTIME_THRESHOLD_PCT) {
    return 0n;
  }
  if (uptimeShieldPct >= TARGET_UPTIME_SHIELD_PCT) {
    return BPS_DENOMINATOR;
  }
  const scaled = Math.floor((uptimeShieldPct / TARGET_UPTIME_SHIELD_PCT) * Number(BPS_DENOMINATOR));
  return BigInt(Math.max(0, Math.min(Number(BPS_DENOMINATOR), scaled)));
}

/** Compute a staker's effective weight for pro-rata real-fee distribution. */
export function computeStakeWeightBreakdown(
  principalPiStroops: bigint,
  lockTierDays: LockTierDays,
  uptimeShieldPct: number
): StakeWeightBreakdown {
  const lockMultiplierBps = getLockMultiplierBps(lockTierDays);
  const activityMultiplierBps = computeUptimeActivityMultiplierBps(uptimeShieldPct);
  const scaleSq = BPS_DENOMINATOR * BPS_DENOMINATOR;
  const effectiveWeightUnits =
    (principalPiStroops * lockMultiplierBps * activityMultiplierBps) / scaleSq;

  return {
    principalPiStroops,
    lockTierDays,
    lockMultiplierBps,
    uptimeShieldPct,
    activityMultiplierBps,
    effectiveWeightUnits,
  };
}

/** Aggregate real fee streams for an epoch and apply the 70/30 split (no inflationary minting). */
export function computeEpochFeePoolSplit(params: {
  swapFeesMbzrSubunits: bigint;
  marketplaceFeesMbzrSubunits?: bigint;
  meltTariffsMbzrSubunits?: bigint;
  slashedPenaltiesMbzrSubunits?: bigint;
}): EpochPoolSplitResult {
  const swapFees = params.swapFeesMbzrSubunits;
  const marketplaceFees = params.marketplaceFeesMbzrSubunits ?? 0n;
  const meltTariffs = params.meltTariffsMbzrSubunits ?? 0n;
  const slashedPenalties = params.slashedPenaltiesMbzrSubunits ?? 0n;

  const grossFeePoolMbzrSubunits = swapFees + marketplaceFees + meltTariffs + slashedPenalties;
  const stakerPool70MbzrSubunits = (grossFeePoolMbzrSubunits * STAKER_SHARE_BPS) / BPS_DENOMINATOR;
  const polTreasury30MbzrSubunits = grossFeePoolMbzrSubunits - stakerPool70MbzrSubunits;

  return {
    swapFeesMbzrSubunits: swapFees,
    marketplaceFeesMbzrSubunits: marketplaceFees,
    meltTariffsMbzrSubunits: meltTariffs,
    slashedPenaltiesMbzrSubunits: slashedPenalties,
    grossFeePoolMbzrSubunits,
    stakerPool70MbzrSubunits,
    polTreasury30MbzrSubunits,
  };
}

/** Compute a staker's pro-rata share of the 70% epoch fee pool in mBZR subunits. */
export function computeStakerEpochRewardMbzrSubunits(
  stakerEffectiveWeightUnits: bigint,
  totalPoolEffectiveWeightUnits: bigint,
  stakerPool70MbzrSubunits: bigint
): bigint {
  if (
    stakerEffectiveWeightUnits <= 0n ||
    totalPoolEffectiveWeightUnits <= 0n ||
    stakerPool70MbzrSubunits <= 0n
  ) {
    return 0n;
  }
  return (stakerPool70MbzrSubunits * stakerEffectiveWeightUnits) / totalPoolEffectiveWeightUnits;
}