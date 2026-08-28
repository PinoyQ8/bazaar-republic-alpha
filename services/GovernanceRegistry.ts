// TARGET: [project-root]/services/GovernanceRegistry.ts

export type PioneerInfluence = {
  uid: string;
  role: 'FOUNDER' | 'GENESIS' | 'MERCHANT' | 'SERVICE_PROVIDER' | 'CITIZEN';
  username: string;
  ageInMonths: number;
  mBZRStake: number;
  nodeUptimeScore: number;
  trustScore: number;
  canVote?: boolean;
  influenceScore: number;
};

export class GovernanceRegistry {
  private static registry: Map<string, PioneerInfluence> = new Map();

  public static registerPioneer(pioneer: PioneerInfluence): void {
    console.log(`[MESH-SYNC] Institutionalizing Node: ${pioneer.uid}`);
    this.registry.set(pioneer.uid, pioneer);
  }

  public static getPioneer(uid: string): PioneerInfluence | undefined {
    return this.registry.get(uid);
  }

  public static updateStatus(uid: string, status: { canVote: boolean }): void {
    const pioneer = this.registry.get(uid);
    if (pioneer) {
      this.registry.set(uid, { ...pioneer, ...status });
    }
  }

  public static calculateInfluence(pioneer: PioneerInfluence): number {
    const stakeWeight = 0.5;
    const uptimeWeight = 0.3;
    const tenureWeight = 0.2;
    return (
      pioneer.mBZRStake * stakeWeight +
      pioneer.nodeUptimeScore * uptimeWeight +
      pioneer.ageInMonths * tenureWeight
    );
  }

  public static getInfluence(uid: string): number | null {
    const pioneer = this.registry.get(uid);
    return pioneer ? this.calculateInfluence(pioneer) : null;
  }
} // 🛡️ CLASS CLOSED HERE