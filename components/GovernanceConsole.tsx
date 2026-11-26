// Location: components/GovernanceConsole.tsx
"use client";

import React, { useMemo, useState } from "react";
import { Gavel, Landmark, Lock, ThumbsDown, ThumbsUp } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  canAccessSubSection,
  canPerformGovernanceAction,
  GOVERNANCE_TIER_META,
  GovernanceTierLevel,
  normalizeTierLevel,
} from "@/app/lib/governance/tierRbac";

export interface GovernanceConsoleProps {
  governanceTier?: GovernanceTierLevel | string;
  hasRole?: boolean;
  hasPassport?: boolean;
  isFrozen?: boolean;
}

interface ProposalItem {
  id: string;
  title: string;
  chamber: string;
  summary: string;
  forVotes: number;
  againstVotes: number;
  requiresElderPanel?: boolean;
}

const SAMPLE_PROPOSALS: ProposalItem[] = [
  {
    id: "PROP-018",
    title: "Epoch #3 Fee Split & Genesis LP Cap Calibration",
    chamber: "CHAMBER_3_LIQUIDITY",
    summary: "Maintains 70% staker / 30% DAO POL fee routing and 1,000 Pi vault cap.",
    forVotes: 142,
    againstVotes: 11,
  },
  {
    id: "PROP-019-DISP",
    title: "Elder Panel Ruling: Disputed SLA Escrow Bond Split",
    chamber: "CHAMBER_4_GENESIS_100",
    summary: "5-Elder VRF review on contested node SLA & 75% / 25% non-biased bond settlement.",
    forVotes: 3,
    againstVotes: 1,
    requiresElderPanel: true,
  },
];

export default function GovernanceConsole({
  governanceTier,
  hasRole,
  hasPassport = true,
  isFrozen = false,
}: GovernanceConsoleProps) {
  const { pioneer, hasActiveRole: authHasRole, isFounder } = useAuth();
  const [feedback, setFeedback] = useState<string | null>(null);

  const effectiveTier = normalizeTierLevel(governanceTier ?? pioneer?.tier ?? 1);
  const effectiveHasRole = hasRole ?? authHasRole;
  const effectiveFrozen = isFrozen || pioneer?.status === "FROZEN";

  const subject = useMemo(
    () => ({
      tier: effectiveTier,
      hasRole: effectiveHasRole,
      hasPassport,
      isFrozen: effectiveFrozen,
      isFounder,
      role: pioneer?.role,
    }),
    [effectiveTier, effectiveHasRole, hasPassport, effectiveFrozen, isFounder, pioneer?.role]
  );

  const viewAccess = useMemo(
    () => canAccessSubSection("GOVERNANCE_VIEW", subject),
    [subject]
  );

  const elderAccess = useMemo(
    () => canAccessSubSection("GOVERNANCE_ELDER_ACTIONS", subject),
    [subject]
  );

  const votePerm = useMemo(
    () =>
      canPerformGovernanceAction(effectiveTier, "VOTE_PROPOSAL", {
        hasPassport,
        isFrozen: effectiveFrozen,
        hasRole: effectiveHasRole,
      }),
    [effectiveTier, hasPassport, effectiveFrozen, effectiveHasRole]
  );

  const handleVote = (proposalId: string, choice: "FOR" | "AGAINST") => {
    if (!votePerm.allowed) return;
    setFeedback(`Recorded ${choice} vote on ${proposalId} (${GOVERNANCE_TIER_META[effectiveTier].shortLabel}).`);
  };

  const handleElderRuling = (proposalId: string) => {
    if (!elderAccess.allowed) return;
    setFeedback(`Elder panel adjudication logged for ${proposalId}.`);
  };

  return (
    <section className="space-y-3 font-mono text-slate-100">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Landmark className="h-4 w-4 text-indigo-400" />
          <div>
            <h1 className="text-xs font-bold uppercase tracking-wider text-zinc-100">
              Genesis & DAO Governance
            </h1>
            <p className="text-[10px] text-zinc-500">
              {GOVERNANCE_TIER_META[effectiveTier].shortLabel} • View:{" "}
              {viewAccess.allowed ? "OPEN" : "LOCKED"}
            </p>
          </div>
        </div>
        <span
          className={`rounded border px-2 py-0.5 text-[9px] font-bold ${
            GOVERNANCE_TIER_META[effectiveTier].badgeClass
          }`}
        >
          {GOVERNANCE_TIER_META[effectiveTier].shortLabel}
        </span>
      </div>

      {!votePerm.allowed && (
        <div className="rounded-xl border border-amber-800/70 bg-amber-950/30 p-3 text-[10px] text-amber-200 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 shrink-0 text-amber-400" />
            <span>{votePerm.reason ?? "Voting requires an active non-frozen passport."}</span>
          </span>
          <span className="rounded border border-amber-700/70 bg-amber-950/80 px-1.5 py-0.5 text-[9px] font-bold shrink-0">
            Read-Only
          </span>
        </div>
      )}

      {feedback && (
        <div className="rounded-lg border border-emerald-800/70 bg-emerald-950/40 px-2.5 py-1.5 text-[11px] text-emerald-300">
          {feedback}
        </div>
      )}

      <div className="space-y-2.5">
        {SAMPLE_PROPOSALS.map((prop) => {
          const isElderProposal = Boolean(prop.requiresElderPanel);
          const canExecuteAction = isElderProposal ? elderAccess.allowed : votePerm.allowed;
          const lockReason = isElderProposal ? elderAccess.reason : votePerm.reason;
          const requiredBadge = isElderProposal
            ? elderAccess.requiredTierLabel
            : GOVERNANCE_TIER_META[votePerm.requiredTier].shortLabel;

          return (
            <div
              key={prop.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-indigo-300">{prop.chamber}</span>
                <span className="text-[9px] text-zinc-500">{prop.id}</span>
              </div>

              <h2 className="text-xs font-bold text-white leading-snug">{prop.title}</h2>
              <p className="text-[10px] text-zinc-400 leading-relaxed">{prop.summary}</p>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-[10px]">
                <span className="text-zinc-400">
                  For: <strong className="text-emerald-400">{prop.forVotes}</strong> • Against:{" "}
                  <strong className="text-rose-400">{prop.againstVotes}</strong>
                </span>

                {isElderProposal ? (
                  <button
                    type="button"
                    disabled={!canExecuteAction}
                    onClick={() => handleElderRuling(prop.id)}
                    title={canExecuteAction ? "Adjudicate Elder dispute" : lockReason}
                    className="rounded border border-amber-700/80 bg-amber-950/60 px-2 py-0.5 font-bold text-amber-300 hover:bg-amber-900/60 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                  >
                    {canExecuteAction ? (
                      <Gavel className="h-3 w-3" />
                    ) : (
                      <Lock className="h-3 w-3 text-amber-400" />
                    )}
                    {canExecuteAction ? "Adjudicate" : requiredBadge}
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={!canExecuteAction}
                      onClick={() => handleVote(prop.id, "FOR")}
                      title={canExecuteAction ? "Vote For" : lockReason}
                      className="rounded border border-emerald-700 bg-emerald-950/60 px-2 py-0.5 font-bold text-emerald-300 hover:bg-emerald-900/60 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                    >
                      <ThumbsUp className="h-3 w-3" />
                      For
                    </button>
                    <button
                      type="button"
                      disabled={!canExecuteAction}
                      onClick={() => handleVote(prop.id, "AGAINST")}
                      title={canExecuteAction ? "Vote Against" : lockReason}
                      className="rounded border border-rose-800 bg-rose-950/50 px-2 py-0.5 font-bold text-rose-300 hover:bg-rose-900/60 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                    >
                      <ThumbsDown className="h-3 w-3" />
                      Against
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}