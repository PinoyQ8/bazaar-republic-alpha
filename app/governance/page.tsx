// Location: app/governance/page.tsx
import React from "react";
import { prisma } from "@/lib/prisma";
import { Vote } from "lucide-react";
import GovernanceProposalFeed from "@/components/governance/GovernanceProposalFeed";
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
        take: 20,
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

    return {
      proposals,
      activePioneers,
    };
  } catch (err) {
    console.error("[GOVERNANCE_DATA_FAULT]:", err);
    return {
      proposals: [],
      activePioneers: 0,
    };
  }
}

export default async function GovernanceMasterPage(props: GovernancePageProps) {
  if (props.params) await props.params;
  if (props.searchParams) await props.searchParams;

  const { proposals, activePioneers } = await fetchGovernanceState();

  return (
    <main className="w-full max-w-[384px] mx-auto min-h-dvh bg-slate-950 text-slate-100 p-4 pb-24 font-mono flex flex-col gap-4">
      {/* Header */}
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

      {/* Quorum & Constitutional Guardrail Overview */}
      <section className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col gap-2">
        <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400">
          <span>Constitutional Rules</span>
          <span className="text-cyan-400">5-Chamber Grid</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
          <div className="p-2 bg-slate-950 border border-slate-800/80 rounded-lg">
            <span className="text-[9px] text-slate-500 block">
              Chamber Ratification
            </span>
            <span className="font-bold text-slate-200">≥ 80% / 20% Cap</span>
          </div>
          <div className="p-2 bg-slate-950 border border-slate-800/80 rounded-lg">
            <span className="text-[9px] text-slate-500 block">
              Elder VRF / Hold SLA
            </span>
            <span className="font-bold text-amber-400">3/5 Elders • 72h Hold</span>
          </div>
        </div>
      </section>

      {/* Interactive Proposal Queue with ELDER_REVIEW & HOLD_AND_MODIFY Actions */}
      <GovernanceProposalFeed initialProposals={proposals} />

      {/* Footer */}
      <footer className="mt-auto text-center text-[9px] text-slate-600 font-mono tracking-widest pt-4">
        BAZAAR REPUBLIC // TRI-STATE MESH ADJUDICATOR
      </footer>
    </main>
  );
}