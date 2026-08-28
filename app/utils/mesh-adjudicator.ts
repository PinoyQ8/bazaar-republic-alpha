// Location: /app/utils/mesh-adjudicator.ts
import { createHash } from 'crypto';

// --- MESH CONSTANTS ---
const TIER_COOLDOWNS = {
  Founder: 0, // Anytime
  Genesis: 7 * 24 * 60 * 60 * 1000, // 1 Week in ms
  Merchant: 14 * 24 * 60 * 60 * 1000, // 2 Weeks in ms
  Citizen: 30 * 24 * 60 * 60 * 1000, // 30 Days in ms
};

const TS_THRESHOLDS = {
  Founder: 0, 
  Genesis: 90,
  Merchant: 75,
  Citizen: 50,
};

// --- INTERFACES ---
export type TierLevel = keyof typeof TIER_COOLDOWNS;

export interface ProposerContext {
  nodeId: string;
  tier: TierLevel;
  lastProposalTimestamp: number | null; // Unix timestamp
  currentTS: number;
}

export interface ProposalDraft {
  draftId: string;
  title: string;
  rawText: string;
}

export interface AdjudicatorResult {
  status: 'PASSED' | 'REJECTED';
  clearanceHash?: string;
  violationLog?: string;
}

// --- ARCHITECTURAL LOGIC ---
export class SecurityAdjudicator {
  
  /**
   * Main Pipeline: Processes the draft through all security gates.
   */
  public static verifyProposal(draft: ProposalDraft, context: ProposerContext): AdjudicatorResult {
    // GATE 1: Cooldown Frequency Check
    if (!this.checkCooldown(context)) {
      return this.reject('COOLDOWN_VIOLATION: Node has not cleared the required frequency matrix delay.');
    }

    // GATE 2: TrustScore (TS) Validation
    if (context.currentTS < TS_THRESHOLDS[context.tier]) {
      return this.reject(`TS_VIOLATION: Node TS (${context.currentTS}) is below the required ${TS_THRESHOLDS[context.tier]} threshold for ${context.tier} tier.`);
    }

    // GATE 3: Constitutional Integrity Scan
    if (!this.scanConstitution(draft.rawText)) {
      // NOTE: A failure here triggers the P_slash penalty in the main ledger logic
      return this.reject('CONSTITUTIONAL_VIOLATION: Draft conflicts with Republic Vision, Mission, or Core Architecture.');
    }

    // ALL GATES CLEARED: Generate 26.1.0 execution clearance hash
    const hash = this.generateClearanceHash(draft);
    return {
      status: 'PASSED',
      clearanceHash: hash,
    };
  }

  /**
   * GATE 1 LOGIC: Verifies elapsed time against tier limits.
   */
  private static checkCooldown(context: ProposerContext): boolean {
    if (context.tier === 'Founder') return true; 
    if (!context.lastProposalTimestamp) return true; // First time proposer

    const timeSinceLastProposal = Date.now() - context.lastProposalTimestamp;
    const requiredCooldown = TIER_COOLDOWNS[context.tier];

    return timeSinceLastProposal >= requiredCooldown;
  }

  /**
   * GATE 3 LOGIC: Scans for constitutional invariants (Keyword/AI filter logic)
   */
  private static scanConstitution(rawText: string): boolean {
    const uppercaseText = rawText.toUpperCase();
    
    // Array of forbidden operational invariants (e.g., centralization attempts)
    const FORBIDDEN_INVARIANTS = [
      'BYPASS V26.1.0', 
      'REMOVE UPTIME SHIELD', 
      'CENTRALIZED AUTHORITY', 
      'SUSPEND CONSTITUTION'
    ];

    for (const invariant of FORBIDDEN_INVARIANTS) {
      if (uppercaseText.includes(invariant)) {
        return false; 
      }
    }
    
    // In a fully deployed state, this connects to a deeper NLP or LLM Constitution auditor.
    return true; 
  }

  /**
   * HELPER: Cryptographically stamps approved drafts for the MESH ledger.
   */
  private static generateClearanceHash(draft: ProposalDraft): string {
    const salt = process.env.PI_API_KEY || '26.1.0_fallback_salt';
    const payload = `${draft.draftId}:${draft.title}:${Date.now()}:${salt}`;
    return createHash('sha256').update(payload).digest('hex');
  }

  /**
   * HELPER: Standardizes rejection logging.
   */
  private static reject(reason: string): AdjudicatorResult {
    return {
      status: 'REJECTED',
      violationLog: reason,
    };
  }
}