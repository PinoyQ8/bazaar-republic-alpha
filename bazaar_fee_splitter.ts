/**
 * PROJECT BAZAAR — PHASE 1 DEPIN FEE SPLITTER
 * -----------------------------------------------------------------------------
 * Version: 1.0.0 (Schema v2.7.2 & SLA Protocol-Compliant)
 * 
 * Enforces the 70/30 off-chain fee division. It processes the accumulated 
 * `operatorPool` balance, filters active SoloHost operators based on the 
 * strict 90% Rolling 30-Day SLA, and distributes computational yields 
 * proportionally to their verified TrustScore weights.
 */

import { DECIMAL_MULTIPLIER } from './bazaar_closed_loop_engine';

export interface OperatorNode {
  address: string;
  uptime30d: number;      // Rolling 30-day uptime percentage (90.0% standard baseline)
  trustScore: bigint;     // Weighted trust score (0n to 100n scale represented in 7-decimal)
  isQuarantined: boolean;
  yieldAccrued: bigint;   // Distributed mBZR waiting for collection
}

export interface DistributionReport {
  epochTimestamp: Date;
  totalPoolAllocated: bigint;
  activeEligibleNodes: number;
  quarantinedOrSlaFailedNodes: number;
  payoutPerWeightUnit: bigint;
  dustReturnedToTreasury: bigint;
}

export class BazaarFeeSplitter {
  private operators: Map<string, OperatorNode> = new Map();

  constructor() {}

  /**
   * Registers or updates a SoloHost operator profile in the splitter
   */
  public registerOperator(
    address: string, 
    uptime30d: number, 
    trustScore: bigint, 
    isQuarantined: boolean = false
  ): void {
    this.operators.set(address, {
      address,
      uptime30d,
      trustScore,
      isQuarantined,
      yieldAccrued: 0n
    });
  }

  public getOperator(address: string): OperatorNode {
    const op = this.operators.get(address);
    if (!op) {
      throw new Error(`[FEE-SPLITTER-ERROR] Operator node profile not found: ${address}`);
    }
    return op;
  }

  public getOperators(): OperatorNode[] {
    return Array.from(this.operators.values());
  }

  /**
   * Distributes accumulated operator pool rewards based on uptime and trust weight
   */
  public distributeOperatorPool(
    operatorPoolAmount: bigint
  ): { distributions: OperatorNode[]; report: DistributionReport } {
    if (operatorPoolAmount <= 0n) {
      throw new Error(`[FEE-SPLITTER-ERROR] No accrued operator pool yield to allocate.`);
    }

    // Filter nodes that comply with the strict 90.0% Rolling SLA and are not quarantined
    const eligibleNodes = Array.from(this.operators.values()).filter(node => {
      return node.uptime30d >= 90.0 && !node.isQuarantined && node.trustScore > 0n;
    });

    const failedOrQuarantinedCount = this.operators.size - eligibleNodes.length;

    if (eligibleNodes.length === 0) {
      // If no nodes are eligible, entire pool rolls back to the Treasury (dust)
      return {
        distributions: [],
        report: {
          epochTimestamp: new Date(),
          totalPoolAllocated: 0n,
          activeEligibleNodes: 0,
          quarantinedOrSlaFailedNodes: failedOrQuarantinedCount,
          payoutPerWeightUnit: 0n,
          dustReturnedToTreasury: operatorPoolAmount
        }
      };
    }

    // Sum up the total trust weight of all eligible nodes
    const totalTrustWeight = eligibleNodes.reduce((sum, node) => sum + node.trustScore, 0n);

    // Calculate payouts using integer math to ensure no floating-point rounding errors
    const payoutPerWeightUnit = operatorPoolAmount / totalTrustWeight;
    
    let totalDistributed = 0n;

    for (const node of eligibleNodes) {
      const nodePayout = node.trustScore * payoutPerWeightUnit;
      node.yieldAccrued += nodePayout;
      totalDistributed += nodePayout;
    }

    // Any remaining fraction or division residue (dust) is returned to the Treasury
    const dustReturnedToTreasury = operatorPoolAmount - totalDistributed;

    const report: DistributionReport = {
      epochTimestamp: new Date(),
      totalPoolAllocated: totalDistributed,
      activeEligibleNodes: eligibleNodes.length,
      quarantinedOrSlaFailedNodes: failedOrQuarantinedCount,
      payoutPerWeightUnit,
      dustReturnedToTreasury
    };

    return {
      distributions: eligibleNodes,
      report
    };
  }
}
