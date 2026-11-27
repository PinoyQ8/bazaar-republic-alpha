import React from "react";
import { Vote } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { normalizeTierLevel } from "@/app/lib/governance/tierRbac";
import GovernanceWorkspaceClient from "@/components/governance/GovernanceWorkspaceClient";
import type {
  GovernanceProposalRecord,
  GovernanceProposalStatus,
} from "@/components/governance/ProposalGovernanceCard";

export const dynamic = "force-dynamic";

interface GovernancePageProps {
  params?: Promise<{ [key: string]: string | string[] | undefined }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function fetchGovernanceState(): Promise<{
  proposals: GovernanceProposalRecord[];
  activePioneers: number;
}> {
  try {
    const [rawProposals, activePioneers] = await Promise.all([
      prisma.internalProposal.findMany({
        orderBy: { createdAt: "desc" },
        take: 25,
      }),
      prisma.pioneerNode.count({
        where: { status: "ACTIVE" },
      }),
    ]);

    const proposals: GovernanceProposalRecord[] = rawProposals.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      status: p.status as GovernanceProposalStatus,
      authorUid: p.authorUid ?? null,
      assignedChamber: String(p.assignedChamber),
      scope: String(p.scope),
      targetParameter: p.targetParameter ?? null,
      proposedValue: p.proposedValue ?? null,
      votesFor: p.votesFor ?? 0,
      votesAgainst: p.votesAgainst ?? 0,
      adjudicatorSealHash: p.adjudicatorSealHash ?? null,
      elderPanelUids: p.elderPanelUids ?? [],
      elderVotesFor: p.elderVotesFor ?? 0,
      elderVotesAgainst: p.elderVotesAgainst ?? 0,
      elderReviewExpiresAt: p.elderReviewExpiresAt
        ? p.elderReviewExpiresAt.toISOString()
        : null,
      visionAlignmentPct: p.visionAlignmentPct ?? null,
      executionSealHash: p.executionSealHash ?? null,
      holdReason: p.holdReason ?? null,
      holdExpiresAt: p.holdExpiresAt ? p.holdExpiresAt.toISOString() : null,
      executedAt: p.executedAt ? p.executedAt.toISOString() : null,
      expiresAt: p.expiresAt ? p.expiresAt.toISOString() : null,
      createdAt: p.createdAt.toISOString(),
    }));

    return { proposals, activePioneers };
  } catch (err) {
    console.error("[GOVERNANCE_DATA_FAULT]:", err);
    return { proposals: [], activePioneers: 0 };
  }
}

export default async function GovernancePage(props: GovernancePageProps) {
  if (props.params) await props.params;
  const resolvedSearch = props.searchParams ? await props.searchParams : {};

  const queryUid =
    typeof resolvedSearch.uid === "string" ? resolvedSearch.uid.trim() : "";
  const queryTier =
    typeof resolvedSearch.tier === "string" ? resolvedSearch.tier : undefined;

  let resolvedTier = normalizeTierLevel(queryTier ?? 1);
  let isFounder = queryUid.toLowerCase().includes("founder");
  let isFrozen = false;

  if (queryUid) {
    const pioneer = await (prisma as any).pioneerNode
      ?.findUnique?.({ where: { uid: queryUid } })
      .catch(() => null);
    if (pioneer) {
      resolvedTier = normalizeTierLevel(queryTier ?? pioneer.tier ?? 1);
      isFounder =
        isFounder ||
        String(pioneer.tier || "").toUpperCase() === "BAZAAR_FOUNDER" ||
        String(pioneer.role || "").toUpperCase().includes("FOUNDER");
      isFrozen = ["FROZEN", "QUARANTINED", "SUSPENDED"].includes(
        String(pioneer.status || "").toUpperCase()
      );
    }
  }

  const { proposals, activePioneers } = await fetchGovernanceState();

  return (
    <main className="w-full max-w-[384px] mx-auto min-h-dvh bg-slate-950 text-slate-100 p-4 pb-24 font-mono flex flex-col gap-4">
      <header className="border-b border-slate-800 pb-3 flex justify-between items-center">
        <div>
          <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
            <Vote className="w-3.5 h-3.5" /> MESH Consensus
          </div>
          <h1 className="text-base font-bold text-slate-100 mt-0.5">
            DAO Governance
          </h1>
        </div>
        <div className="text-right">
          <span className="text-[9px] text-slate-500 uppercase">
            Active Nodes
          </span>
          <div className="text-xs font-bold text-emerald-400">
            {activePioneers} Nodes
          </div>
        </div>
      </header>

      <GovernanceWorkspaceClient
        initialProposals={proposals}
        currentUid={queryUid}
        governanceTier={resolvedTier}
        isFounder={isFounder}
        hasPassport={Boolean(queryUid) || resolvedTier > 1 || isFounder}
        isFrozen={isFrozen}
        hasRole={Boolean(queryUid) || resolvedTier > 1 || isFounder}
      />
    </main>
  );
}
