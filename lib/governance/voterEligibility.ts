// Location: lib/governance/voterEligibility.ts
import type { GovernanceChamber } from "@prisma/client";

export interface PioneerGovernanceProfile {
  uid: string;
  tier: string;
  status: string;
  isFrozen: boolean;
  trustScore: number;
  assignedChamber?: GovernanceChamber | string | null;
  assignedRole?: string | null;
  stakedPi?: number;
  uptimeShield?: number;
  completedModules?: string[];
  isGenesisCohort?: boolean;
}

export interface VoterEligibilityResult {
  eligible: boolean;
  chamber: GovernanceChamber | null;
  weightMultiplier: number;
  reason?: string;
}

const VALID_CHAMBERS = new Set<GovernanceChamber>([
  "FOUNDER",
  "GENESIS",
  "MERCHANT",
  "SERVICE_PROVIDER",
  "CITIZEN",
]);

const ROLE_TO_CHAMBER: Record<string, GovernanceChamber> = {
  ARCHITECT: "FOUNDER",
  GENESIS_ELDER: "GENESIS",
  DEFI_ARBITRAGEUR: "MERCHANT",
  ECO_DEVELOPER: "MERCHANT",
  MERCHANT: "MERCHANT",
  MESH_VALIDATOR: "SERVICE_PROVIDER",
  MESH_GUARDIAN: "SERVICE_PROVIDER",
  NODE_OPERATOR: "SERVICE_PROVIDER",
  COMMUNITY_MANAGER: "CITIZEN",
  SECURITY_CIRCLE_LEAD: "CITIZEN",
  CADET_INITIATE: "CITIZEN",
};

const TIER_TO_CHAMBER: Record<string, GovernanceChamber> = {
  BAZAAR_FOUNDER: "FOUNDER",
  FOUNDER: "FOUNDER",
  FOUNDER_DESCENDANT: "FOUNDER",
  GENESIS_100: "GENESIS",
  GENESIS_ELDER: "GENESIS",
  GENESIS: "GENESIS",
  ECO_DEVELOPER: "MERCHANT",
  DEFI_ARBITRAGEUR: "MERCHANT",
  MERCHANT: "MERCHANT",
  MESH_GUARDIAN: "SERVICE_PROVIDER",
  MESH_VALIDATOR: "SERVICE_PROVIDER",
  SERVICE_PROVIDER: "SERVICE_PROVIDER",
  NOVICE: "CITIZEN",
  CITIZEN: "CITIZEN",
};

export function resolveTierChamber(
  node: Pick<PioneerGovernanceProfile, "tier" | "assignedChamber" | "assignedRole">
): GovernanceChamber | null {
  const normalizedTier = (node.tier || "").toUpperCase();
  if (normalizedTier === "OBSERVER") return null;

  if (normalizedTier === "ACADEMY_CORE") {
    const explicitChamber = (node.assignedChamber || "").toUpperCase() as GovernanceChamber;
    if (VALID_CHAMBERS.has(explicitChamber) && explicitChamber !== "FOUNDER") {
      return explicitChamber;
    }
    const roleKey = (node.assignedRole || "").toUpperCase();
    return ROLE_TO_CHAMBER[roleKey] ?? "CITIZEN";
  }

  if (TIER_TO_CHAMBER[normalizedTier]) {
    return TIER_TO_CHAMBER[normalizedTier];
  }

  const explicitChamber = (node.assignedChamber || "").toUpperCase() as GovernanceChamber;
  return VALID_CHAMBERS.has(explicitChamber) ? explicitChamber : null;
}

export function verifyVoterEligibility(
  node: PioneerGovernanceProfile
): VoterEligibilityResult {
  const normalizedTier = (node.tier || "OBSERVER").toUpperCase();

  if (normalizedTier === "OBSERVER") {
    return {
      eligible: false,
      chamber: null,
      weightMultiplier: 0,
      reason: "OBSERVER_READ_ONLY: Complete Pi KYC and Academy Module 01 to unlock voting.",
    };
  }

  const chamber = resolveTierChamber(node);

  if (node.isFrozen || node.status !== "ACTIVE") {
    return {
      eligible: false,
      chamber,
      weightMultiplier: 0,
      reason: `NODE_INELIGIBLE: Node status is ${node.status}${node.isFrozen ? " (FROZEN)" : ""}.`,
    };
  }

  if (!chamber) {
    return {
      eligible: false,
      chamber: null,
      weightMultiplier: 0,
      reason: `UNKNOWN_TIER: Tier [${normalizedTier}] has no mapped governance chamber.`,
    };
  }

  const modules = new Set((node.completedModules || []).map((m) => m.toUpperCase().replace(/-/g, "_")));
  const hasModule01 = modules.has("MODULE_01") || modules.has("01");
  const hasModule02 = modules.has("MODULE_02") || modules.has("02");
  const hasModule03 = modules.has("MODULE_03") || modules.has("03");

  switch (normalizedTier) {
    case "CITIZEN":
      return { eligible: true, chamber, weightMultiplier: 1.0 };

    case "NOVICE":
      if (!hasModule01 || node.trustScore < 60) {
        return {
          eligible: false,
          chamber,
          weightMultiplier: 0,
          reason: "NOVICE_QUALIFICATION_FAILED: Requires Module 01 and TrustScore >= 60.",
        };
      }
      return { eligible: true, chamber, weightMultiplier: 1.5 };

    case "ACADEMY_CORE": {
      if (!hasModule01 || !hasModule02 || node.trustScore < 75) {
        return {
          eligible: false,
          chamber,
          weightMultiplier: 0,
          reason:
            "ACADEMY_CORE_QUALIFICATION_FAILED: Requires GENESIS_100-certified Modules 01â€“02 and TrustScore >= 75.",
        };
      }
      if (chamber === "MERCHANT" && (node.stakedPi ?? 0) < 15) {
        return {
          eligible: false,
          chamber,
          weightMultiplier: 0,
          reason: "ACADEMY_CORE_MERCHANT_STAKE_FAILED: Merchant chamber voters require Stake >= 15 Pi.",
        };
      }
      if (chamber === "SERVICE_PROVIDER" && (node.uptimeShield ?? 0) < 90) {
        return {
          eligible: false,
          chamber,
          weightMultiplier: 0,
          reason:
            "ACADEMY_CORE_PROVIDER_UPTIME_FAILED: Service Provider chamber voters require Uptime Shield >= 90%.",
        };
      }
      return { eligible: true, chamber, weightMultiplier: 2.0 };
    }

    case "ECO_DEVELOPER":
    case "DEFI_ARBITRAGEUR":
    case "MERCHANT":
      if (!hasModule01 || !hasModule02 || node.trustScore < 75 || (node.stakedPi ?? 0) < 15) {
        return {
          eligible: false,
          chamber,
          weightMultiplier: 0,
          reason: "MERCHANT_QUALIFICATION_FAILED: Requires Modules 01â€“02, TrustScore >= 75, and Stake >= 15 Pi.",
        };
      }
      return { eligible: true, chamber, weightMultiplier: 2.0 };

    case "MESH_GUARDIAN":
    case "MESH_VALIDATOR":
    case "SERVICE_PROVIDER":
      if (!hasModule01 || !hasModule02 || (node.uptimeShield ?? 0) < 90) {
        return {
          eligible: false,
          chamber,
          weightMultiplier: 0,
          reason:
            "PROVIDER_QUALIFICATION_FAILED: Requires Modules 01â€“02 and Uptime Shield >= 90% (92% target).",
        };
      }
      return { eligible: true, chamber, weightMultiplier: 2.5 };

    case "GENESIS_100":
    case "GENESIS_ELDER":
    case "GENESIS":
      if (!hasModule01 || !hasModule02 || !hasModule03 || node.trustScore < 85 || (node.stakedPi ?? 0) < 50) {
        return {
          eligible: false,
          chamber,
          weightMultiplier: 0,
          reason: "GENESIS_QUALIFICATION_FAILED: Requires Modules 01â€“03, TrustScore >= 85, and Stake >= 50 Pi.",
        };
      }
      return { eligible: true, chamber, weightMultiplier: 3.0 };

    case "BAZAAR_FOUNDER":
    case "FOUNDER":
    case "FOUNDER_DESCENDANT":
      return { eligible: true, chamber, weightMultiplier: 1.0 };

    default:
      return {
        eligible: false,
        chamber: null,
        weightMultiplier: 0,
        reason: `UNSUPPORTED_TIER: [${normalizedTier}].`,
      };
  }
}
