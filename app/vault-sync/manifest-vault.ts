// app/vault-sync/manifest-vault.ts

export interface VaultPayload<T = unknown> {
  nodeId: string;
  timestamp: number;
  network: string;
  contractId: string;
  data: T;
  signature: string;
  protocolVersion: number;
}

export const MESH_VAULT_CONFIG = {
  sectorIdentity: "BAZAAR_REPUBLIC_VAULT",
  networkState: process.env.NEXT_PUBLIC_PI_NETWORK_PASSPHRASE || "Pi Testnet",
  contractId: process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ID || "CBM5SVJHLHNAEUR4GA3IV5KZFPCCMGTZGMAJUNURUQIEFPTKZLKXQ3RY",
  rpcUrl: process.env.NEXT_PUBLIC_PI_RPC_URL || "https://rpc.testnet.minepi.com",
  protocolVersion: 28,

  // 🧭 SYNCHRONIZATION THRESHOLDS
  syncLimits: {
    maxOfflineDurationMs: 86400000, // 24-hour offline grace period
    autoSyncIntervalMs: 300000,      // 5-minute background polling
  },

  // 🗄️ STATE MEMORY KEYS
  ledgerKeys: {
    masterTimestamp: "VAULT_SYNC_TS",
    pioneerTier: "MESH_TIER",
    activeNode: "MESH_GENESIS_USER",
    lastLedgerSequence: "VAULT_LAST_LEDGER"
  },

  // 🔐 ZERO-TRUST SECURITY PARAMETERS
  security: {
    encryptionStandard: "MESH-AES-GCM",
    requireBiometricPrompt: true, // Enabled for Pi OS / WebAuthn passkey integration
    approvedNodes: ["S23_MOBILE_NODE", "X570_WORKSTATION"],
  }
} as const;

/**
 * 🛠️ THE BRIDGE: INTEGRITY VALIDATOR
 * Evaluates local sync state against max offline duration.
 */
export function validateVaultIntegrity(localTimestamp: string | null): boolean {
  if (!localTimestamp) return false;

  const currentTime = Date.now();
  const lastSyncTime = parseInt(localTimestamp, 10);

  if (Number.isNaN(lastSyncTime)) return false;

  const timeElapsed = currentTime - lastSyncTime;
  return timeElapsed >= 0 && timeElapsed <= MESH_VAULT_CONFIG.syncLimits.maxOfflineDurationMs;
}

/**
 * 🛠️ THE BRIDGE: PAYLOAD FORMATTER
 * Structures telemetry and vault states destined for MongoDB Layer-2 persistence.
 */
export function formatVaultPayload<T>(
  pioneerId: string, 
  payloadData: T, 
  cryptographicSignature?: string
): VaultPayload<T> {
  return {
    nodeId: pioneerId,
    timestamp: Date.now(),
    network: MESH_VAULT_CONFIG.networkState,
    contractId: MESH_VAULT_CONFIG.contractId,
    data: payloadData,
    signature: cryptographicSignature || "PENDING_RELAYER_ATTESTATION",
    protocolVersion: MESH_VAULT_CONFIG.protocolVersion
  };
}