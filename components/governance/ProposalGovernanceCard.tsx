"use client";

import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Gavel,
  Lock,
  ShieldAlert,
  ThumbsDown,
  ThumbsUp,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  canAccessSubSection,
  canPerformGovernanceAction,
  GOVERNANCE_TIER_META,
  GovernanceTierLevel,
  normalizeTierLevel,
} from "@/app/lib/governance/tierRbac";

export type GovernanceProposalStatus =
  | "DRAFT"
  | "ACTIVE"
  | "ELDER_REVIEW"
  | "HOLD_AND_MODIFY"
  | "PASSED"
  | "REJECTED"
  | "EXECUTED"
  | "VETOED"
  | string;

export interface GovernanceProposalRecord {
  id: string;
  title: string;
  description: string;
  status: GovernanceProposalStatus;
  authorUid?: string | null;
  assignedChamber: string;
  scope: string;
  targetParameter?: string | null;
  proposedValue?: string | null;
  votesFor: number;
  votesAgainst: number;
  adjudicatorSealHash?: string | null;
  elderPanelUids?: string[];
  elderVotesFor?: number;
  elderVotesAgainst?: number;
  elderReviewExpiresAt?: string | null;
  visionAlignmentPct?: number | null;
  executionSealHash?: string | null;
  holdReason?: string | null;
  holdExpiresAt?: string | null;
  executedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
}

export interface ProposalGovernanceCardProps {
  proposal: GovernanceProposalRecord;
  currentUid?: string;
  isFounder?: boolean;
  governanceTier?: GovernanceTierLevel | string;
  hasRole?: boolean;
  hasPassport?: boolean;
  isFrozen?: boolean;
  onRefresh?: () => Promise<void> | void;
}

export default function ProposalGovernanceCard({
  proposal,
  currentUid,
  isFounder: isFounderProp,
  governanceTier,
  hasRole: hasRoleProp,
  hasPassport: hasPassportProp,
  isFrozen: isFrozenProp,
  onRefresh,
}: ProposalGovernanceCardProps) {
  const {
    pioneer,
    hasActiveRole: authHasRole,
    isFounder: authIsFounder,
  } = useAuth();

  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const effectiveTier = normalizeTierLevel(governanceTier ?? pioneer?.tier ?? 1);
  const effectiveHasRole = hasRoleProp ?? authHasRole;
  const effectiveHasPassport =
    hasPassportProp ?? Boolean(pioneer?.isAuthenticated);
  const effectiveFrozen = isFrozenProp ?? pioneer?.status === "FROZEN";
  const effectiveIsFounder = isFounderProp ?? authIsFounder;

  const rbacSubject = useMemo(
    () => ({
      tier: effectiveTier,
      hasRole: effectiveHasRole,
      hasPassport: effectiveHasPassport,
      isFrozen: effectiveFrozen,
      isFounder: effectiveIsFounder,
      role: pioneer?.role,
    }),
    [
      effectiveTier,
      effectiveHasRole,
      effectiveHasPassport,
      effectiveFrozen,
      effectiveIsFounder,
      pioneer?.role,
    ]
  );

  const votePerm = useMemo(
    () =>
      canPerformGovernanceAction(effectiveTier, "VOTE_PROPOSAL", {
        hasPassport: effectiveHasPassport,
        isFrozen: effectiveFrozen,
        hasRole: effectiveHasRole,
      }),
    [effectiveTier, effectiveHasPassport, effectiveFrozen, effectiveHasRole]
  );

  const elderAccess = useMemo(
    () => canAccessSubSection("GOVERNANCE_ELDER_ACTIONS", rbacSubject),
    [rbacSubject]
  );

  const handleCastVote = async (choice: "FOR" | "AGAINST") => {
    if (!votePerm.allowed) {
      setFeedback({
        type: "err",
        text: votePerm.reason ?? "Voting is currently locked.",
      });
      return;
    }

    setBusyAction(`VOTE_${choice}`);
    setFeedback(null);
    try {
      const res = await fetch(
        `/api/governance/proposals/${encodeURIComponent(proposal.id)}/vote`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            choice,
            voterUid: currentUid || pioneer?.uid || "anonymous_pioneer",
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        throw new Error(data?.error || "Failed to record vote.");
      }
      setFeedback({
        type: "ok",
        text: `Recorded ${choice} vote on ${proposal.id}.`,
      });
      await onRefresh?.();
    } catch (err: unknown) {
      setFeedback({
        type: "err",
        text: err instanceof Error ? err.message : "Vote request failed.",
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleElderRuling = async (
    ruling: "CONSTITUTIONAL_CLEAR" | "CONSTITUTIONAL_VIOLATION"
  ) => {
    if (!elderAccess.allowed) {
      setFeedback({
        type: "err",
        text:
          elderAccess.reason ??
          `Elder adjudication requires ${elderAccess.requiredTierLabel}.`,
      });
      return;
    }

    setBusyAction(ruling);
    setFeedback(null);
    try {
      const res = await fetch(
        `/api/governance/proposals/${encodeURIComponent(proposal.id)}/elder-review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ruling,
            rationale:
              ruling === "CONSTITUTIONAL_CLEAR"
                ? "Verified constitutional alignment and quorum."
                : "Flagged constitutional or charter boundary violation.",
            elderUid: currentUid || pioneer?.uid || "elder_panel_member",
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        throw new Error(data?.error || "Elder review ruling failed.");
      }
      setFeedback({
        type: "ok",
        text: `Elder ruling (${ruling}) recorded for ${proposal.id}.`,
      });
      await onRefresh?.();
    } catch (err: unknown) {
      setFeedback({
        type: "err",
        text:
          err instanceof Error ? err.message : "Elder review request failed.",
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleFounderHoldAction = async (
    decision: "APPROVE_OVERRIDE" | "MODIFY_AND_RESUBMIT" | "SOFT_VETO"
  ) => {
    if (!effectiveIsFounder) return;
    setBusyAction(decision);
    setFeedback(null);
    try {
      const res = await fetch(
        `/api/governance/proposals/${encodeURIComponent(proposal.id)}/founder-hold`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            decision,
            founderUid: currentUid || pioneer?.uid || "founder",
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        throw new Error(data?.error || "Founder hold action failed.");
      }
      setFeedback({
        type: "ok",
        text: `Founder decision (${decision}) applied to ${proposal.id}.`,
      });
      await onRefresh?.();
    } catch (err: unknown) {
      setFeedback({
        type: "err",
        text:
          err instanceof Error ? err.message : "Founder hold request failed.",
      });
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5 space-y-2.5 text-xs font-mono text-slate-100">
      {/* Header & Status Badge */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold text-cyan-400 truncate">
          {proposal.assignedChamber} • {proposal.scope}
        </span>
        <span
          className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase ${
            proposal.status === "ELDER_REVIEW"
              ? "border-amber-700/80 bg-amber-950/70 text-amber-300"
              : proposal.status === "HOLD_AND_MODIFY"
                ? "border-purple-700/80 bg-purple-950/70 text-purple-300"
                : proposal.status === "EXECUTED"
                  ? "border-emerald-700/80 bg-emerald-950/70 text-emerald-300"
                  : "border-slate-700 bg-slate-950 text-slate-300"
          }`}
        >
          {proposal.status}
        </span>
      </div>

      {/* Title & Summary */}
      <div>
        <h3 className="text-xs font-bold text-white leading-snug">
          {proposal.title}
        </h3>
        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
          {proposal.description}
        </p>
      </div>

      {/* Parameter Target */}
      {proposal.targetParameter && (
        <div className="rounded-lg border border-slate-800/90 bg-slate-950/80 px-2.5 py-1.5 text-[10px] text-slate-300 flex items-center justify-between gap-2">
          <span className="text-slate-500 truncate">{proposal.targetParameter}</span>
          {proposal.proposedValue && (
            <span className="text-cyan-300 font-bold shrink-0">
              {proposal.proposedValue}
            </span>
          )}
        </div>
      )}

      {/* Vote Tallies */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
        <span>
          For: <strong className="text-emerald-400">{proposal.votesFor}</strong> • Against:{" "}
          <strong className="text-rose-400">{proposal.votesAgainst}</strong>
        </span>
        <span className="text-[9px] text-slate-500">{proposal.id}</span>
      </div>

      {/* ACTIVE PROPOSAL VOTING CONTROLS (Gated by VOTE_PROPOSAL) */}
      {proposal.status === "ACTIVE" && (
        <div className="space-y-1.5 pt-1">
          {!votePerm.allowed ? (
            <div className="rounded-lg border border-amber-900/60 bg-amber-950/25 px-2.5 py-1.5 text-[10px] text-amber-300 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <Lock className="h-3 w-3 shrink-0 text-amber-400" />
                <span>{votePerm.reason ?? "Voting locked"}</span>
              </span>
              <span className="rounded border border-amber-800/70 bg-amber-950/70 px-1.5 py-0.5 text-[9px] font-bold">
                {GOVERNANCE_TIER_META[votePerm.requiredTier].shortLabel}
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                disabled={busyAction !== null}
                onClick={() => handleCastVote("FOR")}
                className="rounded-lg border border-emerald-700/80 bg-emerald-950/50 py-1.5 text-[10px] font-bold text-emerald-300 hover:bg-emerald-900/60 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1"
              >
                <ThumbsUp className="h-3 w-3" />
                {busyAction === "VOTE_FOR" ? "Voting..." : "Vote For"}
              </button>
              <button
                type="button"
                disabled={busyAction !== null}
                onClick={() => handleCastVote("AGAINST")}
                className="rounded-lg border border-rose-800/80 bg-rose-950/40 py-1.5 text-[10px] font-bold text-rose-300 hover:bg-rose-900/50 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1"
              >
                <ThumbsDown className="h-3 w-3" />
                {busyAction === "VOTE_AGAINST" ? "Voting..." : "Vote Against"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ELDER_REVIEW ADJUDICATION PANEL (Gated by GOVERNANCE_ELDER_ACTIONS) */}
      {proposal.status === "ELDER_REVIEW" && (
        <div className="rounded-lg border border-amber-800/70 bg-amber-950/20 p-2.5 space-y-2 text-[10px]">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <Gavel className="h-3.5 w-3.5 text-amber-400" />
              5-Elder Clarification Window
            </span>
            <span className="text-slate-400">
              {proposal.elderVotesFor ?? 0} Clear / {proposal.elderVotesAgainst ?? 0} Viol.
            </span>
          </div>

          {proposal.elderReviewExpiresAt && (
            <div className="text-[9px] text-slate-400 flex items-center gap-1">
              <Clock className="h-3 w-3 text-amber-400" />
              <span>Review deadline: {proposal.elderReviewExpiresAt}</span>
            </div>
          )}

          {!elderAccess.allowed ? (
            <div className="rounded border border-amber-900/70 bg-slate-950/80 px-2 py-1.5 flex items-center justify-between gap-2 text-amber-300">
              <span className="flex items-center gap-1.5">
                <Lock className="h-3 w-3 shrink-0 text-amber-400" />
                <span>
                  {elderAccess.reason ??
                    `Elder adjudication requires ${elderAccess.requiredTierLabel}`}
                </span>
              </span>
              <span className="rounded border border-amber-800/70 bg-amber-950/80 px-1.5 py-0.5 text-[9px] font-bold shrink-0">
                {elderAccess.requiredTierLabel}
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              <button
                type="button"
                disabled={busyAction !== null}
                onClick={() => handleElderRuling("CONSTITUTIONAL_CLEAR")}
                className="rounded border border-emerald-700 bg-emerald-950/60 py-1.5 px-2 font-bold text-emerald-300 hover:bg-emerald-900/60 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1"
              >
                <CheckCircle2 className="h-3 w-3" />
                {busyAction === "CONSTITUTIONAL_CLEAR" ? "Sealing..." : "Clear"}
              </button>
              <button
                type="button"
                disabled={busyAction !== null}
                onClick={() => handleElderRuling("CONSTITUTIONAL_VIOLATION")}
                className="rounded border border-rose-800 bg-rose-950/50 py-1.5 px-2 font-bold text-rose-300 hover:bg-rose-900/60 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1"
              >
                <XCircle className="h-3 w-3" />
                {busyAction === "CONSTITUTIONAL_VIOLATION"
                  ? "Flagging..."
                  : "Violation"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* HOLD_AND_MODIFY (72h Founder Hold) */}
      {proposal.status === "HOLD_AND_MODIFY" && (
        <div className="rounded-lg border border-purple-800/70 bg-purple-950/20 p-2.5 space-y-2 text-[10px]">
          <div className="flex items-center justify-between text-purple-300 font-bold">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-purple-400" />
              72h Founder Hold & Modify
            </span>
            {proposal.holdExpiresAt && (
              <span className="text-[9px] text-purple-200">
                {proposal.holdExpiresAt.slice(0, 10)}
              </span>
            )}
          </div>
          {proposal.holdReason && (
            <p className="text-slate-300 leading-relaxed">{proposal.holdReason}</p>
          )}
          {effectiveIsFounder && (
            <div className="grid grid-cols-3 gap-1 pt-0.5">
              <button
                type="button"
                disabled={busyAction !== null}
                onClick={() => handleFounderHoldAction("APPROVE_OVERRIDE")}
                className="rounded border border-emerald-700 bg-emerald-950/60 py-1 font-bold text-emerald-300 cursor-pointer"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={busyAction !== null}
                onClick={() => handleFounderHoldAction("MODIFY_AND_RESUBMIT")}
                className="rounded border border-cyan-700 bg-cyan-950/60 py-1 font-bold text-cyan-300 cursor-pointer"
              >
                Modify
              </button>
              <button
                type="button"
                disabled={busyAction !== null}
                onClick={() => handleFounderHoldAction("SOFT_VETO")}
                className="rounded border border-rose-800 bg-rose-950/60 py-1 font-bold text-rose-300 cursor-pointer"
              >
                Soft Veto
              </button>
            </div>
          )}
        </div>
      )}

      {feedback && (
        <div
          className={`rounded-lg border px-2.5 py-1.5 text-[10px] ${
            feedback.type === "ok"
              ? "border-emerald-800/80 bg-emerald-950/40 text-emerald-300"
              : "border-rose-800/80 bg-rose-950/40 text-rose-300"
          }`}
        >
          {feedback.text}
        </div>
      )}
    </article>
  );
}