/**
 * @file types_identity-v4.ts
 * @package Bazaar Republic Layer-2 DePIN Infrastructure
 * @version 4.0.0
 * @summary Production-grade TypeScript types and interfaces for the 6-Tier Sovereign Passport,
 * integrating biometric WebAuthn auth, Stellar Protocol 27 (CAP-0071) delegation,
 * the 2-Round 80% Consensus Model (Tiers 1-5), and the self-healing 100->10->5 dispute arbitration engine.
 */

/**
 * 🏛️ Core Sovereign Identity Tiers (Finalized 6-Tier Taxonomy)
 * Tiers 1-5 hold exactly 20% global voting weight each (5 * 20% = 100%).
 * Tier 0 represents Guest Customers with 0% weight.
 */
export enum SovereignTier {
  FOUNDER = "FOUNDER",                 // Tier 5: Solo Founder & Architect (20% global weight)
  GUARDIAN = "GUARDIAN",               // Tier 4: 100% Qualified Genesis Node Operators (20% global weight)
  ACADEMY_CORE = "ACADEMY_CORE",       // Tier 3: Active Stakers / Graduates (20% global weight)
  MERCHANT = "MERCHANT",               // Tier 2: Merchants & Service Providers (20% global weight)
  CITIZEN = "CITIZEN",                 // Tier 1: KYC-Verified Academy Graduates (20% global weight)
  OBSERVER = "OBSERVER"                // Tier 0: Guest Customers / Cadet Initiates (0% weight, non-voting)
}

/**
 * 🔒 WebAuthn Biometric Passkey Public Key Credential Structure
 */
export interface BiometricPasskeyCredential {
  credentialId: string;
  publicKey: string;
  deviceModel: string;
  createdAt: Date;
  lastUsedAt: Date;
}

/**
 * 🤝 Security Circle: The Decentralized Web-of-Trust (3-5 Trusted Connections)
 */
export interface SecurityCircle {
  ownerPassportId: string;
  trustedMembers: Array<{
    passportId: string;
    peerPublicKey: string;
    relationshipType: "TRUSTED_PEER" | "FAMILY" | "MERCHANT_PARTNER" | "HEIR_SUCCESSOR";
    trustWeight: number;
    establishedAt: Date;
  }>;
  recoveryThreshold: number;
}

/**
 * ⌛ Account Succession & Cryptographic Dead-Man's Switch
 */
export interface SuccessionConfig {
  heirPassportId: string;
  inactivityThresholdMs: number;
  lastActiveTimestamp: Date;
  securityCircleVetoEnabled: boolean;
  isTriggered: boolean;
}

/**
 * ⚖️ Elder Arbitration Session Tracking
 * Seating Elders are randomly drawn per epoch from qualified Genesis 100 node operators.
 * Active panels randomly draw 5 of the 10 seating elders per case.
 */
export enum DisputeState {
  OPEN = "OPEN",
  VOTING = "VOTING",
  FAILOVER_TRIGGERED = "FAILOVER_TRIGGERED",
  CLOSED_RESOLVED = "CLOSED_RESOLVED",
  CLOSED_DISMISSED = "CLOSED_DISMISSED"
}

export interface DisputeVote {
  elderId: string;
  vote: "IN_FAVOR" | "AGAINST" | "ABSTAIN";
  timestamp: Date;
  biometricSignature: string;
}

export interface ElderArbitrationSession {
  caseId: string;
  epochId: string;
  disputeState: DisputeState;
  seatingElders: string[];              // 10 Seating Elders selected for this epoch from the qualified Genesis pool
  activePanel: string[];                // 5 active Elders randomly drawn for this specific case from the 10 seating elders
  firstBackup: string;                  // 1st backup Elder (remaining seating)
  secondBackup: string;                 // 2nd backup Elder (remaining seating)
  votes: DisputeVote[];
  nonRespondingElders: string[];
  startedAt: Date;
  expiresAt: Date;
  resolvedAt?: Date;
}

/**
 * 🎴 Sovereign Passport: The Unified L2 Identity Blueprint
 */
export interface SovereignPassport {
  id: string;
  piUsername: string;
  kycCountryAnchor: string;
  preferredLocalCurrency: string;
  primaryPublicKey: string;
  activeTier: SovereignTier;
  passkeyCredentials: BiometricPasskeyCredential[];
  securityCircle: SecurityCircle;
  successionConfig?: SuccessionConfig;
  trustScore: number;
  isSuspended: boolean;
  isPiKYCVerified: boolean;             // Master Compliance Flag
  isAcademyGraduate: boolean;           // Master Educational Flag
  
  elderStats?: {
    consecutiveMissedVotes: number;
    totalMissedVotes: number;
    totalSuccessfulVotes: number;
    lastActiveEpoch: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

/**
 * 🛰️ DePIN Node Host Metadata
 */
export interface SoloHostNodeMetadata {
  nodeId: string;
  passportId: string;
  region: string;
  hardwareSpecs: {
    cpuCores: number;
    ramGb: number;
    storageType: "SSD" | "NVMe";
    writeSpeedBytesPerSec: number;
  };
  telemetry: {
    currentUptimePercent30d: number;
    monthlyMaintenanceHoursUsed: number;
    lastSeenHeartbeat: Date;
  };
  isQuarantined: boolean;
}

/**
 * 🏛️ L2 Cryptographic Action Rights Mapping (Revised Permissions)
 */
export const TierPermissions: Record<SovereignTier, {
  canUpgradeContracts: boolean;
  canBypassEscrowLocks: boolean;
  canVoteInDisputes: boolean;
  canClaimNodeYields: boolean;
  canPostEnetworkListings: boolean;
  canOperateSoloHost: boolean;
  canTriggerDeadMansSwitch: boolean;
}> = {
  [SovereignTier.FOUNDER]: {
    canUpgradeContracts: true,
    canBypassEscrowLocks: true,
    canVoteInDisputes: true,
    canClaimNodeYields: true,
    canPostEnetworkListings: true,
    canOperateSoloHost: true,
    canTriggerDeadMansSwitch: true,
  },
  [SovereignTier.GUARDIAN]: {
    canUpgradeContracts: false,
    canBypassEscrowLocks: false,
    canVoteInDisputes: true,          // Part of the active dispute panel
    canClaimNodeYields: true,
    canPostEnetworkListings: true,
    canOperateSoloHost: true,
    canTriggerDeadMansSwitch: true,
  },
  [SovereignTier.ACADEMY_CORE]: {
    canUpgradeContracts: false,
    canBypassEscrowLocks: false,
    canVoteInDisputes: false,
    canClaimNodeYields: true,
    canPostEnetworkListings: true,
    canOperateSoloHost: false,
    canTriggerDeadMansSwitch: false,
  },
  [SovereignTier.MERCHANT]: {
    canUpgradeContracts: false,
    canBypassEscrowLocks: false,
    canVoteInDisputes: false,
    canClaimNodeYields: false,
    canPostEnetworkListings: true,
    canOperateSoloHost: false,
    canTriggerDeadMansSwitch: false,
  },
  [SovereignTier.CITIZEN]: {
    canUpgradeContracts: false,
    canBypassEscrowLocks: false,
    canVoteInDisputes: false,
    canClaimNodeYields: false,
    canPostEnetworkListings: false,
    canOperateSoloHost: false,
    canTriggerDeadMansSwitch: false,
  },
  [SovereignTier.OBSERVER]: {
    canUpgradeContracts: false,
    canBypassEscrowLocks: false,
    canVoteInDisputes: false,
    canClaimNodeYields: false,
    canPostEnetworkListings: false,
    canOperateSoloHost: false,
    canTriggerDeadMansSwitch: false,
  }
};

/**
 * 🗳️ 5-Tier Balanced Governance Consensus Model (2-Round 80% Consensus)
 * Tiers 1-5 hold exactly 20% global voting weight each.
 * Tier 0 (Observer) holds 0% weight.
 */
export interface TierBallot {
  tier: SovereignTier;
  totalVotesCast: number;
  yesVotes: number;
  noVotes: number;
}

/**
 * Round 1: Represents the internal tier vote. Requires >= 80% consensus inside a tier to pass.
 */
export function verifyRound1WithinTier(ballot: TierBallot): boolean {
  if (ballot.tier === SovereignTier.OBSERVER) return false; // Guest Observers cannot vote
  if (ballot.totalVotesCast === 0) return false;
  const yesRatio = ballot.yesVotes / ballot.totalVotesCast;
  return yesRatio >= 0.80; // Strict 80% threshold inside the tier
}

/**
 * Round 2: Aggregates ballots. Each qualified tier (Tiers 1-5) contributes 20% global score.
 * Passing the global gate requires >= 80% score (which mathematically means at least 4 out of 5 tiers must approve).
 */
export function verifyRound2GlobalConsensus(ballots: TierBallot[]): {
  isPassed: boolean;
  totalGlobalScorePercent: number;
  approvedTiers: SovereignTier[];
} {
  let globalScore = 0;
  const approvedTiers: SovereignTier[] = [];

  for (const ballot of ballots) {
    if (ballot.tier === SovereignTier.OBSERVER) continue; // Skip Observer tier as it has 0% weight
    if (verifyRound1WithinTier(ballot)) {
      globalScore += 20; // 20% global weight per tier
      approvedTiers.push(ballot.tier);
    }
  }

  return {
    isPassed: globalScore >= 80, // Mathematically requires 4/5 tiers to internally agree
    totalGlobalScorePercent: globalScore,
    approvedTiers
  };
}

/**
 * 🛡️ Security Circle Verification Helper
 */
export function validateSecurityCircle(circle: SecurityCircle): { isValid: boolean; reason?: string } {
  const memberCount = circle.trustedMembers.length;

  if (memberCount < 3) {
    return { isValid: false, reason: "Security Circle must contain at least 3 trusted members to prevent sybil collusions." };
  }

  if (memberCount > 5) {
    return { isValid: false, reason: "Security Circle is capped at a maximum of 5 members to prevent transaction serialization overhead." };
  }

  if (circle.recoveryThreshold < 2 || circle.recoveryThreshold > memberCount) {
    return { isValid: false, reason: `Invalid recovery threshold: Must be between 2 and ${memberCount}.` };
  }

  const uniqueMemberIds = new Set(circle.trustedMembers.map(m => m.passportId));
  if (uniqueMemberIds.size !== memberCount) {
    return { isValid: false, reason: "All members in the Security Circle must possess unique, non-duplicate passports." };
  }

  return { isValid: true };
}

/**
 * ⌛ Compliance and Authorization Guard
 * Enforces strict Mainnet checks: must be an Academy Graduate AND KYC-verified.
 * Guest Customers (OBSERVER / Tier 0) are programmatically rejected from Melt/Voting.
 */
export function authorizeMeltOrVote(passport: SovereignPassport): { authorized: boolean; reason?: string } {
  if (passport.activeTier === SovereignTier.OBSERVER) {
    return { authorized: false, reason: "Melt or Vote blocked: Guest Observers (Tier 0) must pass the MESH Academy and complete Pi KYC to upgrade to Citizen (Tier 1)." };
  }
  if (!passport.isAcademyGraduate) {
    return { authorized: false, reason: "Melt or Vote blocked: You must graduate from the MESH Academy to unlock Mainnet actions." };
  }
  if (!passport.isPiKYCVerified) {
    return { authorized: false, reason: "Melt or Vote blocked: Official Pi Network KYC verification required." };
  }
  if (passport.isSuspended) {
    return { authorized: false, reason: "Melt or Vote blocked: Account is currently suspended/quarantined." };
  }
  return { authorized: true };
}

/**
 * ⚖️ Self-Healing Failover & Penalty Logic for Non-Responding Arbiters
 */
export function triggerElderFailover(
  session: ElderArbitrationSession,
  missingElderId: string
): { updatedSession: ElderArbitrationSession; promotedElderId: string | null } {
  if (!session.activePanel.includes(missingElderId)) {
    return { updatedSession: session, promotedElderId: null };
  }

  const promotedElderId = session.firstBackup;
  if (!promotedElderId) {
    return { updatedSession: session, promotedElderId: null };
  }

  const updatedPanel = session.activePanel.map(id => id === missingElderId ? promotedElderId : id);
  const updatedNonResponding = [...session.nonRespondingElders, missingElderId];

  const updatedSession: ElderArbitrationSession = {
    ...session,
    disputeState: DisputeState.FAILOVER_TRIGGERED,
    activePanel: updatedPanel,
    firstBackup: session.secondBackup || "",
    secondBackup: "",
    nonRespondingElders: updatedNonResponding,
  };

  return { updatedSession, promotedElderId };
}

/**
 * Applies trustScore decay and strike penalties to a non-responding Elder.
 * Strips their elder status and demotes them to GUARDIAN upon 2 consecutive strikes.
 */
export function penalizeNonRespondingElder(
  passport: SovereignPassport
): SovereignPassport {
  if (passport.activeTier !== SovereignTier.GUARDIAN) {
    return passport;
  }

  const stats = passport.elderStats || {
    consecutiveMissedVotes: 0,
    totalMissedVotes: 0,
    totalSuccessfulVotes: 0,
    lastActiveEpoch: ""
  };

  const updatedConsecutiveMisses = stats.consecutiveMissedVotes + 1;
  const updatedTotalMisses = stats.totalMissedVotes + 1;
  const updatedTrustScore = Math.max(0.0, passport.trustScore - 10.0);

  let updatedTier = passport.activeTier;

  if (updatedConsecutiveMisses >= 2) {
    // Stripped of Elder responsibilities, demoted to Genesis 100 Guardian Pool
    stats.consecutiveMissedVotes = 0;
    updatedTrustScore === Math.max(0.0, updatedTrustScore - 10.0); // Secondary penalty
  } else {
    stats.consecutiveMissedVotes = updatedConsecutiveMisses;
  }

  stats.totalMissedVotes = updatedTotalMisses;

  return {
    ...passport,
    trustScore: updatedTrustScore,
    activeTier: updatedTier,
    elderStats: stats,
    updatedAt: new Date()
  };
}
