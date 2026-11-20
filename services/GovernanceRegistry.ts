// TARGET: [project-root]/services/GovernanceRegistry.ts

export type PioneerRole =
  | 'FOUNDER'
  | 'GENESIS'
  | 'MERCHANT'
  | 'SERVICE_PROVIDER'
  | 'CITIZEN';

export type PioneerInfluence = {
  uid: string;
  role: PioneerRole;
  username: string;
  ageInMonths: number;
  mBZRStake: number;
  nodeUptimeScore: number;
  trustScore: number; // Strictly 0 - 100
  canVote?: boolean;
  influenceScore: number;
};

export type PioneerInfluenceInput = Omit<PioneerInfluence, 'influenceScore'> & {
  influenceScore?: number;
};

function clampTrustScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.min(100, Math.max(0, score));
}

function nonNegative(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export class GovernanceRegistry {
  private static registry: Map<string, PioneerInfluence> = new Map();

  public static calculateInfluence(
    pioneer: Pick<PioneerInfluence, 'mBZRStake' | 'nodeUptimeScore' | 'ageInMonths'>
  ): number {
    const stakeWeight = 0.5;
    const uptimeWeight = 0.3;
    const tenureWeight = 0.2;

    const stake = nonNegative(pioneer.mBZRStake);
    const uptime = nonNegative(pioneer.nodeUptimeScore);
    const tenure = nonNegative(pioneer.ageInMonths);

    return stake * stakeWeight + uptime * uptimeWeight + tenure * tenureWeight;
  }

  public static registerPioneer(pioneer: PioneerInfluenceInput): PioneerInfluence {
    const normalized: PioneerInfluence = {
      ...pioneer,
      ageInMonths: nonNegative(pioneer.ageInMonths),
      mBZRStake: nonNegative(pioneer.mBZRStake),
      nodeUptimeScore: nonNegative(pioneer.nodeUptimeScore),
      trustScore: clampTrustScore(pioneer.trustScore),
      influenceScore:
        pioneer.influenceScore !== undefined && Number.isFinite(pioneer.influenceScore)
          ? pioneer.influenceScore
          : this.calculateInfluence(pioneer),
    };

    console.log(`[MESH-SYNC] Institutionalizing Node: ${normalized.uid}`);
    this.registry.set(normalized.uid, normalized);
    return { ...normalized };
  }

  public static getPioneer(uid: string): PioneerInfluence | undefined {
    const record = this.registry.get(uid);
    return record ? { ...record } : undefined;
  }

  public static updateStatus(
    uid: string,
    status: { canVote?: boolean; trustScore?: number; role?: PioneerRole }
  ): PioneerInfluence | undefined {
    const pioneer = this.registry.get(uid);
    if (!pioneer) return undefined;

    const updated: PioneerInfluence = {
      ...pioneer,
      ...status,
      trustScore:
        status.trustScore !== undefined
          ? clampTrustScore(status.trustScore)
          : pioneer.trustScore,
    };
    updated.influenceScore = this.calculateInfluence(updated);

    this.registry.set(uid, updated);
    return { ...updated };
  }

  public static getInfluence(uid: string): number | null {
    const pioneer = this.registry.get(uid);
    return pioneer ? this.calculateInfluence(pioneer) : null;
  }
}