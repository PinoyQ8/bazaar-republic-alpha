// Location: app/lib/governance/tierRbac.ts
export type GovernanceTierLevel = 1 | 2 | 3 | 4 | 5;

export type DashboardSectionKey =
  | "OVERVIEW_DASHBOARD"
  | "GOVERNANCE_CONSOLE"
  | "STAKING_VAULT_CARD"
  | "VALIDATOR_TELEMETRY_CARD"
  | "ELDER_ADJUDICATION_PANEL";

export type GovernanceSubSectionKey =
  | "MARKET_CATALOG"
  | "MARKET_INVENTORY"
  | "ESCROW_VIEW"
  | "ESCROW_EXECUTE"
  | "STAKING_METRICS"
  | "STAKING_VAULT_ACTIONS"
  | "ACADEMY_MODULES"
  | "GOVERNANCE_VIEW"
  | "GOVERNANCE_ELDER_ACTIONS"
  | "FOUNDER_CONSOLE";

export type GovernanceAction =
  | "VIEW_GOVERNANCE"
  | "VIEW_MARKETPLACE"
  | "MANAGE_INVENTORY"
  | "VOTE_PROPOSAL"
  | "CREATE_CITIZEN_PROPOSAL"
  | "CREATE_MERCHANT_PROPOSAL"
  | "CREATE_LIQUIDITY_PROPOSAL"
  | "MANAGE_STAKING_VAULT"
  | "TRIGGER_NODE_PULSE"
  | "MANAGE_NODE_KEEPERS"
  | "CREATE_INFRA_PROPOSAL"
  | "SETTLE_EPOCH_FEES"
  | "CREATE_CORE_PROPOSAL"
  | "ADJUDICATE_ELDER_DISPUTE"
  | "EMERGENCY_VETO_FREEZE";

export interface RbacSubject {
  tier?: unknown;
  hasRole?: boolean;
  hasPassport?: boolean;
  isFrozen?: boolean;
  isFounder?: boolean;
  role?: string;
}

export const GOVERNANCE_TIER_META: Record<
  GovernanceTierLevel,
  {
    level: GovernanceTierLevel;
    shortLabel: string;
    label: string;
    badgeClass: string;
    summary: string;
  }
> = {
  1: {
    level: 1,
    shortLabel: "T1 • Citizen",
    label: "Tier 1 • Citizen",
    badgeClass: "border-zinc-700 bg-zinc-900 text-zinc-300",
    summary: "Read-only infra & pool metrics; market browsing open (inventory locked)",
  },
  2: {
    level: 2,
    shortLabel: "T2 • Merchant",
    label: "Tier 2 • Merchant",
    badgeClass: "border-cyan-800/70 bg-cyan-950/60 text-cyan-300",
    summary: "Unlocks inventory & commerce scope; vault & node controls remain locked",
  },
  3: {
    level: 3,
    shortLabel: "T3 • Core/LP",
    label: "Tier 3 • Academy Core",
    badgeClass: "border-indigo-800/70 bg-indigo-950/60 text-indigo-300",
    summary: "Unlocks Pi liquidity locking, reward claims, unbonding & fee-split proposals",
  },
  4: {
    level: 4,
    shortLabel: "T4 • Guardian",
    label: "Tier 4 • Guardian / Validator",
    badgeClass: "border-emerald-800/70 bg-emerald-950/60 text-emerald-300",
    summary: "Unlocks Validator telemetry, manual heartbeat pulse & SoloHost/TTL controls",
  },
  5: {
    level: 5,
    shortLabel: "T5 • Genesis",
    label: "Tier 5 • Genesis / Elder",
    badgeClass: "border-amber-800/70 bg-amber-950/60 text-amber-300",
    summary: "Full protocol clearance: epoch settlement, Elder disputes & core upgrades",
  },
};

export const DASHBOARD_MIN_TIER: Record<DashboardSectionKey, GovernanceTierLevel> = {
  OVERVIEW_DASHBOARD: 1,
  GOVERNANCE_CONSOLE: 1,
  STAKING_VAULT_CARD: 3,
  VALIDATOR_TELEMETRY_CARD: 4,
  ELDER_ADJUDICATION_PANEL: 5,
};

export const ACTION_MIN_TIER: Record<GovernanceAction, GovernanceTierLevel> = {
  VIEW_GOVERNANCE: 1,
  VIEW_MARKETPLACE: 1,
  MANAGE_INVENTORY: 2,
  VOTE_PROPOSAL: 1,
  CREATE_CITIZEN_PROPOSAL: 1,
  CREATE_MERCHANT_PROPOSAL: 2,
  CREATE_LIQUIDITY_PROPOSAL: 3,
  MANAGE_STAKING_VAULT: 3,
  TRIGGER_NODE_PULSE: 4,
  MANAGE_NODE_KEEPERS: 4,
  CREATE_INFRA_PROPOSAL: 4,
  SETTLE_EPOCH_FEES: 5,
  CREATE_CORE_PROPOSAL: 5,
  ADJUDICATE_ELDER_DISPUTE: 5,
  EMERGENCY_VETO_FREEZE: 5,
};

export function normalizeTierLevel(raw: unknown): GovernanceTierLevel {
  if (typeof raw === "number" && raw >= 1 && raw <= 5) {
    return Math.trunc(raw) as GovernanceTierLevel;
  }
  if (typeof raw === "string") {
    const upper = raw.trim().toUpperCase();
    if (
      upper.includes("5") ||
      upper.includes("GENESIS") ||
      upper.includes("ELDER") ||
      upper.includes("FOUNDER")
    ) {
      return 5;
    }
    if (upper.includes("4") || upper.includes("GUARDIAN") || upper.includes("VALIDATOR")) {
      return 4;
    }
    if (upper.includes("3") || upper.includes("CORE") || upper.includes("LIQUIDITY")) {
      return 3;
    }
    if (upper.includes("2") || upper.includes("MERCHANT") || upper.includes("NOVICE")) {
      return 2;
    }
  }
  return 1;
}

export function isFounderSubject(subject?: RbacSubject): boolean {
  if (!subject) return false;
  if (subject.isFounder === true) return true;
  if (typeof subject.role === "string") {
    const upper = subject.role.trim().toUpperCase();
    return upper === "FOUNDER" || upper === "BAZAAR_FOUNDER";
  }
  return false;
}

export function canAccessDashboardSection(
  tierInput: unknown,
  section: DashboardSectionKey
): { allowed: boolean; currentTier: GovernanceTierLevel; requiredTier: GovernanceTierLevel } {
  const currentTier = normalizeTierLevel(tierInput);
  const requiredTier = DASHBOARD_MIN_TIER[section];
  return {
    allowed: currentTier >= requiredTier,
    currentTier,
    requiredTier,
  };
}

export function canPerformGovernanceAction(
  tierInput: unknown,
  action: GovernanceAction,
  options?: {
    isFrozen?: boolean;
    hasPassport?: boolean;
    hasRole?: boolean;
  }
): {
  allowed: boolean;
  currentTier: GovernanceTierLevel;
  requiredTier: GovernanceTierLevel;
  reason?: string;
} {
  const currentTier = normalizeTierLevel(tierInput);
  const requiredTier = ACTION_MIN_TIER[action];

  if (options?.isFrozen) {
    return {
      allowed: false,
      currentTier,
      requiredTier,
      reason: "Account/node frozen by protocol sanction",
    };
  }

  if (action === "VIEW_MARKETPLACE") {
    return { allowed: true, currentTier, requiredTier };
  }

  if (action === "MANAGE_INVENTORY") {
    if (options?.hasRole === false || options?.hasPassport === false) {
      return {
        allowed: false,
        currentTier,
        requiredTier,
        reason: "No active role or Republic Passport — inventory access denied",
      };
    }
    if (currentTier < requiredTier) {
      return {
        allowed: false,
        currentTier,
        requiredTier,
        reason: `Inventory requires ${GOVERNANCE_TIER_META[requiredTier].label}`,
      };
    }
    return { allowed: true, currentTier, requiredTier };
  }

  if (options?.hasPassport === false && action !== "VIEW_GOVERNANCE") {
    return {
      allowed: false,
      currentTier,
      requiredTier,
      reason: "Active Republic Passport required",
    };
  }

  if (currentTier < requiredTier) {
    return {
      allowed: false,
      currentTier,
      requiredTier,
      reason: `Requires ${GOVERNANCE_TIER_META[requiredTier].label}`,
    };
  }

  return { allowed: true, currentTier, requiredTier };
}

export function canAccessSubSection(
  subSection: GovernanceSubSectionKey,
  subject?: RbacSubject
): { allowed: boolean; requiredTierLabel: string; reason?: string } {
  const tier = normalizeTierLevel(subject?.tier ?? 1);
  const hasRole = subject?.hasRole ?? true;
  const hasPassport = subject?.hasPassport ?? true;
  const isFrozen = subject?.isFrozen ?? false;
  const founder = isFounderSubject(subject);

  if (isFrozen) {
    return {
      allowed: false,
      requiredTierLabel: "Active Status",
      reason: "Account/node frozen by protocol sanction",
    };
  }

  switch (subSection) {
    case "MARKET_CATALOG":
    case "ESCROW_VIEW":
    case "STAKING_METRICS":
    case "ACADEMY_MODULES":
    case "GOVERNANCE_VIEW":
      return { allowed: true, requiredTierLabel: "T1 • Citizen" };

    case "MARKET_INVENTORY":
      if (!hasRole || !hasPassport) {
        return {
          allowed: false,
          requiredTierLabel: "T2 • Merchant",
          reason: "No active role or Republic Passport — inventory access denied",
        };
      }
      if (tier < 2) {
        return {
          allowed: false,
          requiredTierLabel: "T2 • Merchant",
          reason: "Inventory requires Tier 2 • Merchant or higher",
        };
      }
      return { allowed: true, requiredTierLabel: "T2 • Merchant" };

    case "ESCROW_EXECUTE":
      if (!hasRole || !hasPassport) {
        return {
          allowed: false,
          requiredTierLabel: "T2 • Merchant",
          reason: "Active role/passport required to execute escrow actions",
        };
      }
      if (tier < 2) {
        return {
          allowed: false,
          requiredTierLabel: "T2 • Merchant",
          reason: "Escrow execution requires Tier 2+ clearance",
        };
      }
      return { allowed: true, requiredTierLabel: "T2 • Merchant" };

    case "STAKING_VAULT_ACTIONS": {
      const res = canPerformGovernanceAction(tier, "MANAGE_STAKING_VAULT", {
        hasPassport,
        isFrozen,
        hasRole,
      });
      return {
        allowed: res.allowed,
        requiredTierLabel: GOVERNANCE_TIER_META[res.requiredTier].shortLabel,
        reason: res.reason,
      };
    }

    case "GOVERNANCE_ELDER_ACTIONS": {
      const res = canPerformGovernanceAction(tier, "ADJUDICATE_ELDER_DISPUTE", {
        hasPassport,
        isFrozen,
        hasRole,
      });
      return {
        allowed: res.allowed,
        requiredTierLabel: GOVERNANCE_TIER_META[res.requiredTier].shortLabel,
        reason: res.reason,
      };
    }

    case "FOUNDER_CONSOLE":
      if (!founder) {
        return {
          allowed: false,
          requiredTierLabel: "Founder Only",
          reason: "Restricted to Founder role",
        };
      }
      return { allowed: true, requiredTierLabel: "Founder" };
  }
}