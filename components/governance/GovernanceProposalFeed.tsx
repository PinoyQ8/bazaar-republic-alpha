// Location: components/governance/GovernanceProposalFeed.tsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import ProposalGovernanceCard, {
  GovernanceProposalRecord,
  GovernanceProposalStatus,
} from "@/components/governance/ProposalGovernanceCard";

const STATUS_FILTERS: Array<"ALL" | GovernanceProposalStatus> = [
  "ALL",
  "ELDER_REVIEW",
  "HOLD_AND_MODIFY",
  "ACTIVE",
  "EXECUTED",
];

interface GovernanceProposalFeedProps {
  initialProposals: GovernanceProposalRecord[];
  currentUid?: string;
  isFounder?: boolean;
}

interface ResolvedSession {
  uid: string;
  isFounder: boolean;
  label: string;
}

function readLocalPioneerSession(): ResolvedSession {
  if (typeof window === "undefined") {
    return { uid: "", isFounder: false, label: "Observer" };
  }

  for (const key of ["pioneer_user", "pi_auth_user"]) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const uid = String(parsed?.uid || parsed?.username || "").trim();
      const tier = String(parsed?.tier || "").toUpperCase();
      const roles: string[] = Array.isArray(parsed?.roles)
        ? parsed.roles.map((r: unknown) => String(r).toUpperCase())
        : [];

      const isFounder =
        tier === "BAZAAR_FOUNDER" ||
        roles.includes("BAZAAR_FOUNDER") ||
        roles.includes("FOUNDER") ||
        uid.toLowerCase().includes("founder");

      if (uid) {
        return {
          uid,
          isFounder,
          label: isFounder ? `Founder (${uid})` : uid,
        };
      }
    } catch {
      // Ignore malformed storage entries and check next key
    }
  }

  return { uid: "", isFounder: false, label: "Observer" };
}

export default function GovernanceProposalFeed({
  initialProposals,
  currentUid = "",
  isFounder = false,
}: GovernanceProposalFeedProps) {
  const [proposals, setProposals] =
    useState<GovernanceProposalRecord[]>(initialProposals);
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | GovernanceProposalStatus
  >("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [session, setSession] = useState<ResolvedSession>({
    uid: currentUid,
    isFounder,
    label: currentUid || "Observer",
  });

  useEffect(() => {
    if (currentUid) {
      setSession({
        uid: currentUid,
        isFounder,
        label: isFounder ? `Founder (${currentUid})` : currentUid,
      });
      return;
    }
    setSession(readLocalPioneerSession());
  }, [currentUid, isFounder]);

  const refreshProposals = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/governance/proposals", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.proposals)) {
        setProposals(data.proposals);
      }
    } catch (err) {
      console.error("[GOVERNANCE_FEED_REFRESH_FAULT]:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const filteredProposals =
    statusFilter === "ALL"
      ? proposals
      : proposals.filter((p) => p.status === statusFilter);

  return (
    <section className="flex flex-col gap-2.5">
      {/* Active Signer Status Pill */}
      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[10px]">
        <span className="text-slate-400 uppercase">Signer Identity</span>
        <span
          className={`font-bold truncate 50 ${
            session.isFounder
              ? "text-amber-300"
              : session.uid
              ? "text-cyan-300"
              : "text-slate-500"
          }`}
        >
          {session.label}
        </span>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Proposals Queue
        </h2>
        <span className="text-[10px] text-slate-500">
          {isRefreshing
            ? "Syncing…"
            : `${filteredProposals.length} / ${proposals.length} Shown`}
        </span>
      </div>

      {/* Status Filter Strip */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`px-2 py-1 rounded text-[9px] font-mono font-bold uppercase shrink-0 border transition ${
              statusFilter === st
                ? "bg-emerald-500 text-slate-950 border-emerald-400"
                : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
            }`}
          >
            {st.replaceAll("_", " ")}
          </button>
        ))}
      </div>

      {filteredProposals.length === 0 ? (
        <div className="p-6 bg-slate-900/30 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-500">
          No governance proposals match {statusFilter.replaceAll("_", " ")}.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredProposals.map((proposal) => (
            <ProposalGovernanceCard
              key={proposal.id}
              proposal={proposal}
              currentUid={session.uid}
              isFounder={session.isFounder}
              onRefresh={refreshProposals}
            />
          ))}
        </div>
      )}
    </section>
  );
}