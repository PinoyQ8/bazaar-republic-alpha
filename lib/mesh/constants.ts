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

/**
 * Soroban Network Configuration
 */
export const SOROBAN_RPC_URL =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';

export const STELLAR_NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015';

export const BAZAAR_VAULT_CONTRACT_ID =
  process.env.NEXT_PUBLIC_BAZAAR_VAULT_CONTRACT_ID || 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

export const MESH_VAULTS_CONTRACT_ID =
  process.env.NEXT_PUBLIC_MESH_VAULTS_CONTRACT_ID || 'CBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

export const MESH_TOKEN_CONTRACT_ID =
  process.env.NEXT_PUBLIC_MESH_TOKEN_CONTRACT_ID || 'CCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
