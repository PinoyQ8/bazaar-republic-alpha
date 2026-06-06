"use client";

import { useEffect, useState } from "react";
import { Shield, Loader2, AlertTriangle } from "lucide-react";
import { getConsensusData } from "@/app/actions/governance";

// 🛡️ Define the Ledger Interfaces for Type Safety
interface ProposalData {
  id: string;
  title: string;
  description: string;
  authorUid: string;
  status: string;
  votesFor: number;
  votesAgainst: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface GovernanceData {
  proposal: ProposalData;
  tierCounts: any[];
}

interface GovernanceDashboardProps {
  data?: GovernanceData; // Optional: Hybrid acceptance
}

const LoadingState = () => (
  <div className="bg-neutral-950 p-6 border border-neutral-800 rounded-lg text-amber-500 flex flex-col items-center justify-center min-h-125">
    <Loader2 className="w-12 h-12 animate-spin mb-4" />
    <h2 className="text-xl font-bold uppercase animate-pulse">Syncing with MESH Matrix...</h2>
  </div>
);

const ErrorState = ({ message }: { message: string | null }) => (
  <div className="bg-neutral-950 p-6 border border-red-900 rounded-lg text-red-500 flex flex-col items-center justify-center min-h-125">
    <AlertTriangle className="w-12 h-12 mb-4" />
    <h2 className="text-xl font-bold uppercase">Telemetry Failure</h2>
    <p className="text-sm mt-2">{message || "Unknown Data Link Fracture"}</p>
  </div>
);

export default function GovernanceDashboard({ data: initialData }: GovernanceDashboardProps) {
  const [data, setData] = useState<GovernanceData | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If data was already injected via props, skip the internal fetch
    if (initialData) return;

    async function load() {
      try {
        setIsLoading(true);
        const result = await getConsensusData();
        if (!result || !result.proposal) {
          setError("No active proposals found in the ledger.");
        } else {
          setData(result);
        }
      } catch (e) {
        setError("Adjudicator Intercept: Data Link Fracture");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [initialData]);

  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error} />;

  const { proposal } = data;

  return (
    <div className="bg-neutral-950 p-6 border border-neutral-800 rounded-lg font-mono text-amber-500 w-full max-w-5xl mx-auto shadow-xl">
      <div className="flex items-center justify-between border-b border-amber-900/50 pb-4 mb-6">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-amber-500" />
          <h2 className="text-2xl font-bold tracking-widest uppercase">Mesh Consensus Matrix</h2>
        </div>
      </div>

      <div className="space-y-4">
        <div className="border border-amber-900/30 p-4 rounded">
          <h3 className="text-lg font-bold text-white">{proposal.title}</h3>
          <p className="text-sm text-neutral-400 mt-1">{proposal.description}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-neutral-900 p-4 border border-emerald-900/50 rounded">
            <span className="text-emerald-500 text-xs block">VOTES FOR</span>
            <span className="text-2xl">{proposal.votesFor}</span>
          </div>
          <div className="bg-neutral-900 p-4 border border-rose-900/50 rounded">
            <span className="text-rose-500 text-xs block">VOTES AGAINST</span>
            <span className="text-2xl">{proposal.votesAgainst}</span>
          </div>
        </div>
      </div>
    </div>
  );
}