// Location: lib/mesh/constants.ts

/**
 * MESH Collateral Peg: 1 Pi = 1 mBZR (1:1 Direct Collateral Ratio)
 * Subunit precision: 10^7 (Stellar/Soroban stroops)
 */
export const PI_TO_MBZR_RATIO = 1;
export const STROOP_PRECISION = 10_000_000;

export function stroopsToMbzr(stroops: bigint | number): number {
  return Number(stroops) / STROOP_PRECISION;
}

export function mbzrToStroops(mbzr: number): bigint {
  return BigInt(Math.floor(mbzr * STROOP_PRECISION));
}