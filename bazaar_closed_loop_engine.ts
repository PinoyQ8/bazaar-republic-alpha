/**
 * PROJECT BAZAAR — PHASE 1 CLOSED-LOOP ENGINE
 * -----------------------------------------------------------------------------
 * Version: 1.0.0 (Schema v2.7.2 & Model-3 Economic Compliance)
 * 
 * This service runs as the core off-chain transaction processor for the 
 * Bazaar Republic Layer-2 marketplace. It enforces integer-based 7-decimal 
 * BigInt math to prevent JavaScript floating-point rounding drift and 
 * implements the "Melt & Vault" circular treasury mechanics.
 */

// Global Constant for 7-Decimal Precision (1.0000000 mBZR = 10,000,000 units)
export const DECIMAL_MULTIPLIER = 10_000_000n;

export interface mBZRAccount {
  address: string;
  balance: bigint;       // Available off-chain spending balance
  lockedEscrow: bigint;  // Active locked collateral in escrows
  updatedAt: Date;
}

export interface L2Escrow {
  id: string;
  senderAddress: string;
  receiverAddress: string;
  amount: bigint;
  fee: bigint;
  status: 'PENDING_L2' | 'RELEASED_L2' | 'REFUNDED_L2' | 'DISPUTED_L2';
  releaseTimeout: Date;
  createdAt: Date;
}

export interface LedgerState {
  circulatingSupply: bigint; // Total liquid tokens across all users
  escrowSupply: bigint;      // Total locked tokens in active escrows
  treasuryVault: bigint;     // The recirculating "Melt & Vault" pool
  operatorPool: bigint;      // Accrued fees waiting for DePIN node payouts (70%)
}

export interface TransactionReceipt {
  transactionId: string;
  sender: string;
  receiver: string;
  amount: bigint;
  feeTotal: bigint;
  feeOperatorShare: bigint;
  feeTreasuryShare: bigint;
  timestamp: Date;
}

export class BazaarClosedLoopEngine {
  private accounts: Map<string, mBZRAccount> = new Map();
  private escrows: Map<string, L2Escrow> = new Map();
  
  // Ledger balances representing the closed loop economy
  private ledger: LedgerState;

  constructor(initialTreasuryAmount: bigint) {
    this.ledger = {
      circulatingSupply: 0n,
      escrowSupply: 0n,
      treasuryVault: initialTreasuryAmount, // Starts fully loaded in the Vault
      operatorPool: 0n
    };
  }

  // =========================================================================
  // PRECISION MATH HELPERS
  // =========================================================================

  /**
   * Converts a float/string representing mBZR to our internal 7-decimal BigInt
   */
  public static toInternalBigInt(val: number | string): bigint {
    if (typeof val === 'number') {
      // Avoid raw float arithmetic by parsing fixed string
      const fixedStr = val.toFixed(7);
      const [integer, fraction] = fixedStr.split('.');
      return BigInt(integer) * DECIMAL_MULTIPLIER + BigInt(fraction);
    }
    const cleanStr = val.trim();
    if (!cleanStr.includes('.')) {
      return BigInt(cleanStr) * DECIMAL_MULTIPLIER;
    }
    const [integer, fraction] = cleanStr.split('.');
    const paddedFraction = fraction.padEnd(7, '0').slice(0, 7);
    return BigInt(integer) * DECIMAL_MULTIPLIER + BigInt(paddedFraction);
  }

  /**
   * Converts our internal 7-decimal BigInt back to a user-friendly string
   */
  public static toFriendlyString(val: bigint): string {
    const isNegative = val < 0n;
    const absoluteVal = isNegative ? -val : val;
    const integerPart = absoluteVal / DECIMAL_MULTIPLIER;
    const fractionalPart = absoluteVal % DECIMAL_MULTIPLIER;
    const paddedFraction = fractionalPart.toString().padStart(7, '0');
    return `${isNegative ? '-' : ''}${integerPart}.${paddedFraction}`;
  }

  // =========================================================================
  // ACCOUNT PROVISIONING
  // =========================================================================

  /**
   * Creates a local L2 wallet profile
   */
  public createAccount(address: string, initialFunding: bigint = 0n): mBZRAccount {
    if (this.accounts.has(address)) {
      throw new Error(`[CLOSED-LOOP-ERROR] Account already exists: ${address}`);
    }

    // Allocate from treasury recirculating vault if starting with funds
    if (initialFunding > 0n) {
      if (this.ledger.treasuryVault < initialFunding) {
        throw new Error(`[CLOSED-LOOP-ERROR] Insufficient Treasury Vault liquidity for initial funding.`);
      }
      this.ledger.treasuryVault -= initialFunding;
      this.ledger.circulatingSupply += initialFunding;
    }

    const account: mBZRAccount = {
      address,
      balance: initialFunding,
      lockedEscrow: 0n,
      updatedAt: new Date()
    };

    this.accounts.set(address, account);
    return account;
  }

  public getAccount(address: string): mBZRAccount {
    const acc = this.accounts.get(address);
    if (!acc) {
      throw new Error(`[CLOSED-LOOP-ERROR] Account not found: ${address}`);
    }
    return acc;
  }

  public getLedgerState(): LedgerState {
    return { ...this.ledger };
  }

  // =========================================================================
  // TRANSACTION AND SWAP ROUTING (Model-3 Dual-Gas Compliance)
  // =========================================================================

  /**
   * Executes an off-chain P2P transaction or swap with a built-in 0.3% (30 BPS) fee
   * feeBasisPoints: 30 = 0.3%
   */
  public executeTransfer(
    senderAddr: string, 
    receiverAddr: string, 
    amount: bigint, 
    feeBasisPoints: bigint = 30n
  ): TransactionReceipt {
    const sender = this.getAccount(senderAddr);
    const receiver = this.getAccount(receiverAddr);

    if (amount <= 0n) {
      throw new Error(`[CLOSED-LOOP-ERROR] Transfer amount must be greater than zero.`);
    }

    // Calculate Micro-Fee: (Amount * basisPoints) / 10000
    const feeTotal = (amount * feeBasisPoints) / 10000n;
    const totalDeduction = amount + feeTotal;

    if (sender.balance < totalDeduction) {
      throw new Error(`[CLOSED-LOOP-ERROR] Insufficient L2 funds. Needs ${BazaarClosedLoopEngine.toFriendlyString(totalDeduction)} mBZR, has ${BazaarClosedLoopEngine.toFriendlyString(sender.balance)} mBZR.`);
    }

    // 70/30 Split of Transaction Fee
    // 70% to DePIN SoloHost operators, 30% back to Treasury Vault
    const feeOperatorShare = (feeTotal * 70n) / 100n;
    const feeTreasuryShare = feeTotal - feeOperatorShare; // Remainder protects against integer division losses

    // Apply Balances
    sender.balance -= totalDeduction;
    receiver.balance += amount;

    sender.updatedAt = new Date();
    receiver.updatedAt = new Date();

    // Update Global Ledger States (Melt & Vault circular balances)
    this.ledger.circulatingSupply -= feeTotal; // Fees are removed from user circulating supply
    this.ledger.operatorPool += feeOperatorShare;
    this.ledger.treasuryVault += feeTreasuryShare;

    const receipt: TransactionReceipt = {
      transactionId: `tx_${Math.random().toString(36).substring(2, 14)}`,
      sender: senderAddr,
      receiver: receiverAddr,
      amount,
      feeTotal,
      feeOperatorShare,
      feeTreasuryShare,
      timestamp: new Date()
    };

    return receipt;
  }

  // =========================================================================
  // ESCROW UTILITIES (48-Hour Automated Escrow)
  // =========================================================================

  /**
   * Locks user funds in an automated 48-hour L2 Marketplace Escrow
   */
  public createEscrow(
    senderAddr: string,
    receiverAddr: string,
    amount: bigint,
    feeBasisPoints: bigint = 30n
  ): L2Escrow {
    const sender = this.getAccount(senderAddr);
    this.getAccount(receiverAddr); // Confirm receiver exists

    if (amount <= 0n) {
      throw new Error(`[CLOSED-LOOP-ERROR] Escrow amount must be greater than zero.`);
    }

    const fee = (amount * feeBasisPoints) / 10000n;
    const totalDeduction = amount + fee;

    if (sender.balance < totalDeduction) {
      throw new Error(`[CLOSED-LOOP-ERROR] Insufficient L2 funds for escrow lockup.`);
    }

    // Deduct from sender's liquid balance and add to lockedEscrow
    sender.balance -= totalDeduction;
    sender.lockedEscrow += totalDeduction;
    sender.updatedAt = new Date();

    // Move to Ledger Escrow Supply
    this.ledger.circulatingSupply -= totalDeduction;
    this.ledger.escrowSupply += totalDeduction;

    const escrowId = `esc_${Math.random().toString(36).substring(2, 14)}`;
    const releaseTimeout = new Date();
    releaseTimeout.setHours(releaseTimeout.getHours() + 48); // Strict 48-Hour Escrow SLA

    const escrow: L2Escrow = {
      id: escrowId,
      senderAddress: senderAddr,
      receiverAddress: receiverAddr,
      amount,
      fee,
      status: 'PENDING_L2',
      releaseTimeout,
      createdAt: new Date()
    };

    this.escrows.set(escrowId, escrow);
    return escrow;
  }

  /**
   * Releases locked escrow to the merchant
   */
  public releaseEscrow(escrowId: string): void {
    const escrow = this.escrows.get(escrowId);
    if (!escrow) {
      throw new Error(`[CLOSED-LOOP-ERROR] Escrow record not found.`);
    }
    if (escrow.status !== 'PENDING_L2') {
      throw new Error(`[CLOSED-LOOP-ERROR] Escrow has already been finalized.`);
    }

    const sender = this.getAccount(escrow.senderAddress);
    const receiver = this.getAccount(escrow.receiverAddress);

    const totalLocked = escrow.amount + escrow.fee;
    sender.lockedEscrow -= totalLocked;

    // Release principal to merchant, and distribute 70/30 fee
    receiver.balance += escrow.amount;

    const feeOperatorShare = (escrow.fee * 70n) / 100n;
    const feeTreasuryShare = escrow.fee - feeOperatorShare;

    this.ledger.escrowSupply -= totalLocked;
    this.ledger.circulatingSupply += escrow.amount; // Merchant principal enters circulating supply
    this.ledger.operatorPool += feeOperatorShare;
    this.ledger.treasuryVault += feeTreasuryShare;

    escrow.status = 'RELEASED_L2';
    sender.updatedAt = new Date();
    receiver.updatedAt = new Date();
  }

  /**
   * Refunds locked escrow back to the buyer
   */
  public refundEscrow(escrowId: string): void {
    const escrow = this.escrows.get(escrowId);
    if (!escrow) {
      throw new Error(`[CLOSED-LOOP-ERROR] Escrow record not found.`);
    }
    if (escrow.status !== 'PENDING_L2') {
      throw new Error(`[CLOSED-LOOP-ERROR] Escrow has already been finalized.`);
    }

    const sender = this.getAccount(escrow.senderAddress);

    const totalLocked = escrow.amount + escrow.fee;
    sender.lockedEscrow -= totalLocked;
    
    // Refund principal + original fee back to buyer
    sender.balance += totalLocked;

    // Refund from ledger escrow supply back to circulating supply
    this.ledger.escrowSupply -= totalLocked;
    this.ledger.circulatingSupply += totalLocked;

    escrow.status = 'REFUNDED_L2';
    sender.updatedAt = new Date();
  }
}
