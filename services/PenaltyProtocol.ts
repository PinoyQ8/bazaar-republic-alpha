import { GovernanceRegistry } from './GovernanceRegistry';

export class PenaltyProtocol {
  private static readonly SLA_FLOOR = 0.9;
  private static readonly VOTE_SUSPENSION_THRESHOLD = 0.85;

  public static processUptime(uid: string, currentUptime: number): void {
    if (!uid || !Number.isFinite(currentUptime)) return;

    const clampedUptime = Math.min(1, Math.max(0, currentUptime));

    if (clampedUptime < this.SLA_FLOOR) {
      const reduction = (this.SLA_FLOOR - clampedUptime) * 100;
      this.applyTSReduction(uid, reduction);
    }

    if (clampedUptime < this.VOTE_SUSPENSION_THRESHOLD) {
      this.suspendVotingRights(uid);
    }
  }

  private static applyTSReduction(uid: string, reduction: number): void {
    const pioneer = GovernanceRegistry.getPioneer(uid);
    if (!pioneer) return;

    const nextTrustScore = Math.max(0, pioneer.trustScore - reduction);
    GovernanceRegistry.registerPioneer({
      ...pioneer,
      trustScore: nextTrustScore,
    });
  }

  private static suspendVotingRights(uid: string): void {
    GovernanceRegistry.updateStatus(uid, { canVote: false });
  }
}