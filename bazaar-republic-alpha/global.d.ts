export {};

/**
 * 🛡️ MESH DEFINITIONS: Global Namespace Registry
 * Strictly partitioned to prevent cross-domain contamination.
 */

declare global {
  interface Window {
    // 🛡️ NEO PROTOCOL: Pi Network SDK Primary Anchor
    // Using an imported interface ensures strict adherence to the Pi platform contract
    Pi: import('./sdk-types').PiSDK;

    // 🛰️ VENDOR BRIDGE: Third-party integration (Isolated & Optional)
    // Using '?' indicates the property may not exist in all runtimes
    freighter?: any; 
  }
}