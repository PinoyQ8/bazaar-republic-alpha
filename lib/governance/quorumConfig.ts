export type GovernanceChamberKey =
  | "CITIZEN"
  | "MERCHANT"
  | "SERVICE_PROVIDER"
  | "GENESIS"
  | "FOUNDER";

export interface QuorumEvaluationInput {
  chamber: string;
  votesCast: number;
  votesFor: number;
  activePoolCount: number;
  minQuorumCount?: number;
  approvalThresholdPct?: number;
}

export interface QuorumEvaluationResult {
  chamber: GovernanceChamberKey;
  quorumPctRequired: number;
  minQuorumCountRequired: number;
  requiredBallots: number;
  activePoolCount: number;
  votesCast: number;
  participationPct: number;
  approvalPct: number;
  quorumMet: boolean;
  approvalMet: boolean;
  passed: boolean;
}

export const CHAMBER_QUORUM_PCT: Record<GovernanceChamberKey, number> = {
  CITIZEN: 0.25,          // < 50% citizen caucus quorum
  MERCHANT: 0.60,         // 60% merchant/academy caucus quorum
  SERVICE_PROVIDER: 0.65, // 65% service provider/guardian caucus quorum
  GENESIS: 0.70,          // 70% genesis cohort caucus quorum
  FOUNDER: 1.00,          // 100% active founder (80% handled separately for descendants)
};

export const DEFAULT_MIN_QUORUM_COUNT =
  Number(process.env.GOVERNANCE_MIN_QUORUM_COUNT) > 0
    ? Number(process.env.GOVERNANCE_MIN_QUORUM_COUNT)
    : 2;

export const DEFAULT_APPROVAL_THRESHOLD_PCT = 80;

export function normalizeGovernanceChamber(
  rawChamber?: string | null
): GovernanceChamberKey {
  const normalized = (rawChamber || "CITIZEN").toUpperCase().trim();
  if (normalized === "GENESIS_100" || normalized === "GENESIS_ELDER") return "GENESIS";
  if (normalized === "BAZAAR_FOUNDER" || normalized === "FOUNDER_DESCENDANT") return "FOUNDER";
  if (normalized in CHAMBER_QUORUM_PCT) {
    return normalized as GovernanceChamberKey;
  }
  return "CITIZEN";
}

export function evaluateChamberQuorumAndApproval(
  input: QuorumEvaluationInput
): QuorumEvaluationResult {
  const chamber = normalizeGovernanceChamber(input.chamber);
  const quorumPctRequired = CHAMBER_QUORUM_PCT[chamber];
  const minQuorumCountRequired = Math.max(
    1,
    input.minQuorumCount ?? DEFAULT_MIN_QUORUM_COUNT
  );
  const approvalThresholdPct =
    input.approvalThresholdPct ?? DEFAULT_APPROVAL_THRESHOLD_PCT;

  const activePoolCount = Math.max(0, input.activePoolCount);
  const votesCast = Math.max(0, input.votesCast);
  const votesFor = Math.max(0, input.votesFor);

  const percentageBallots = Math.ceil(activePoolCount * quorumPctRequired);
  const requiredBallots = Math.max(minQuorumCountRequired, percentageBallots);

  const participationPct =
    activePoolCount > 0
      ? Number(((votesCast / activePoolCount) * 100).toFixed(2))
      : 0;
  const approvalPct =
    votesCast > 0 ? Number(((votesFor / votesCast) * 100).toFixed(2)) : 0;

  const quorumMet = votesCast >= requiredBallots && activePoolCount > 0;
  const approvalMet = quorumMet && approvalPct >= approvalThresholdPct;

  return {
    chamber,
    quorumPctRequired,
    minQuorumCountRequired,
    requiredBallots,
    activePoolCount,
    votesCast,
    participationPct,
    approvalPct,
    quorumMet,
    approvalMet,
    passed: quorumMet && approvalMet,
  };
}
