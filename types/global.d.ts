export {};

/**
 * 🛡️ MESH DEFINITIONS: Global Namespace Registry
 * Strictly partitioned to prevent cross-domain contamination.
 */

declare global {
  interface Window {
    // 🛡️ NEO PROTOCOL: Pi Network SDK Primary Anchor
    Pi: import('./sdk-types').PiSDK;

    // 🛰️ VENDOR BRIDGE: Stellar/Freighter (Isolated)
    freighter?: any; 
  }
}