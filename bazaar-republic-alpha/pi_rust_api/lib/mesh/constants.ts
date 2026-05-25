/**
 * 🛡️ BAZAAR REPUBLIC: SOVEREIGN CONSTANTS
 * Hard-coding the 1:1000 Scarcity Bridge & 1:1 TestPi Parity.
 */

export const MBZR_GENESIS_CAP = 1_000_000_000;       // 1 Billion mBZR (Utility)
export const MBZR_RATIO = 1000;                       // 1 BZR = 1,000 mBZR

// 🏛️ SOVEREIGN ANCHOR
export const BZR_GENESIS_CAP = MBZR_GENESIS_CAP / MBZR_RATIO; // 1 Million BZR (Governance)
export const TESTPI_RATIO = 1;                        // 1 BZR : 1 TestPi Parity

// 🛠️ EXPORTED CONVERSION LOGIC
export const toBZR = (mbzr: number): number => mbzr / MBZR_RATIO;
export const tomBZR = (bzr: number): number => bzr * MBZR_RATIO;

/**
 * 🚀 TESTNET UPLINK CONVERSION
 * 1 TestPi = 1 BZR = 1,000 mBZR
 */
export const testPiToMBZR = (testPi: number): number => testPi * TESTPI_RATIO * MBZR_RATIO;