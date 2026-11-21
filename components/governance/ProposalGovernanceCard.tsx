// Location: components/governance/ProposalGovernanceCard.tsx
"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Clock,
  Gavel,
  PauseCircle,
  Play,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

export type GovernanceProposalStatus =
  | "PENDING"
  | "ELDER_REVIEW"
  | "ACTIVE"
  | "PASSED"
  | "HOLD_AND_MODIFY"
  | "EXECUTED"
  | "REJECTED"
  | "EXPIRED";

export interface GovernanceProposalRecord {
  id: string;
  title: string;
  description: string;
  status: GovernanceProposalStatus;
  authorUid: string | null;
  assignedChamber: string;
  scope: string;
  targetParameter: string | null;
  proposedValue: number | null;
  votesFor: number;
  votesAgainst: number;
  adjudicatorSealHash: string | null;
  elderPanelUids: string[];
  elderVotesFor: number;
  elderVotesAgainst: number;
  elderReviewExpiresAt: string | null;
  visionAlignmentPct: number | null;
  executionSealHash: string | null;
  holdReason: string | null;
  holdExpiresAt: string | null;
  executedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface ProposalGovernanceCardProps {
  proposal: GovernanceProposalRecord;
  currentUid?: string;
  isFounder?: boolean;
  onRefresh: () => Promise<void> | void;
}

export function ProposalStatusBadge({ status }: { status: GovernanceProposalStatus }) {
  const styles: Record<GovernanceProposalStatus, string> = {
    PENDING: "bg-slate-800 text-slate-300 border-slate-700",
    ELDER_REVIEW: "bg-amber-950/80 text-amber-300 border-amber-700/70",
    ACTIVE: "bg-cyan-950/80 text-cyan-300 border-cyan-700/70",
    PASSED: "bg-indigo-950/80 text-indigo-300 border-indigo-700/70",
    HOLD_AND_MODIFY: "bg-orange-950/80 text-orange-300 border-orange-700/70 animate-pulse",
    EXECUTED: "bg-emerald-950/80 text-emerald-300 border-emerald-700/70",
    REJECTED: "bg-rose-950/80 text-rose-300 border-rose-700/70",
    EXPIRED: "bg-zinc-900 text-zinc-400 border-zinc-700",
  };

  return (
    <span
      className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
        styles[status] || styles.PENDING
      }`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

export default function ProposalGovernanceCard({
  proposal,
  currentUid = "",
  isFounder = false,
  onRefresh,
}: ProposalGovernanceCardProps) {
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [rationale, setRationale] = useState("");
  const [modifiedValue, setModifiedValue] = useState<string>(
    proposal.proposedValue !== null ? String(proposal.proposedValue) : ""
  );
  const [feedback, setFeedback] = useState<{
    type: "ok" | "err";
    message: string;
  } | null>(null);

  const canElderVote =
    proposal.status === "ELDER_REVIEW" &&
    currentUid.length > 0 &&
    proposal.elderPanelUids.includes(currentUid);

  const runAction = async (
    actionKey: string,
    url: string,
    payload: Record<string, unknown>
  ) => {
    setBusyAction(actionKey);
    setFeedback(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      setRationale("");
      setFeedback({
        type: "ok",
        message: data.status || data.finalStatus || "Action sealed on ledger.",
      });
      await onRefresh();
    } catch (err: any) {
      setFeedback({
        type: "err",
        message: err?.message || "Governance action failed.",
      });
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <article className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2.5 font-mono text-xs overflow-hidden">
      {/* Header Row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] text-slate-400">
            {proposal.assignedChamber} • {proposal.scope === "CHAMBER_LOCAL" ? "Local" : "4/5 Global"}
          </div>
          <h3 className="text-sm font-sans font-bold text-slate-100 truncate">
            {proposal.title}
          </h3>
        </div>
        <ProposalStatusBadge status={proposal.status} />
      </div>

      {/* Description */}
      <p className="text-[11px] text-slate-300 leading-relaxed wrap-break-word">
        {proposal.description}
      </p>

      {/* Parameter & Vision Telemetry */}
      {(proposal.targetParameter || proposal.visionAlignmentPct !== null) && (
        <div className="grid grid-cols-2 gap-2 p-2 bg-slate-950/90 rounded-lg border border-slate-800/80 text-[10px]">
          <div>
            <span className="text-slate-500 block uppercase">Target</span>
            <span className="text-cyan-300 font-bold break-all">
              {proposal.targetParameter
                ? `${proposal.targetParameter}${
                    proposal.proposedValue !== null ? ` (${proposal.proposedValue})` : ""
                  }`
                : "POLICY_TEXT"}
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 block uppercase">Vision Align</span>
            <span className="text-emerald-400 font-bold">
              {proposal.visionAlignmentPct !== null
                ? `${proposal.visionAlignmentPct}%`
                : "Pending"}
            </span>
          </div>
        </div>
      )}

      {/* Diagnostic / Hold / Seal Notes */}
      {proposal.holdReason && (
        <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-800/50 text-[10px] text-amber-200 wrap-break-word">
          <span className="font-bold uppercase mb-0.5 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0" />
            Adjudicator / Hold Note
          </span>
          {proposal.holdReason}
        </div>
      )}

      {proposal.executionSealHash && proposal.status === "EXECUTED" && (
        <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-800/50 text-[10px] text-emerald-300 break-all flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Executed Seal: {proposal.executionSealHash.slice(0, 18)}…</span>
        </div>
      )}

      {/* ELDER_REVIEW Panel (24h 5-Elder VRF Clarification) */}
      {proposal.status === "ELDER_REVIEW" && (
        <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-700/40 space-y-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-amber-300 font-bold flex items-center gap-1">
              <Gavel className="w-3 h-3" /> 5-Elder VRF Clarification
            </span>
            <span className="text-slate-300">
              Clear: <strong className="text-emerald-400">{proposal.elderVotesFor}</strong> / Reject:{" "}
              <strong className="text-rose-400">{proposal.elderVotesAgainst}</strong>
            </span>
          </div>

          {proposal.elderReviewExpiresAt && (
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              Window closes: {new Date(proposal.elderReviewExpiresAt).toLocaleString()}
            </div>
          )}

          {canElderVote ? (
            <div className="space-y-1.5 pt-1">
              <input
                type="text"
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                placeholder="Clarification rationale..."
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[10px] text-slate-100"
              />
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  disabled={busyAction !== null}
                  onClick={() =>
                    runAction(
                      "elder-clear",
                      `/api/governance/proposals/${proposal.id}/elder-review`,
                      {
                        elderUid: currentUid,
                        ruling: "CONSTITUTIONAL_CLEAR",
                        rationale,
                      }
                    )
                  }
                  className="py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded text-[10px] uppercase disabled:opacity-50"
                >
                  {busyAction === "elder-clear" ? "Sealing..." : "Clear Ballot"}
                </button>
                <button
                  disabled={busyAction !== null}
                  onClick={() =>
                    runAction(
                      "elder-reject",
                      `/api/governance/proposals/${proposal.id}/elder-review`,
                      {
                        elderUid: currentUid,
                        ruling: "CONSTITUTIONAL_VIOLATION",
                        rationale,
                      }
                    )
                  }
                  className="py-1.5 bg-rose-900 hover:bg-rose-800 text-rose-100 border border-rose-700 font-bold rounded text-[10px] uppercase disabled:opacity-50"
                >
                  {busyAction === "elder-reject" ? "Sealing..." : "Rule Violation"}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-[10px] text-slate-400">
              Panel ({proposal.elderPanelUids.length || 0} seated):{" "}
              {proposal.elderPanelUids.join(", ") || "Awaiting VRF draw"}
            </div>
          )}
        </div>
      )}

      {/* HOLD_AND_MODIFY Panel (72h Founder / Descendant Soft Veto SLA) */}
      {proposal.status === "HOLD_AND_MODIFY" && (
        <div className="p-2.5 rounded-lg bg-orange-950/25 border border-orange-700/50 space-y-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-orange-300 font-bold flex items-center gap-1">
              <PauseCircle className="w-3 h-3" /> Hold & Modify (72h SLA)
            </span>
            <span className="text-orange-200">
              {proposal.holdExpiresAt
                ? `Due ${new Date(proposal.holdExpiresAt).toLocaleDateString()}`
                : "72h Window"}
            </span>
          </div>

          {isFounder && currentUid ? (
            <div className="space-y-1.5 pt-1">
              <input
                type="text"
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                placeholder="Public rationale (min 15 chars)..."
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[10px] text-slate-100"
              />
              {proposal.proposedValue !== null && (
                <input
                  type="number"
                  value={modifiedValue}
                  onChange={(e) => setModifiedValue(e.target.value)}
                  placeholder="Adjusted value for 48h re-ballot"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[10px] text-slate-100"
                />
              )}
              <div className="grid grid-cols-3 gap-1">
                <button
                  disabled={busyAction !== null}
                  onClick={() =>
                    runAction(
                      "hold-approve",
                      `/api/governance/proposals/${proposal.id}/founder-hold`,
                      {
                        chamber1Mode: "FOUNDER_ACTIVE",
                        signers: [
                          { uid: currentUid, role: "BAZAAR_FOUNDER", weightPct: 100 },
                        ],
                        action: "APPROVE_OVERRIDE",
                        publicRationale: rationale,
                      }
                    )
                  }
                  className="py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded text-[9px] uppercase disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  disabled={busyAction !== null}
                  onClick={() =>
                    runAction(
                      "hold-modify",
                      `/api/governance/proposals/${proposal.id}/founder-hold`,
                      {
                        chamber1Mode: "FOUNDER_ACTIVE",
                        signers: [
                          { uid: currentUid, role: "BAZAAR_FOUNDER", weightPct: 100 },
                        ],
                        action: "MODIFY_AND_RESUBMIT",
                        publicRationale: rationale,
                        modifiedValue:
                          modifiedValue.trim() !== ""
                            ? Number(modifiedValue)
                            : undefined,
                      }
                    )
                  }
                  className="py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded text-[9px] uppercase disabled:opacity-50"
                >
                  Modify 48h
                </button>
                <button
                  disabled={busyAction !== null}
                  onClick={() =>
                    runAction(
                      "hold-veto",
                      `/api/governance/proposals/${proposal.id}/founder-hold`,
                      {
                        chamber1Mode: "FOUNDER_ACTIVE",
                        signers: [
                          { uid: currentUid, role: "BAZAAR_FOUNDER", weightPct: 100 },
                        ],
                        action: "SOFT_VETO",
                        publicRationale: rationale,
                      }
                    )
                  }
                  className="py-1.5 bg-rose-900 hover:bg-rose-800 text-rose-100 border border-rose-700 font-bold rounded text-[9px] uppercase disabled:opacity-50"
                >
                  Soft Veto
                </button>
              </div>
            </div>
          ) : (
            <div className="text-[10px] text-orange-200/80">
              Awaiting Chamber 1 decision (Approve, 48h Modify re-ballot, or Soft Veto); unreviewed holds auto-expire after 72h.
            </div>
          )}
        </div>
      )}

      {/* ACTIVE / PASSED Post-Passage Vision Audit Trigger */}
      {(proposal.status === "ACTIVE" || proposal.status === "PASSED") && (
        <button
          disabled={busyAction !== null}
          onClick={() =>
            runAction("execute", `/api/governance/proposals/${proposal.id}/execute`, {
              forceCloseForTest: true,
            })
          }
          className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/60 rounded text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition disabled:opacity-50"
        >
          {busyAction === "execute" ? (
            <>
              <Sparkles className="w-3 h-3 animate-spin" /> Auditing Vision…
            </>
          ) : (
            <>
              <Play className="w-3 h-3" /> Tally & Audit Vision Execution
            </>
          )}
        </button>
      )}

      {feedback && (
        <div
          className={`text-[10px] px-2 py-1 rounded ${
            feedback.type === "ok"
              ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/60"
              : "bg-rose-950/60 text-rose-300 border border-rose-800/60"
          }`}
        >
          {feedback.message}
        </div>
      )}
    </article>
  );
}