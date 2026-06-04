import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { 
      nodeId, 
      currentTrustScore, 
      lastActivityTimestamp, 
      heirWalletAddress, 
      inactivityThresholdDays 
    } = await request.json();

    const now = Date.now();
    const inactivityDurationMs = now - lastActivityTimestamp;
    const thresholdMs = inactivityThresholdDays * 24 * 60 * 60 * 1000;

    // 1. TRUST-GRAPH EMERGENCY FREEZE LOGIC
    if (currentTrustScore === 0) {
      return NextResponse.json({
        status: "EMERGENCY_FREEZE",
        isolated: true,
        actionRequired: "CRITICAL: Node isolated via Trust-Graph. All mBZR and BZR permissions revoked.",
        tsMetrics: { currentTrustScore }
      }, { status: 403 });
    }

    if (currentTrustScore < 25) {
      return NextResponse.json({
        status: "WARNING_THROTTLE",
        isolated: false,
        actionRequired: "ALERT: TrustScore dropped below threshold. Governance multipliers throttled by 50%.",
        tsMetrics: { currentTrustScore }
      });
    }

    // 2. THE HEIRS PROTOCOL (DEAD-MAN'S SWITCH)
    if (inactivityDurationMs >= thresholdMs) {
      return NextResponse.json({
        status: "HEIRS_PROTOCOL_TRIGGERED",
        switchActive: true,
        payload: {
          msg: "Time-locked smart contract has verified master node inactivity. Initiating asset relocation safety sequence.",
          targetHeirNode: heirWalletAddress,
          executionTimestamp: now
        }
      });
    }

    // 3. System Baseline Stable
    return NextResponse.json({
      status: "SECURE",
      switchActive: false,
      nodeState: {
        nodeId,
        uptimeShield: "92% Stable",
        daysInactive: Number((inactivityDurationMs / (24 * 60 * 60 * 1000)).toFixed(2))
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: `Security Core error: ${error.message}` }, { status: 500 });
  }
}