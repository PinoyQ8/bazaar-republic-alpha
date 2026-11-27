"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Filter, RefreshCw } from "lucide-react";
import ProposalSubmissionForm from "@/components/governance/ProposalSubmissionForm";
import ProposalGovernanceCard, {
  GovernanceProposalRecord,
  GovernanceProposalStatus,
} from "@/components/governance/ProposalGovernanceCard";
import type { GovernanceTierLevel } from "@/app/lib/governance/tierRbac";

export type ChamberFilterKey =
  | "ALL"
  | "FOUNDER"
  | "GENESIS_100"
  | "MERCHANT"
  | "SERVICE_PROVIDER"
  | "CITIZEN";

const CHAMBER_FILTERS: ChamberFilterKey[] = [
  "ALL",
  "FOUNDER",
  "GENESIS_100",
  "MERCHANT",
  "SERVICE_PROVIDER",
  "CITIZEN",
];

const STATUS_FILTERS: Array<"ALL" | GovernanceProposalStatus> = [
  "ALL",
  "ELDER_REVIEW",
  "HOLD_AND_MODIFY",
  "ACTIVE",
  "EXECUTED",
];

function normalizeChamber(raw?: string | null): ChamberFilterKey {
  const upper = String(raw || "").toUpperCase();
  if (upper === "GENESIS") return "GENESIS_100";
  if (
    upper === "FOUNDER" ||
    upper === "GENESIS_100" ||
    upper === "MERCHANT" ||
    upper === "SERVICE_PROVIDER" ||
    upper === "CITIZEN"
  ) {
    return upper;
  }
  return "CITIZEN";
}

interface GovernanceWorkspaceClientProps {
  initialProposals: GovernanceProposalRecord[];
  currentUid?: string;
  governanceTier?: GovernanceTierLevel;
  isFounder?: boolean;
  hasPassport?: boolean;
  isFrozen?: boolean;
  hasRole?: boolean;
}

export default function GovernanceWorkspaceClient({
  initialProposals,
  currentUid = "",
  governanceTier = 1,
  isFounder = false,
  hasPassport = true,
  isFrozen = false,
  hasRole = true,
}: GovernanceWorkspaceClientProps) {
  const [proposals, setProposals] =
    useState<GovernanceProposalRecord[]>(initialProposals);
  const [chamberFilter, setChamberFilter] = useState<ChamberFilterKey>("ALL");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | GovernanceProposalStatus
  >("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshProposals = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (chamberFilter !== "ALL") {
        params.set(
          "chamber",
          chamberFilter === "GENESIS_100" ? "GENESIS" : chamberFilter
        );
      }
      if (statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }
      const query = params.toString();
      const res = await fetch(
        `/api/governance/proposals${query ? `?${query}` : ""}`,
        { cache: "no-store" }
      );
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data?.proposals)) {
        setProposals(data.proposals);
      }
    } catch (err) {
      console.error("[GOVERNANCE_WORKSPACE_REFRESH_FAULT]:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [chamberFilter, statusFilter]);

  const filteredProposals = useMemo(() => {
    return proposals.filter((p) => {
      const matchesChamber =
        chamberFilter === "ALL" ||
        normalizeChamber(p.assignedChamber) === chamberFilter;
      const matchesStatus =
        statusFilter === "ALL" || p.status === statusFilter;
      return matchesChamber && matchesStatus;
    });
  }, [proposals, chamberFilter, statusFilter]);

  return (
    <div className="flex flex-col gap-4">
      <ProposalSubmissionForm
        governanceTier={governanceTier}
        proposerUid={currentUid}
        isFounder={isFounder}
        hasPassport={hasPassport}
        isFrozen={isFrozen}
        hasRole={hasRole}
        onSubmitted={() => {
          void refreshProposals();
        }}
      />

      <section className="flex flex-col gap-2.5 rounded-xl border border-zinc-800 bg-zinc-950 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Filter size={12} className="text-cyan-400" />
            Chamber & Status Queue
          </h2>
          <button
            type="button"
            onClick={() => void refreshProposals()}
            disabled={isRefreshing}
            className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              size={11}
              className={isRefreshing ? "animate-spin" : ""}
            />
            <span>
              {isRefreshing
                ? "Syncing..."
                : `${filteredProposals.length} Shown`}
            </span>
          </button>
        </div>

        <div className="space-y-1">
          <span className="block text-[9px] uppercase tracking-wider text-zinc-500">
            5 Chambers (20% Cap Each)
          </span>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {CHAMBER_FILTERS.map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => setChamberFilter(ch)}
                className={`px-2 py-1 rounded text-[9px] font-mono font-bold uppercase shrink-0 border transition cursor-pointer ${
                  chamberFilter === ch
                    ? "bg-cyan-500 text-slate-950 border-cyan-400"
                    : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                }`}
              >
                {ch.replaceAll("_", " ")}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <span className="block text-[9px] uppercase tracking-wider text-zinc-500">
            Lifecycle State
          </span>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {STATUS_FILTERS.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2 py-1 rounded text-[9px] font-mono font-bold uppercase shrink-0 border transition cursor-pointer ${
                  statusFilter === st
                    ? "bg-emerald-500 text-slate-950 border-emerald-400"
                    : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                }`}
              >
                {st.replaceAll("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {filteredProposals.length === 0 ? (
          <div className="p-5 bg-zinc-900/40 border border-dashed border-zinc-800 rounded-xl text-center text-xs text-zinc-500">
            No proposals match chamber {chamberFilter} and status {statusFilter}.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 pt-1">
            {filteredProposals.map((proposal) => (
              <ProposalGovernanceCard
                key={proposal.id}
                proposal={proposal}
                currentUid={currentUid}
                isFounder={isFounder}
                onRefresh={() => {
                  void refreshProposals();
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
