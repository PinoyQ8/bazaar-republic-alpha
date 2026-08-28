/**
 * PROJECT BAZAAR — PHASE 1 SOCIAL & EMERGENCY SUPPORT SERVICE
 * -----------------------------------------------------------------------------
 * Version: 1.0.0 (Schema v2.7.2 & Social SLA Protocol-Compliant)
 * 
 * Manages the submission, evaluation, and disbursement of emergency medical
 * and financial aid to node operators. It strictly enforces the 3/5 majority
 * Elder Council approval signatures and protects the "Future Fund" minimum floor
 * to guarantee the survival of the Republic during catastrophic black swan events.
 */

export interface OperatorProfile {
  address: string;
  uptime30d: number;
  isQuarantined: boolean;
}

export enum EmergencyCategory {
  HEALTH_MEDICAL = "HEALTH_MEDICAL",
  NATURAL_DISASTER = "NATURAL_DISASTER",
  INFRASTRUCTURE = "INFRASTRUCTURE",
  HARDWARE_FAILURE = "HARDWARE_FAILURE",
  FINANCIAL_DISTRESS = "FINANCIAL_DISTRESS"
}

export enum AidRequestStatus {
  PENDING = "PENDING",
  UNDER_REVIEW = "UNDER_REVIEW",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  DISBURSED = "DISBURSED"
}

export interface EmergencyAidRequest {
  id: string;
  pioneerId: string;
  walletAddress: string;
  category: EmergencyCategory;
  requestedAmountMBzr: bigint;
  status: AidRequestStatus;
  eldersSigned: string[]; // List of Elder addresses who signed
}

export interface SocialSupportPool {
  id: string;
  totalReservesMBzr: bigint;
  futureFundFloorMBzr: bigint; // 🛡️ The untouched "Future Fund" black swan reserve
  totalDisbursedToDate: bigint;
}

export class BazaarSocialService {
  private pool: SocialSupportPool;
  private requests: Map<string, EmergencyAidRequest> = new Map();

  constructor(initialReserves: bigint, futureFundFloor: bigint) {
    if (initialReserves < futureFundFloor) {
      throw new Error("[SOCIAL-SERVICE-ERROR] Initial reserves cannot start below the Future Fund floor.");
    }
    this.pool = {
      id: "global_pool",
      totalReservesMBzr: initialReserves,
      futureFundFloorMBzr: futureFundFloor,
      totalDisbursedToDate: 0n
    };
  }

  public getPoolState(): SocialSupportPool {
    return { ...this.pool };
  }

  /**
   * Submits a new emergency support request
   */
  public submitAidRequest(
    id: string,
    pioneerId: string,
    walletAddress: string,
    category: EmergencyCategory,
    amountMBzr: bigint
  ): EmergencyAidRequest {
    const request: EmergencyAidRequest = {
      id,
      pioneerId,
      walletAddress,
      category,
      requestedAmountMBzr: amountMBzr,
      status: AidRequestStatus.PENDING,
      eldersSigned: []
    };
    this.requests.set(id, request);
    return request;
  }

  /**
   * Allows an Elder to sign an active aid request (Requires 3 signatures to Approve)
   */
  public signAidRequest(requestId: string, elderAddress: string): EmergencyAidRequest {
    const req = this.requests.get(requestId);
    if (!req) {
      throw new Error(`[SOCIAL-SERVICE-ERROR] Aid request not found: ${requestId}`);
    }

    if (req.status !== AidRequestStatus.PENDING && req.status !== AidRequestStatus.UNDER_REVIEW) {
      throw new Error(`[SOCIAL-SERVICE-ERROR] Cannot sign request that is already ${req.status}`);
    }

    if (req.eldersSigned.includes(elderAddress)) {
      throw new Error(`[SOCIAL-SERVICE-ERROR] Elder ${elderAddress} has already signed this request.`);
    }

    req.eldersSigned.push(elderAddress);
    req.status = AidRequestStatus.UNDER_REVIEW;

    // ⚖️ Enforce 3/5 Majority Council Signatures
    if (req.eldersSigned.length >= 3) {
      req.status = AidRequestStatus.APPROVED;
    }

    return req;
  }

  /**
   * Executes the disbursement of approved funds while safeguarding the "Future Fund" floor
   */
  public disburseAid(requestId: string): { request: EmergencyAidRequest; pool: SocialSupportPool } {
    const req = this.requests.get(requestId);
    if (!req) {
      throw new Error(`[SOCIAL-SERVICE-ERROR] Aid request not found: ${requestId}`);
    }

    if (req.status !== AidRequestStatus.APPROVED) {
      throw new Error(`[SOCIAL-SERVICE-ERROR] Cannot disburse. Request status is ${req.status}, must be APPROVED (minimum 3 Elder signatures).`);
    }

    // 🛡️ BLACK SWAN PROTECTION: Prevent reserve draws that violate the Future Fund minimum floor
    const availableLiquidReserves = this.pool.totalReservesMBzr - this.pool.futureFundFloorMBzr;
    
    if (req.requestedAmountMBzr > availableLiquidReserves) {
      req.status = AidRequestStatus.REJECTED;
      throw new Error(
        `[BLACK-SWAN-BLOCKED] Disbursement of ${req.requestedAmountMBzr} mBZR rejected. ` +
        `This payout would breach the Future Fund floor of ${this.pool.futureFundFloorMBzr} mBZR. ` +
        `Current Reserves: ${this.pool.totalReservesMBzr} mBZR | Max Liquid Allocatable: ${availableLiquidReserves} mBZR.`
      );
    }

    // Execute atomic balance deduction
    this.pool.totalReservesMBzr -= req.requestedAmountMBzr;
    this.pool.totalDisbursedToDate += req.requestedAmountMBzr;
    req.status = AidRequestStatus.DISBURSED;

    return {
      request: req,
      pool: { ...this.pool }
    };
  }
}
