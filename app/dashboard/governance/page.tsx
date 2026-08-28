// Location: app/dashboard/governance/page.tsx
import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { 
  Vote, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  ArrowRight 
} from "lucide-react";

interface PageProps {
  params?: Promise<{ [key: string]: string | string[] | undefined }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getGovernanceData() {
  try {
    const dbClient = prisma as any;

    const [proposals, nodeCount] = await Promise.all([
      dbClient.internalProposal.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      dbClient.pioneerNode.count({
        where: { status: "ACTIVE" },
      }),
    ]);

    return {
      proposals: proposals || [],
      activeNodes: nodeCount || 0,
    };
  } catch (error) {
    console.error("[GOVERNANCE_PAGE_ERROR]:", error);
    return {
      proposals: [],
      activeNodes: 0,
    };
  }
}

export default async function GovernanceDashboardPage(props: PageProps) {
  // Await Next.js 15 page props
  if (props.params) await props.params;
  if (props.searchParams) await props.searchParams;

  const { proposals, activeNodes } = await getGovernanceData();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-mono">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* HEADER SECTION */}
        <header className="border-b border-slate-800 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-2">
              <Vote className="w-4 h-4" /> BAZAAR REPUBLIC // GOVERNANCE SECTOR
            </div>
            <h1 className="text-2xl font-bold text-slate-100 mt-1">Consensus & Proposals</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
              <span className="text-slate-500">Active Pioneers:</span>{" "}
              <span className="text-emerald-400 font-bold">{activeNodes}</span>
            </div>
            <Link
              href="/dashboard/proposals/new"
              className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition"
            >
              + Create Proposal
            </Link>
          </div>
        </header>

        {/* METRICS HUD */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
            <span className="text-slate-400 uppercase text-[10px]">Active Proposals</span>
            <div className="text-xl font-bold text-slate-100">
              {proposals.filter((p: any) => p.status === "ACTIVE").length}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
            <span className="text-slate-400 uppercase text-[10px]">Quorum Threshold</span>
            <div className="text-xl font-bold text-cyan-400">60% Supermajority</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
            <span className="text-slate-400 uppercase text-[10px]">Elder Council Multivig</span>
            <div className="text-xl font-bold text-amber-400">3/5 Signatures</div>
          </div>
        </div>

        {/* PROPOSALS QUEUE */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Internal Proposal Registry
            </h2>
            <span className="text-[11px] text-slate-500">{proposals.length} Total Loaded</span>
          </div>

          {proposals.length === 0 ? (
            <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-xl p-8 text-center text-xs text-slate-500">
              No governance proposals registered in the database.
            </div>
          ) : (
            <div className="space-y-2.5">
              {proposals.map((proposal: any) => {
                const votesFor = proposal.votesFor || 0;
                const votesAgainst = proposal.votesAgainst || proposal.votesAgain || 0;
                const totalVotes = votesFor + votesAgainst;
                const passRate = totalVotes > 0 ? (votesFor / totalVotes) * 100 : 0;

                return (
                  <div
                    key={proposal.id}
                    className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            proposal.status === "ACTIVE"
                              ? "bg-cyan-950 text-cyan-400 border border-cyan-800"
                              : proposal.status === "PASSED"
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {proposal.status}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          ID: {proposal.id.slice(-8)}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-100">{proposal.title}</h3>
                      <p className="text-xs text-slate-400 line-clamp-1">
                        {proposal.description}
                      </p>
                    </div>

                    <div className="w-full md:w-48 space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Approval ({passRate.toFixed(0)}%)</span>
                        <span>{totalVotes} Votes</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="bg-cyan-500 h-full transition-all duration-500"
                          style={{ width: `${passRate}%` }}
                        />
                      </div>
                    </div>

                    <Link
                      href={`/dashboard/proposals/${proposal.id}`}
                      className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg flex items-center gap-1.5 transition shrink-0"
                    >
                      <span>Review</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}