// Location: lib/governance/meshAdjudicator.ts
import crypto from "crypto";
import type {
  GovernanceChamber,
  NodeStatus,
  ProposalScope,
  ProposalStatus,
  Tier,
} from "@prisma/client";

export type AdjudicationOutcome =
  | "APPROVED"
  | "HARD_BLOCKED"
  | "BORDERLINE_ESCALATED";

export interface ConstitutionalViolation {
  article: string;
  code: string;
  explanation: string;
}

export interface BorderlineFlag {
  heuristic:
    | "UNSTRUCTURED_POLICY"
    | "EDGE_ZONE_VALUE"
    | "CROSS_CHAMBER_SPILLOVER"
    | "PROTECTED_KEYWORD";
  reason: string;
}

export interface ProposerContext {
  uid: string;
  tier: Tier;
  assignedChamber: GovernanceChamber;
  status: NodeStatus;
  isFrozen: boolean;
  trustScore: number;
  uptimeShield: number;
  lastProposalSubmittedAt: Date | null;
  lastProposalOutcome: string;
  consecutiveConstitutionalStrikes: number;
}

export interface ProposalDraftInput {
  title: string;
  description: string;
  authorUid: string;
  scope: ProposalScope;
  targetParameter?: string | null;
  proposedValue?: number | null;
  isEmergencyFreezeAction?: boolean;
}

export interface CooldownCheckResult {
  allowed: boolean;
  code?: string;
  reason?: string;
  retryAfterSeconds: number;
  nextEligibleAt?: Date;
}

export interface TriStateVerdict {
  outcome: AdjudicationOutcome;
  nextStatus: ProposalStatus;
  requiredChambers: GovernanceChamber[];
  violations: ConstitutionalViolation[];
  borderlineFlags: BorderlineFlag[];
  adjudicatorSealHash?: string;
  elderReviewWindowHours?: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const BASE_COOLDOWN_DAYS: Record<Tier, number> = {
  OBSERVER: 9999,
  STANDARD: 14,
  CITIZEN: 14,
  PIONEER: 12,
  NOVICE: 10,
  ACADEMY_CORE: 7,
  MESH_GUARDIAN: 5,
  GENESIS: 3,
  BAZAAR_FOUNDER: 1,
};

const SAME_PARAM_LOCKOUT_DAYS: Record<Tier, number> = {
  OBSERVER: 9999,
  STANDARD: 30,
  CITIZEN: 30,
  PIONEER: 25,
  NOVICE: 21,
  ACADEMY_CORE: 14,
  MESH_GUARDIAN: 14,
  GENESIS: 14,
  BAZAAR_FOUNDER: 7,
};

const CHAMBER_MAX_CONCURRENT: Record<GovernanceChamber, number> = {
  CITIZEN: 3,
  MERCHANT: 4,
  SERVICE_PROVIDER: 4,
  GENESIS: 5,
  FOUNDER: 2,
};

const OUTCOME_MULTIPLIERS: Record<string, number> = {
  NONE: 1.0,
  RATIFIED: 1.0,
  ELDER_CLEARED: 1.0,
  DEFEATED: 1.5,
  ELDER_REJECTED: 2.0,
  HARD_BLOCKED: 3.0,
};

const PARAMETER_JURISDICTION: Record<string, GovernanceChamber[]> = {
  MUTUAL_AID_ALLOCATION: ["CITIZEN", "GENESIS"],
  ESCROW_TIMELOCK_HOURS: ["MERCHANT", "GENESIS"],
  MERCHANT_TRADE_LEVY_BPS: ["MERCHANT", "GENESIS"],
  UPTIME_SHIELD_TARGET_PCT: ["SERVICE_PROVIDER", "GENESIS"],
  NODE_YIELD_SPLIT_PCT: ["SERVICE_PROVIDER", "GENESIS"],
  DISPUTE_MIN_BOND_MBZR: ["GENESIS", "MERCHANT"],
  WASM_BEACON_UPGRADE: ["GENESIS", "FOUNDER"],
};

const IMMUTABLE_CONSTITUTIONAL_KEYS: Record<
  string,
  { article: string; explanation: string }
> = {
  PI_MBZR_PEG_RATIO: {
    article: "Article III (Monetary & Solvency Integrity)",
    explanation:
      "The 1 Pi = 1,000 mBZR synthetic peg is permanently locked to preserve micro-commerce precision and 100% reserve parity.",
  },
  MBZR_MAX_SUPPLY_CAP: {
    article: "Article III (Monetary & Solvency Integrity)",
    explanation:
      "The 1,000,000,000 mBZR total supply ceiling is immutable and cannot be inflated via governance.",
  },
  CHAMBER_GLOBAL_WEIGHT_CAP: {
    article: "Article II (Chamber Parity & Anti-Capture)",
    explanation:
      "Each of the 5 Constitutional Chambers is permanently capped at 20% global voting weight.",
  },
  VRF_ELDER_PANEL_SIZE: {
    article: "Article IV (Justice & Continuity Shields)",
    explanation:
      "The 5-Elder odd jury size and 75/25 Schelling bond split are constitutionally fixed to prevent tie deadlocks.",
  },
  HEIR_INACTIVITY_DAYS: {
    article: "Article IV (Justice & Continuity Shields)",
    explanation:
      "RepublicHeirSuccession (90-day inactivity switch + 14-day grace period) cannot be altered via standard proposals.",
  },
};

const PARAMETER_BOUNDS: Record<string, { min: number; max: number }> = {
  MUTUAL_AID_ALLOCATION: { min: 50, max: 50000 },
  ESCROW_TIMELOCK_HOURS: { min: 24, max: 168 },
  MERCHANT_TRADE_LEVY_BPS: { min: 50, max: 500 },
  UPTIME_SHIELD_TARGET_PCT: { min: 85, max: 99 },
  NODE_YIELD_SPLIT_PCT: { min: 50, max: 85 },
  DISPUTE_MIN_BOND_MBZR: { min: 50, max: 5000 },
};

const PROTECTED_KEYWORDS = [
  "peg",
  "treasury",
  "vault",
  "succession",
  "vrf",
  "slashing",
  "mainnet",
  "fiat",
];

// =============================================================
// GATE 1: DUAL-LAYER PROPOSAL COOLDOWN GUARD
// =============================================================
export function evaluateProposalCooldown(
  proposer: ProposerContext,
  chamberState: {
    activeBallotsInChamber: number;
    lastSameParameterClosedAt: Date | null;
  },
  isEmergencyFreezeAction = false,
  now: Date = new Date()
): CooldownCheckResult {
  if (proposer.tier === "OBSERVER") {
    return {
      allowed: false,
      code: "OBSERVER_BLOCKED",
      reason: "Unverified OBSERVER accounts cannot author proposals.",
      retryAfterSeconds: Number.MAX_SAFE_INTEGER,
    };
  }

  if (proposer.tier === "BAZAAR_FOUNDER" && isEmergencyFreezeAction) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const maxConcurrent = CHAMBER_MAX_CONCURRENT[proposer.assignedChamber] ?? 3;
  if (chamberState.activeBallotsInChamber >= maxConcurrent) {
    return {
      allowed: false,
      code: "CHAMBER_CAPACITY_FULL",
      reason: `Chamber '${proposer.assignedChamber}' already has ${chamberState.activeBallotsInChamber}/${maxConcurrent} active ballots.`,
      retryAfterSeconds: 3600,
    };
  }

  if (chamberState.lastSameParameterClosedAt) {
    const lockoutDays = SAME_PARAM_LOCKOUT_DAYS[proposer.tier] ?? 14;
    const unlockAt = new Date(
      chamberState.lastSameParameterClosedAt.getTime() + lockoutDays * DAY_MS
    );
    if (now < unlockAt) {
      return {
        allowed: false,
        code: "PARAMETER_COOLDOWN_ACTIVE",
        reason: `This targetParameter is locked until ${unlockAt.toISOString()}.`,
        retryAfterSeconds: Math.ceil((unlockAt.getTime() - now.getTime()) / 1000),
        nextEligibleAt: unlockAt,
      };
    }
  }

  if (proposer.lastProposalSubmittedAt) {
    const baseDays = BASE_COOLDOWN_DAYS[proposer.tier] ?? 14;
    const mult = OUTCOME_MULTIPLIERS[proposer.lastProposalOutcome] ?? 1.0;
    const strikePenaltyDays =
      proposer.lastProposalOutcome === "HARD_BLOCKED"
        ? Math.min(30, proposer.consecutiveConstitutionalStrikes * 7)
        : 0;

    const eligibleAt = new Date(
      proposer.lastProposalSubmittedAt.getTime() +
        (baseDays * mult + strikePenaltyDays) * DAY_MS
    );

    if (now < eligibleAt) {
      return {
        allowed: false,
        code: "PIONEER_COOLDOWN_ACTIVE",
        reason: `Tier '${proposer.tier}' cooldown (${mult}x) active until ${eligibleAt.toISOString()}.`,
        retryAfterSeconds: Math.ceil((eligibleAt.getTime() - now.getTime()) / 1000),
        nextEligibleAt: eligibleAt,
      };
    }
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

// =============================================================
// GATE 2: TRI-STATE CONSTITUTIONAL ADJUDICATOR
// =============================================================
export function adjudicateProposalTriState(
  proposer: ProposerContext,
  draft: ProposalDraftInput
): TriStateVerdict {
  const violations: ConstitutionalViolation[] = [];
  const borderlineFlags: BorderlineFlag[] = [];
  const isFounder = proposer.tier === "BAZAAR_FOUNDER";

  // Stage 1: Hard-Block Constitutional Axioms
  if (proposer.tier === "OBSERVER") {
    violations.push({
      article: "Article I (Civic Standing & Sybil Defense)",
      code: "ART_I_OBSERVER_BLOCKED",
      explanation: "Unverified OBSERVER accounts hold 0% governance rights.",
    });
  }

  if (proposer.status !== "ACTIVE" || proposer.isFrozen) {
    violations.push({
      article: "Article I (Node Integrity & Sanctions)",
      code: "ART_I_NODE_SANCTIONED",
      explanation: `Node status '${proposer.status}' (isFrozen=${proposer.isFrozen}) is not eligible to author proposals.`,
    });
  }

  if (proposer.uptimeShield < 85 && !isFounder) {
    violations.push({
      article: "Article I (Uptime Shield Suspension Gate)",
      code: "ART_I_UPTIME_BREACH",
      explanation: `Rolling uptime (${proposer.uptimeShield}%) is below the 85% constitutional suspension floor.`,
    });
  }

  if (proposer.trustScore < 65 && !isFounder) {
    violations.push({
      article: "Article I (TrustScore Standing Floor)",
      code: "ART_I_TRUSTSCORE_FLOOR",
      explanation: `TrustScore (${proposer.trustScore}) is below the 65 minimum floor for proposal authorship.`,
    });
  }

  const paramKey = draft.targetParameter?.trim().toUpperCase() || undefined;

  if (paramKey && IMMUTABLE_CONSTITUTIONAL_KEYS[paramKey]) {
    const rule = IMMUTABLE_CONSTITUTIONAL_KEYS[paramKey];
    violations.push({
      article: rule.article,
      code: `IMMUTABLE_${paramKey}`,
      explanation: rule.explanation,
    });
  }

  if (paramKey && !IMMUTABLE_CONSTITUTIONAL_KEYS[paramKey]) {
    const allowedChambers = PARAMETER_JURISDICTION[paramKey];
    if (!allowedChambers) {
      violations.push({
        article: "Article I (Parameter Registry)",
        code: "ART_I_UNKNOWN_PARAMETER",
        explanation: `Parameter '${paramKey}' is not registered in the Republic constitutional schema.`,
      });
    } else if (!allowedChambers.includes(proposer.assignedChamber)) {
      violations.push({
        article: "Article I (Segregation of Duties & Chamber Jurisdiction)",
        code: "ART_I_JURISDICTION_BREACH",
        explanation: `Chamber '${proposer.assignedChamber}' lacks authority over '${paramKey}' (restricted to: ${allowedChambers.join(", ")}).`,
      });
    }
  }

  if (paramKey && PARAMETER_BOUNDS[paramKey]) {
    const { min, max } = PARAMETER_BOUNDS[paramKey];
    if (
      typeof draft.proposedValue !== "number" ||
      Number.isNaN(draft.proposedValue)
    ) {
      violations.push({
        article: "Article V (Quantitative Parameter Safety)",
        code: "ART_V_MISSING_NUMERIC_VALUE",
        explanation: `Parameter '${paramKey}' requires a valid numeric proposedValue.`,
      });
    } else if (draft.proposedValue < min || draft.proposedValue > max) {
      violations.push({
        article: "Article V (Quantitative Parameter Safety)",
        code: "ART_V_HARD_BOUND_EXCEEDED",
        explanation: `Proposed value ${draft.proposedValue} breaches the constitutional [${min}, ${max}] range for '${paramKey}'.`,
      });
    }
  }

  if (violations.length > 0) {
    return {
      outcome: "HARD_BLOCKED",
      nextStatus: "REJECTED",
      requiredChambers: [],
      violations,
      borderlineFlags: [],
    };
  }

  // Stage 2: Borderline Heuristics -> 5-Elder VRF Council Clarification
  if (!paramKey) {
    borderlineFlags.push({
      heuristic: "UNSTRUCTURED_POLICY",
      reason:
        "Proposal contains qualitative policy text without a registered targetParameter; requires Council of Elders constitutional review.",
    });
  }

  if (
    paramKey &&
    PARAMETER_BOUNDS[paramKey] &&
    typeof draft.proposedValue === "number"
  ) {
    const { min, max } = PARAMETER_BOUNDS[paramKey];
    const margin = (max - min) * 0.05;
    if (
      draft.proposedValue <= min + margin ||
      draft.proposedValue >= max - margin
    ) {
      borderlineFlags.push({
        heuristic: "EDGE_ZONE_VALUE",
        reason: `Proposed value (${draft.proposedValue}) sits within 5% of the constitutional [${min}, ${max}] boundary.`,
      });
    }
  }

  if (
    draft.scope === "CHAMBER_LOCAL" &&
    (paramKey === "MERCHANT_TRADE_LEVY_BPS" ||
      paramKey === "NODE_YIELD_SPLIT_PCT")
  ) {
    borderlineFlags.push({
      heuristic: "CROSS_CHAMBER_SPILLOVER",
      reason: `Modifying '${paramKey}' affects revenue splits across multiple chambers and requires Elder scope confirmation.`,
    });
  }

  const combinedText = `${draft.title} ${draft.description}`.toLowerCase();
  const matchedKeywords = PROTECTED_KEYWORDS.filter((kw) =>
    combinedText.includes(kw)
  );
  if (!paramKey && matchedKeywords.length > 0) {
    borderlineFlags.push({
      heuristic: "PROTECTED_KEYWORD",
      reason: `Qualitative proposal references protected constitutional domains (${matchedKeywords.join(", ")}).`,
    });
  }

  if (borderlineFlags.length > 0) {
    return {
      outcome: "BORDERLINE_ESCALATED",
      nextStatus: "ELDER_REVIEW",
      requiredChambers: [],
      violations: [],
      borderlineFlags,
      elderReviewWindowHours: 24,
    };
  }

  // Stage 3: Clean Constitutional Approval
  const requiredChambers: GovernanceChamber[] =
    draft.scope === "CHAMBER_LOCAL"
      ? [proposer.assignedChamber]
      : ["FOUNDER", "GENESIS", "MERCHANT", "SERVICE_PROVIDER", "CITIZEN"];

  const adjudicatorSealHash = crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        authorUid: proposer.uid,
        chamber: proposer.assignedChamber,
        title: draft.title,
        paramKey,
        proposedValue: draft.proposedValue ?? null,
        scope: draft.scope,
      })
    )
    .digest("hex");

  return {
    outcome: "APPROVED",
    nextStatus: "ACTIVE",
    requiredChambers,
    violations: [],
    borderlineFlags: [],
    adjudicatorSealHash,
  };
}

// =============================================================
// CRYPTOGRAPHIC VRF DRAW: 5 IMPARTIAL GENESIS ELDERS
// =============================================================
export function drawRandomElderPanel(
  candidateUids: string[],
  panelSize = 5
): string[] {
  const pool = [...candidateUids];
  for (let i = pool.length - 1; i > 0; i--) {
    const rand = crypto.randomBytes(4).readUInt32BE(0);
    const j = rand % (i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, panelSize);
}