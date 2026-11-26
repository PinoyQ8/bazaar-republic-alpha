"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Lock, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  canAccessSubSection,
  canPerformGovernanceAction,
  GOVERNANCE_TIER_META,
  GovernanceTierLevel,
  normalizeTierLevel,
} from "@/app/lib/governance/tierRbac";
import ProposalGovernanceCard, {
  GovernanceProposalRecord,
} from "@/components/governance/ProposalGovernanceCard";

export interface GovernanceProposalFeedProps {
  initialProposals: GovernanceProposalRecord[];
  currentUid?: string;
  isFounder?: boolean;
  governanceTier?: GovernanceTierLevel | string;
}

export default function GovernanceProposalFeed({
  initialProposals,
  currentUid,
  isFounder: isFounderProp,
  governanceTier,
}: GovernanceProposalFeedProps) {
  const {
    pioneer,
    hasActiveRole: authHasRole,
    isFounder: authIsFounder,
  } = useAuth();

  const [proposals, setProposals] =
    useState<GovernanceProposalRecord[]>(initialProposals);
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "ELDER_REVIEW">("ALL");
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const effectiveTier = normalizeTierLevel(governanceTier ?? pioneer?.tier ?? 1);
  const effectiveHasRole = authHasRole;
  const effectiveHasPassport = Boolean(pioneer?.isAuthenticated);
  const effectiveFrozen = pioneer?.status === "FROZEN";
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

  const refreshProposals = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/governance/proposals", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.proposals)) {
          setProposals(data.proposals);
        }
      }
    } catch (err) {
      console.error("[GOVERNANCE_FEED_REFRESH_FAULT]:", err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const visibleProposals = useMemo(() => {
    if (filter === "ALL") return proposals;
    return proposals.filter((p) => p.status === filter);
  }, [proposals, filter]);

  return (
    <section className="space-y-3 font-mono text-slate-100">
      {/* RBAC Capability Summary Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-2.5 space-y-1.5 text-[10px]">
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-slate-300">
            Proposal Queue ({visibleProposals.length})
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className={`rounded border px-1.5 py-0.5 text-[9px] font-bold ${
                GOVERNANCE_TIER_META[effectiveTier].badgeClass
              }`}
            >
              {GOVERNANCE_TIER_META[effectiveTier].shortLabel}
            </span>
            <button
              type="button"
              onClick={refreshProposals}
              disabled={refreshing}
              aria-label="Refresh proposals"
              className="rounded border border-slate-800 bg-slate-950 p-1 text-cyan-400 hover:text-cyan-300 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw
                className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-1.5 text-[9px] text-slate-400">
          <span className="flex items-center gap-1">
            {votePerm.allowed ? (
              <span className="text-emerald-400 font-bold">● Voting Enabled</span>
            ) : (
              <span className="text-amber-400 font-bold flex items-center gap-0.5">
                <Lock className="h-2.5 w-2.5" /> Vote Locked
              </span>
            )}
          </span>
          <span className="flex items-center gap-1">
            {elderAccess.allowed ? (
              <span className="text-amber-300 font-bold">● Elder Adjudication</span>
            ) : (
              <span className="text-slate-500 flex items-center gap-0.5">
                <Lock className="h-2.5 w-2.5" /> Elder: {elderAccess.requiredTierLabel}
              </span>
            )}
          </span>
        </div>

        {/* Filter Chips */}
        <div className="grid grid-cols-3 gap-1 pt-1">
          {(
            [
              { key: "ALL", label: "All" },
              { key: "ACTIVE", label: "Active" },
              { key: "ELDER_REVIEW", label: "Elder Review" },
            ] as const
          ).map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => setFilter(chip.key)}
              className={`rounded border py-1 text-[10px] font-bold cursor-pointer ${
                filter === chip.key
                  ? "border-cyan-500 bg-cyan-950/70 text-cyan-300"
                  : "border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {visibleProposals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 p-5 text-center text-[11px] text-slate-500">
          No proposals in {filter} queue.
        </div>
      ) : (
        <div className="space-y-2.5">
          {visibleProposals.map((proposal) => (
            <ProposalGovernanceCard
              key={proposal.id}
              proposal={proposal}
              currentUid={currentUid}
              isFounder={effectiveIsFounder}
              governanceTier={effectiveTier}
              hasRole={effectiveHasRole}
              hasPassport={effectiveHasPassport}
              isFrozen={effectiveFrozen}
              onRefresh={refreshProposals}
            />
          ))}
        </div>
      )}
    </section>
  );
}