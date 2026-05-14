// lib/mesh/constants.ts

// 🛡️ THE ECONOMIC ANCHORS FOR THE BAZAAR REPUBLIC
// Hard-coded exchange logic for the Genesis Sync
// Metric: 1 Pi = 1 BZR = 1000 mBZR

export const TESTPI_RATIO = 1;
export const BZR_RATIO = 1;
export const MBZR_RATIO = 1000; 

// 🛡️ THE CONVERSION UTILITY
// Formats mBZR into whole BZR for the Treasury Monitor UI
export function toBZR(mBZR_amount: number): number {
  return mBZR_amount / MBZR_RATIO;
}