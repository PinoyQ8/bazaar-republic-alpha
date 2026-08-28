// Location: app/lib/economics/globalParityEngine.ts

export interface ParityMetrics {
  totalCirculation: bigint;
  futureFundFloor: bigint;
  availableLiquidMBzr: bigint;
  parityRatio: number;
}

export class GlobalParityEngine {
  // Use standard numeric literals without trailing type keywords
  public static readonly FUTURE_FUND_FLOOR: bigint = 3000000000000n; // 300,000.0000000 mBZR
  public static readonly TOTAL_CAP: bigint = 10000000000000n;        // 1,000,000.0000000 mBZR

  public static calculateParity(circulatingSupply: bigint): ParityMetrics {
    const floor = this.FUTURE_FUND_FLOOR;
    const available = circulatingSupply > floor ? circulatingSupply - floor : 0n;
    
    const ratio = Number(circulatingSupply) / Number(this.TOTAL_CAP);

    return {
      totalCirculation: circulatingSupply,
      futureFundFloor: floor,
      availableLiquidMBzr: available,
      parityRatio: isNaN(ratio) ? 0 : ratio,
    };
  }
}

export const globalParityEngine = new GlobalParityEngine();