/**
 * @file types_identity-v4.ts
 * @package Bazaar Republic Layer-2 DePIN Infrastructure
 * @version 4.0.0
 * @summary Production-grade TypeScript types and interfaces for the 6-Tier Sovereign Passport,
 * integrating biometric WebAuthn auth, Stellar Protocol 27 (CAP-0071) delegation,
 * the 2-Round 80% Consensus Model (Tiers 1-5), and the self-healing 100->10->5 dispute arbitration engine.
 */

export enum SovereignTier {
  FOUNDER = "FOUNDER",                 // Tier 5: Solo Founder & Architect (20% global weight)
  GUARDIAN = "GUARDIAN",               // Tier 4: 100% Qualified Genesis Node Operators (20% global weight)
  ACADEMY_CORE = "ACADEMY_CORE",       // Tier 3: Active Stakers / Graduates (20% global weight)
  MERCHANT = "MERCHANT",               // Tier 2: Merchants & Service Providers (20% global weight)
  CITIZEN = "CITIZEN",                 // Tier 1: KYC-Verified Academy Graduates (20% global weight)
  OBSERVER = "OBSERVER"                // Tier 0: Guest Customers / Cadet Initiates (0% weight, non-voting)
}

export interface BiometricPasskeyCredential {
  credentialId: string;
  publicKey: string;
  deviceModel: string;
  createdAt: Date;
  lastUsedAt: Date;
}

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

export interface SuccessionConfig {
  heirPassportId: string;
  inactivityThresholdMs: number;
  lastActiveTimestamp: Date;
  securityCircleVetoEnabled: boolean;
  isTriggered: boolean;
}

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
  seatingElders: string[];
  activePanel: string[];
  firstBackup: string;
  secondBackup: string;
  votes: DisputeVote[];
  nonRespondingElders: string[];
  startedAt: Date;
  expiresAt: Date;
  resolvedAt?: Date;
}

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
    canVoteInDisputes: true,
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

export interface TierBallot {
  tier: SovereignTier;
  totalVotesCast: number;
  yesVotes: number;
  noVotes: number;
}

export function verifyRound1WithinTier(ballot: TierBallot): boolean {
  if (ballot.tier === SovereignTier.OBSERVER) return false;
  if (ballot.totalVotesCast === 0) return false;
  const yesRatio = ballot.yesVotes / ballot.totalVotesCast;
  return yesRatio >= 0.80;
}

export function verifyRound2GlobalConsensus(ballots: TierBallot[]): {
  isPassed: boolean;
  totalGlobalScorePercent: number;
  approvedTiers: SovereignTier[];
} {
  let globalScore = 0;
  const approvedTiers: SovereignTier[] = [];

  for (const ballot of ballots) {
    if (ballot.tier === SovereignTier.OBSERVER) continue;
    if (verifyRound1WithinTier(ballot)) {
      globalScore += 20;
      approvedTiers.push(ballot.tier);
    }
  }

  return {
    isPassed: globalScore >= 80,
    totalGlobalScorePercent: globalScore,
    approvedTiers
  };
}

export function validateSecurityCircle(circle: SecurityCircle): { isValid: boolean; reason?: string } {
  const memberCount = circle.trustedMembers.length;
  if (memberCount < 3) {
    return { isValid: false, reason: "Security Circle must contain at least 3 trusted members." };
  }
  if (memberCount > 5) {
    return { isValid: false, reason: "Security Circle is capped at a maximum of 5 members." };
  }
  if (circle.recoveryThreshold < 2 || circle.recoveryThreshold > memberCount) {
    return { isValid: false, reason: `Invalid recovery threshold: Must be between 2 and ${memberCount}.` };
  }
  const uniqueMemberIds = new Set(circle.trustedMembers.map(m => m.passportId));
  if (uniqueMemberIds.size !== memberCount) {
    return { isValid: false, reason: "All members in the Security Circle must be unique." };
  }
  return { isValid: true };
}

export function authorizeMeltOrVote(passport: SovereignPassport): { authorized: boolean; reason?: string } {
  if (passport.activeTier === SovereignTier.OBSERVER) {
    return { authorized: false, reason: "Guest Observers (Tier 0) must pass the MESH Academy and complete Pi KYC to upgrade to Citizen (Tier 1)." };
  }
  if (!passport.isAcademyGraduate) {
    return { authorized: false, reason: "must graduate from the MESH Academy to unlock Mainnet actions." };
  }
  if (!passport.isPiKYCVerified) {
    return { authorized: false, reason: "Official Pi Network KYC verification required." };
  }
  if (passport.isSuspended) {
    return { authorized: false, reason: "Account is currently suspended/quarantined." };
  }
  return { authorized: true };
}

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

export function penalizeNonRespondingElder(passport: SovereignPassport): SovereignPassport {
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

  if (updatedConsecutiveMisses >= 2) {
    stats.consecutiveMissedVotes = 0;
  } else {
    stats.consecutiveMissedVotes = updatedConsecutiveMisses;
  }
  stats.totalMissedVotes = updatedTotalMisses;

  return {
    ...passport,
    trustScore: updatedTrustScore,
    elderStats: stats,
    updatedAt: new Date()
  };
}
