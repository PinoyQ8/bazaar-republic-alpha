// ==========================================
// 🌐 PROJECT BAZAAR: MESH VERSION SSOT
// ==========================================

export const MESH_VERSION_CONFIG = {
  // Protocol Core
  PROTOCOL_VERSION: "26.1.0",
  CODENAME: "Yardstick",
  ENGINE_BUILD: "2026.06-X570",
  
  // Active Ledger Bindings (Pi Testnet)
  ACTIVE_NETWORK: "pi-testnet",
  NETWORK_PASSPHRASE: "Pi Testnet",
  RPC_ENDPOINT: "https://rpc.testnet.minepi.com",
  
  // Deployed Protocol 26.1 Smart Contract ID
  MESH_CONTRACT_ID: "CAMQTSG2LS3YV67K2VOT62U6ASZDVLSUM3TNLL2M6JJIOQIWCUHIR7OA",
  
  // Legacy / Archived Reference
  ARCHIVED_STASIS_ID: "CDN24RP5XCQ3PRKKLVKQMIGWGV6FRWE45CGSQ2A6GXX3YGL2SGTLFPQL",
} as const;

// 🛡️ Aliased exports for academy and legacy module compatibility
export const MESH_VERSION = MESH_VERSION_CONFIG.PROTOCOL_VERSION;
export const MESH_STATUS = {
  active: true,
  network: MESH_VERSION_CONFIG.ACTIVE_NETWORK,
  version: MESH_VERSION_CONFIG.PROTOCOL_VERSION,
} as const;

export type MeshVersionConfig = typeof MESH_VERSION_CONFIG;