// Location: lib/rbac/permissions.ts
export enum Permission {
  // Read Capabilities
  READ_PUBLIC_DASHBOARD   = 1 << 0, // 1
  VIEW_MARKET_CATALOG     = 1 << 1, // 2
  
  // Commercial Execution Capabilities
  EXECUTE_ESCROW_LOCK     = 1 << 2, // 4
  RELEASE_MERCHANT_ESCROW = 1 << 3, // 8
  
  // Financial & Staking Capabilities
  STAKE_VAULT_POOL        = 1 << 4, // 16
  CONVERT_MBZR_LIQUIDITY  = 1 << 5, // 32
  
  // Infrastructure Capabilities
  RELAY_SOLOHOST_RPC      = 1 << 6, // 64
  SUBMIT_HEARTBEAT_PING   = 1 << 7, // 128
  
  // Governance Capabilities
  PARTICIPATE_VRF_DISPUTE = 1 << 8, // 256
  SUBMIT_DAO_BALLOT       = 1 << 9, // 512
  EXECUTE_FOUNDER_VETO    = 1 << 10,// 1024
}

export const ROLE_PERMISSIONS: Record<string, number> = {
  CADET_INITIATE: 
    Permission.READ_PUBLIC_DASHBOARD | Permission.VIEW_MARKET_CATALOG,
    
  ECO_DEVELOPER: 
    Permission.READ_PUBLIC_DASHBOARD | Permission.VIEW_MARKET_CATALOG | 
    Permission.EXECUTE_ESCROW_LOCK | Permission.RELEASE_MERCHANT_ESCROW,
    
  DEFI_ARBITRAGEUR: 
    Permission.READ_PUBLIC_DASHBOARD | Permission.VIEW_MARKET_CATALOG | 
    Permission.EXECUTE_ESCROW_LOCK | Permission.RELEASE_MERCHANT_ESCROW |
    Permission.STAKE_VAULT_POOL | Permission.CONVERT_MBZR_LIQUIDITY,
    
  MESH_VALIDATOR: 
    Permission.READ_PUBLIC_DASHBOARD | Permission.VIEW_MARKET_CATALOG | 
    Permission.EXECUTE_ESCROW_LOCK | Permission.RELEASE_MERCHANT_ESCROW |
    Permission.RELAY_SOLOHOST_RPC | Permission.SUBMIT_HEARTBEAT_PING |
    Permission.SUBMIT_DAO_BALLOT,
    
  GENESIS_ELDER: 
    Permission.READ_PUBLIC_DASHBOARD | Permission.VIEW_MARKET_CATALOG | 
    Permission.EXECUTE_ESCROW_LOCK | Permission.RELEASE_MERCHANT_ESCROW |
    Permission.STAKE_VAULT_POOL | Permission.CONVERT_MBZR_LIQUIDITY |
    Permission.RELAY_SOLOHOST_RPC | Permission.SUBMIT_HEARTBEAT_PING |
    Permission.PARTICIPATE_VRF_DISPUTE | Permission.SUBMIT_DAO_BALLOT,

  BAZAAR_FOUNDER: ~0, // All permissions
};