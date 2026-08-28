// 🛡️ MESH PROTOCOL: LEDGER STATE STASIS ENGINE

export interface StasisValidationResult {
  isAllowed: boolean;
  sequenceDelta: number;
  remediationAction: "PROCEED" | "QUEUE_BUFFER" | "DROP_TRANSACTION";
  errorCode?: string;
}

interface NodeStatePayload {
  isLocked: boolean;
  lastActiveEpoch: number;
  incomingSequence: number;
}

/**
 * Adjudicates an incoming state mutation against RULE-STASIS-CHECK criteria
 * @param currentState The current on-chain state of the node pulled from the ledger/cache
 * @param currentEpoch The active consensus epoch count of the E-Network
 */
export function validateLedgerStasis(
  currentState: NodeStatePayload,
  currentEpoch: number
): StasisValidationResult {
  
  // VECTOR 1: Hard Account State Lockout Check
  if (currentState.isLocked) {
    return {
      isAllowed: false,
      sequenceDelta: 0,
      remediationAction: "DROP_TRANSACTION",
      errorCode: "ERR_STASIS_ACCOUNT_FROZEN"
    };
  }

  // VECTOR 2: Sequence Boundary Analysis (Anti-Replay Attack Vector)
  const delta = currentState.incomingSequence - currentState.lastActiveEpoch;

  // If the transaction is from a future epoch that hasn't arrived yet, buffer it
  if (delta > 5) {
    return {
      isAllowed: false,
      sequenceDelta: delta,
      remediationAction: "QUEUE_BUFFER",
      errorCode: "WARN_STASIS_EPOCH_DESYNC"
    };
  }

  // If the transaction relies on a stale, expired sequence, terminate it immediately
  if (delta < 0) {
    return {
      isAllowed: false,
      sequenceDelta: delta,
      remediationAction: "DROP_TRANSACTION",
      errorCode: "ERR_STASIS_STALE_SEQUENCE"
    };
  }

  // State is clean and synchronized
  return {
    isAllowed: true,
    sequenceDelta: delta,
    remediationAction: "PROCEED"
  };
}