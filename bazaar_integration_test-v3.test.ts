import {
  SovereignTier,
  TierPermissions,
  SovereignPassport,
  DisputeState,
  ElderArbitrationSession,
  triggerElderFailover,
  penalizeNonRespondingElder,
  authorizeMeltOrVote,
  verifyRound1WithinTier,
  verifyRound2GlobalConsensus,
  TierBallot
} from "./types_identity-v4";

describe("??? Bazaar Republic Layer-2 Integration & Compliance Test Suite - v3", () => {

  /* =========================================================================
   * MODULE 1: Sovereign Tier & Permission Guard Verification (6 Tiers)
   * ========================================================================= */
  describe("?? Module 1: 6-Tier Permission Guards & Action Rights", () => {
    test("Founder (Tier 5) must hold complete admin and contract upgrade clearances", () => {
      const perms = TierPermissions[SovereignTier.FOUNDER];
      expect(perms.canUpgradeContracts).toBe(true);
      expect(perms.canBypassEscrowLocks).toBe(true);
      expect(perms.canVoteInDisputes).toBe(true);
    });

    test("Mesh Guardians (Tier 4 / Genesis 100) must hold dispute voting and hosting rights but cannot upgrade", () => {
      const perms = TierPermissions[SovereignTier.GUARDIAN];
      expect(perms.canUpgradeContracts).toBe(false);
      expect(perms.canVoteInDisputes).toBe(true);
      expect(perms.canOperateSoloHost).toBe(true);
    });

    test("Academy Core (Tier 3) & Merchants (Tier 2) can post listings but cannot operate core SoloHost replicas", () => {
      const corePerms = TierPermissions[SovereignTier.ACADEMY_CORE];
      const merchantPerms = TierPermissions[SovereignTier.MERCHANT];
      
      expect(corePerms.canPostEnetworkListings).toBe(true);
      expect(corePerms.canOperateSoloHost).toBe(false);
      
      expect(merchantPerms.canPostEnetworkListings).toBe(true);
      expect(merchantPerms.canOperateSoloHost).toBe(false);
    });

    test("Graduated Citizens (Tier 1) represent consumers with zero-gas P2P rights but no listing/admin rights", () => {
      const perms = TierPermissions[SovereignTier.CITIZEN];
      expect(perms.canUpgradeContracts).toBe(false);
      expect(perms.canVoteInDisputes).toBe(false);
      expect(perms.canPostEnetworkListings).toBe(false);
    });

    test("Guest Observers (Tier 0) are completely stripped of all operational & administrative rights", () => {
      const perms = TierPermissions[SovereignTier.OBSERVER];
      expect(perms.canUpgradeContracts).toBe(false);
      expect(perms.canBypassEscrowLocks).toBe(false);
      expect(perms.canVoteInDisputes).toBe(false);
      expect(perms.canOperateSoloHost).toBe(false);
      expect(perms.canPostEnetworkListings).toBe(false);
    });
  });

  /* =========================================================================
   * MODULE 2: Guest Observer (Tier 0) vs. Graduate Citizen (Tier 1) Gates
   * ========================================================================= */
  describe("?? Module 2: Guest Observer (Tier 0) vs. Graduate Citizen (Tier 1) Compliance", () => {
    test("Authorize Melt/Vote must reject Guest Observers (Tier 0) to enforce compliance limits", () => {
      const observerPassport: SovereignPassport = {
        id: "usr_observer_01",
        piUsername: "guest_pioneer",
        kycCountryAnchor: "PH",
        preferredLocalCurrency: "PHP",
        primaryPublicKey: "GDX7...",
        activeTier: SovereignTier.OBSERVER,
        passkeyCredentials: [],
        securityCircle: { ownerPassportId: "usr_observer_01", trustedMembers: [], recoveryThreshold: 0 },
        trustScore: 50.0,
        isSuspended: false,
        isPiKYCVerified: false,
        isAcademyGraduate: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = authorizeMeltOrVote(observerPassport);
      expect(result.authorized).toBe(false);
      expect(result.reason).toContain("Guest Observers (Tier 0) must pass the MESH Academy and complete Pi KYC");
    });

    test("Authorize Melt/Vote must reject un-KYC'ed or ungraduated users even if their tier is Citizen", () => {
      const ungraduatedPassport: SovereignPassport = {
        id: "usr_citizen_01",
        piUsername: "uneducated_pioneer",
        kycCountryAnchor: "IN",
        preferredLocalCurrency: "INR",
        primaryPublicKey: "GAY2...",
        activeTier: SovereignTier.CITIZEN,
        passkeyCredentials: [],
        securityCircle: { ownerPassportId: "usr_citizen_01", trustedMembers: [], recoveryThreshold: 0 },
        trustScore: 80.0,
        isSuspended: false,
        isPiKYCVerified: true,
        isAcademyGraduate: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = authorizeMeltOrVote(ungraduatedPassport);
      expect(result.authorized).toBe(false);
      expect(result.reason).toContain("must graduate from the MESH Academy to unlock Mainnet actions");
    });

    test("Authorize Melt/Vote must approve fully KYC'ed Academy Graduates (Tier 1 Citizen)", () => {
      const compliantPassport: SovereignPassport = {
        id: "usr_citizen_02",
        piUsername: "compliant_pioneer",
        kycCountryAnchor: "PH",
        preferredLocalCurrency: "PHP",
        primaryPublicKey: "GDX9...",
        activeTier: SovereignTier.CITIZEN,
        passkeyCredentials: [],
        securityCircle: { ownerPassportId: "usr_citizen_02", trustedMembers: [], recoveryThreshold: 0 },
        trustScore: 90.0,
        isSuspended: false,
        isPiKYCVerified: true,
        isAcademyGraduate: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = authorizeMeltOrVote(compliantPassport);
      expect(result.authorized).toBe(true);
    });
  });

  /* =========================================================================
   * MODULE 3: 2-Round 80% Consensus Engine (Tiers 1-5 & Tier 0 Exclusions)
   * ========================================================================= */
  describe("??? Module 3: 2-Round 80% Consensus Engine & Weightings", () => {
    test("Round 1 must verify that Guest Observers (Tier 0) cannot establish an internal caucus ballot", () => {
      const observerBallot: TierBallot = {
        tier: SovereignTier.OBSERVER,
        totalVotesCast: 100,
        yesVotes: 95,
        noVotes: 5
      };
      expect(verifyRound1WithinTier(observerBallot)).toBe(false);
    });

    test("Round 1 must pass within-tier ballots reaching strict 80% consensus", () => {
      const citizenBallot: TierBallot = {
        tier: SovereignTier.CITIZEN,
        totalVotesCast: 100,
        yesVotes: 82,
        noVotes: 18
      };
      expect(verifyRound1WithinTier(citizenBallot)).toBe(true);
    });

    test("Round 2 Global Consensus must pass when at least 4 out of 5 tiers internally approve", () => {
      const ballots: TierBallot[] = [
        { tier: SovereignTier.FOUNDER, totalVotesCast: 1, yesVotes: 0, noVotes: 1 },
        { tier: SovereignTier.GUARDIAN, totalVotesCast: 10, yesVotes: 9, noVotes: 1 },
        { tier: SovereignTier.ACADEMY_CORE, totalVotesCast: 100, yesVotes: 85, noVotes: 15 },
        { tier: SovereignTier.MERCHANT, totalVotesCast: 50, yesVotes: 42, noVotes: 8 },
        { tier: SovereignTier.CITIZEN, totalVotesCast: 500, yesVotes: 410, noVotes: 90 },
        { tier: SovereignTier.OBSERVER, totalVotesCast: 100, yesVotes: 100, noVotes: 0 }
      ];

      const globalConsensus = verifyRound2GlobalConsensus(ballots);
      expect(globalConsensus.isPassed).toBe(true);
      expect(globalConsensus.totalGlobalScorePercent).toBe(80);
      expect(globalConsensus.approvedTiers).toContain(SovereignTier.GUARDIAN);
      expect(globalConsensus.approvedTiers).not.toContain(SovereignTier.FOUNDER);
    });

    test("Round 2 Global Consensus must fail if fewer than 4 tiers internally approve", () => {
      const ballots: TierBallot[] = [
        { tier: SovereignTier.FOUNDER, totalVotesCast: 1, yesVotes: 1, noVotes: 0 },
        { tier: SovereignTier.GUARDIAN, totalVotesCast: 10, yesVotes: 10, noVotes: 0 },
        { tier: SovereignTier.ACADEMY_CORE, totalVotesCast: 100, yesVotes: 50, noVotes: 50 },
        { tier: SovereignTier.MERCHANT, totalVotesCast: 50, yesVotes: 25, noVotes: 25 },
        { tier: SovereignTier.CITIZEN, totalVotesCast: 500, yesVotes: 450, noVotes: 50 },
        { tier: SovereignTier.OBSERVER, totalVotesCast: 200, yesVotes: 200, noVotes: 0 }
      ];

      const globalConsensus = verifyRound2GlobalConsensus(ballots);
      expect(globalConsensus.isPassed).toBe(false);
      expect(globalConsensus.totalGlobalScorePercent).toBe(60);
    });
  });

  /* =========================================================================
   * MODULE 4: 100->10->5 Nested VRF Dispute Arbitration & Self-Healing Failovers
   * ========================================================================= */
  describe("?? Module 4: Nested VRF Dispute Panel Selection & Failovers", () => {
    let mockSession: ElderArbitrationSession;

    beforeEach(() => {
      mockSession = {
        caseId: "case_002",
        epochId: "epoch_43",
        disputeState: DisputeState.OPEN,
        seatingElders: ["elder_01", "elder_02", "elder_03", "elder_04", "elder_05", "elder_06", "elder_07", "elder_08", "elder_09", "elder_10"],
        activePanel: ["elder_01", "elder_02", "elder_03", "elder_04", "elder_05"],
        firstBackup: "elder_06",
        secondBackup: "elder_07",
        votes: [],
        nonRespondingElders: [],
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000)
      };
    });

    test("Automated failover must promote 1st backup when an active panelist is unresponsive", () => {
      const { updatedSession, promotedElderId } = triggerElderFailover(mockSession, "elder_03");

      expect(promotedElderId).toBe("elder_06");
      expect(updatedSession.activePanel).toContain("elder_06");
      expect(updatedSession.activePanel).not.toContain("elder_03");
      expect(updatedSession.firstBackup).toBe("elder_07");
      expect(updatedSession.secondBackup).toBe("");
      expect(updatedSession.nonRespondingElders).toContain("elder_03");
      expect(updatedSession.disputeState).toBe(DisputeState.FAILOVER_TRIGGERED);
    });

    test("Two consecutive strikes must strip the Elder status within the qualified Genesis cohort", () => {
      const inactiveArbiter: SovereignPassport = {
        id: "elder_04",
        piUsername: "absentee_guardian_elder",
        kycCountryAnchor: "PH",
        preferredLocalCurrency: "PHP",
        primaryPublicKey: "GDX1...",
        activeTier: SovereignTier.GUARDIAN,
        passkeyCredentials: [],
        securityCircle: { ownerPassportId: "elder_04", trustedMembers: [], recoveryThreshold: 0 },
        trustScore: 85.0,
        isSuspended: false,
        isPiKYCVerified: true,
        isAcademyGraduate: true,
        elderStats: {
          consecutiveMissedVotes: 1,
          totalMissedVotes: 1,
          totalSuccessfulVotes: 10,
          lastActiveEpoch: "epoch_42"
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const penalizedPassport = penalizeNonRespondingElder(inactiveArbiter);
      expect(penalizedPassport.trustScore).toBe(75.0);
      expect(penalizedPassport.elderStats?.consecutiveMissedVotes).toBe(0);
      expect(penalizedPassport.elderStats?.totalMissedVotes).toBe(2);
    });
  });
});
