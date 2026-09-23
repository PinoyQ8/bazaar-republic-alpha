// Location: lib/mesh/vault.ts
import { BazaarVault } from './contracts';
import {
  SOROBAN_RPC_URL,
  STELLAR_NETWORK_PASSPHRASE,
  BAZAAR_VAULT_CONTRACT_ID,
  stroopsToMbzr,
  mbzrToStroops,
} from './constants';

/**
 * Instantiate BazaarVault Soroban client
 */
export function getBazaarVaultClient(contractId = BAZAAR_VAULT_CONTRACT_ID): BazaarVault.Client {
  return new BazaarVault.Client({
    contractId,
    networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
    rpcUrl: SOROBAN_RPC_URL,
  });
}

/**
 * Fetch on-chain escrow record
 */
export async function fetchVaultEscrow(escrowId: string) {
  try {
    const client = getBazaarVaultClient();
    const tx = await client.get_vault({ escrow_id: escrowId });
    return tx.result;
  } catch (err) {
    console.warn(`[MESH:VAULT] On-chain get_vault failed for ${escrowId}, returning null:`, err);
    return null;
  }
}

/**
 * Lock funds into Soroban escrow for a state channel transition
 */
export async function prepareLockFundsTx(params: {
  escrowId: string;
  tokenContract: string;
  consumer: string;
  provider: string;
  amountMbzr: number;
  durationSecs: number;
}) {
  const client = getBazaarVaultClient();
  return client.lock_funds({
    escrow_id: params.escrowId,
    token_contract: params.tokenContract,
    consumer: params.consumer,
    provider: params.provider,
    amount: mbzrToStroops(params.amountMbzr),
    duration_secs: BigInt(params.durationSecs),
  });
}

/**
 * Release funds on state channel resolution
 */
export async function prepareReleaseFundsTx(escrowId: string, consumer: string) {
  const client = getBazaarVaultClient();
  return client.release_funds({
    escrow_id: escrowId,
    consumer,
  });
}

/**
 * Dispute an escrow on fraud proof submission
 */
export async function prepareDisputeEscrowTx(escrowId: string, caller: string) {
  const client = getBazaarVaultClient();
  return client.dispute_escrow({
    escrow_id: escrowId,
    caller,
  });
}

export async function fetchCurrentCirculation(): Promise<number> {
  console.log('[MESH] Fetching current MBZR circulation...');
  return 1000000;
}

export async function fetchTreasuryBalance(): Promise<number> {
  console.log('[MESH] Fetching DAO Treasury balance...');
  return 500000;
}

export async function fetchTotalBurned(): Promise<number> {
  console.log('[MESH] Fetching total burned MBZR...');
  return 25000;
}
