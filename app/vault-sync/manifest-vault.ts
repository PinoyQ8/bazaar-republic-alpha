/**
 * 🛡️ THE MESH PROTOCOL: VAULT MANIFEST SCHEMA
 * ---------------------------------------------------------
 * This configuration dictates offline storage limits,
 * synchronization thresholds, and state persistence rules 
 * for the Vault Sector. Do not expose this logic to the client
 * without strict AuthContext validation.
 */

export const MESH_VAULT_CONFIG = {
  sectorIdentity: "BAZAAR_REPUBLIC_VAULT",
  networkState: "v23-MAINNET-ALPHA",
  
  // 🧭 SYNCHRONIZATION THRESHOLDS
  syncLimits: {
    // 24-hour maximum offline grace period before forcing a hard re-auth
    maxOfflineDurationMs: 86400000, 
    // 5-minute background polling interval when active
    autoSyncIntervalMs: 300000,     
  },

  // 🗄️ STATE MEMORY KEYS (Single Source of Truth Anchors)
  ledgerKeys: {
    masterTimestamp: "VAULT_SYNC_TS",
    pioneerTier: "MESH_TIER",
    activeNode: "MESH_GENESIS_USER"
  },

  // 🔐 ZERO-TRUST SECURITY PARAMETERS
  security: {
    encryptionStandard: "MESH-AES-GCM",
    requireBiometricPrompt: false, // Set to true when Pi Network Native SDK is integrated
    approvedNodes: ["S23_MOBILE_NODE", "X570_WORKSTATION"]
  }
};

/**
 * 🛠️ THE BRIDGE: INTEGRITY VALIDATOR
 * Evaluates the local Master TS against the Vault's offline duration limits.
 * Returns 'true' if the Uptime Shield is intact, 'false' if a re-sync is mandated.
 * 
 * @param {string | null} localTimestamp - The timestamp from localStorage
 * @returns {boolean}
 */
export function validateVaultIntegrity(localTimestamp) {
  if (!localTimestamp) return false;

  const currentTime = Date.now();
  const lastSyncTime = parseInt(localTimestamp, 10);
  
  if (isNaN(lastSyncTime)) return false;

  const timeElapsed = currentTime - lastSyncTime;
  
  // If the time elapsed exceeds 24 hours, the shield is fractured.
  return timeElapsed <= MESH_VAULT_CONFIG.syncLimits.maxOfflineDurationMs;
}

/**
 * 🛠️ THE BRIDGE: PAYLOAD FORMATTER
 * Structures data heading to the MongoDB MESH cluster to ensure strict route integrity.
 */
export function formatVaultPayload(pioneerId, payloadData) {
  return {
    nodeId: pioneerId,
    timestamp: Date.now(),
    network: MESH_VAULT_CONFIG.networkState,
    data: payloadData,
    signature: "AWAITING_ADJUDICATOR" // To be signed by verifyGenesis action
  };
}