// Location: /app/utils/mesh-trustscore.ts

// --- MESH CONSTANTS ---
const TS_WEIGHTS = {
  MAX_V_BASE: 20,
  MAX_U_SHIELD: 40,
  MAX_C_FLOW: 40,
  UPTIME_BENCHMARK: 0.90, // 90% Rolling 30-Day Target
};

// --- INTERFACES ---
export interface NodeTelemetry {
  nodeId: string;
  isKYCVerified: boolean;
  isNodeBound: boolean;      // Wallet securely bound to local X570/Node hardware
  rollingUptime30D: number;  // Decimal representation (e.g., 0.95 for 95%)
  txCount30D: number;        // Valid E-Network transactions in the last 30 days
  stakedPi: number;          // Total Pi locked in the node contract
  activePenalties: number;   // Sum of P_slash deductions (e.g., 50 for constitution breach)
}

export interface PowerMatrix {
  trustScore: number;       // The raw TS (0-100)
  votingPower: number;      // The Quadratic VP
  breakdown: {
    vBase: number;
    uShield: number;
    cFlow: number;
    pSlash: number;
  };
}

// --- ARCHITECTURAL LOGIC ---
export class TrustScoreEngine {
  
  /**
   * Main Pipeline: Calculates the total TrustScore and Quadratic Voting Power.
   */
  public static calculatePowerMatrix(telemetry: NodeTelemetry): PowerMatrix {
    // 1. Verification Base (V_base)
    // Binary: Must have KYC AND Hardware Binding for the 20 points.
    const vBase = (telemetry.isKYCVerified && telemetry.isNodeBound) 
      ? TS_WEIGHTS.MAX_V_BASE 
      : 0;

    // 2. Uptime Shield (U_shield)
    // Scales to max 40 points if rolling uptime meets or exceeds the 90% benchmark.
    const uptimeRatio = telemetry.rollingUptime30D / TS_WEIGHTS.UPTIME_BENCHMARK;
    const uShield = Math.min(TS_WEIGHTS.MAX_U_SHIELD, TS_WEIGHTS.MAX_U_SHIELD * uptimeRatio);

    // 3. Commercial Velocity (C_flow)
    // Logarithmic curve to prevent transaction wash-trading.
    // Math.log is the natural logarithm (ln).
    const cFlow = Math.min(TS_WEIGHTS.MAX_C_FLOW, 10 * Math.log(telemetry.txCount30D + 1));

    // 4. Slashing Penalties (P_slash)
    const pSlash = telemetry.activePenalties;

    // 5. Total TrustScore (TS) Calculation
    // Bounded between 0 and 100.
    const rawTS = vBase + uShield + cFlow - pSlash;
    const trustScore = Math.max(0, Math.min(100, rawTS));

    // 6. Quadratic Voting Power (VP) Calculation
    // VP = (TS / 100) * sqrt(Staked_Pi)
    const votingPower = (trustScore / 100) * Math.sqrt(telemetry.stakedPi);

    return {
      trustScore: parseFloat(trustScore.toFixed(2)),
      votingPower: parseFloat(votingPower.toFixed(4)),
      breakdown: {
        vBase: parseFloat(vBase.toFixed(2)),
        uShield: parseFloat(uShield.toFixed(2)),
        cFlow: parseFloat(cFlow.toFixed(2)),
        pSlash,
      }
    };
  }

  /**
   * Helper: Quick check if a node qualifies for a specific tier.
   */
  public static verifiesTier(ts: number, requiredThreshold: number): boolean {
    return ts >= requiredThreshold;
  }
}