import { GovernanceRegistry } from './GovernanceRegistry';

export class PenaltyProtocol {
  
  public static processUptime(uid: string, currentUptime: number): void {
    if (currentUptime < 0.90) {
      const reduction = (0.90 - currentUptime) * 100;
      this.applyTSReduction(uid, reduction);
    }

    if (currentUptime < 0.85) {
      this.suspendVotingRights(uid);
    }
  }

  private static applyTSReduction(uid: string, reduction: number): void {
    // Note: Ensure GovernanceRegistry has a 'getPioneer' method
    const pioneer = GovernanceRegistry.getPioneer(uid);
    if (pioneer) {
      pioneer.trustScore -= reduction;
      GovernanceRegistry.registerPioneer(pioneer);
    }
  }

  private static suspendVotingRights(uid: string): void {
    GovernanceRegistry.updateStatus(uid, { canVote: false });
  }
}