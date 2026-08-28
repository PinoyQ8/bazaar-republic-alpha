"use client";

import React, { useState, useEffect } from 'react';

// Type definitions to lock the MESH schema
interface AggregatedStats {
  totalFor: number;
  totalAgainst: number;
  participation: number;
  isPassing: boolean;
}

interface ProposalData {
  _id: string;
  description: string;
  status: 'ACTIVE' | 'PASSED' | 'REJECTED';
  proposerTier: string;
  tierMetrics: Record<string, { votesFor: number; votesAgainst: number }>;
  aggregatedStats: AggregatedStats;
}

export default function ProposalCard({ proposalId }: { proposalId: string }) {
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'GLOBAL' | 'TIER'>('GLOBAL');

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const res = await fetch(`/api/governance/proposals/${proposalId}`);
        const json = await res.json();
        if (json.success) {
          setProposal(json.data);
        }
      } catch (error) {
        console.error("[MESH-UI] Telemetry fetch failed:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTelemetry();
  }, [proposalId]);

  if (loading) return <div className="p-4 text-emerald-700 animate-pulse text-sm font-mono border border-emerald-900/30 bg-black">[MESH-SCAN] Syncing ledger telemetry for {proposalId.slice(-6)}...</div>;
  if (!proposal) return null; // Silently fail if not found to keep dashboard clean

  const totalVotes = proposal.aggregatedStats.totalFor + proposal.aggregatedStats.totalAgainst;
  const forPercentage = totalVotes === 0 ? 0 : Math.round((proposal.aggregatedStats.totalFor / totalVotes) * 100);

  return (
    <div className="border border-slate-700 bg-slate-900/50 rounded-lg p-4 font-mono w-full">
      {/* HEADER SHIELD */}
      <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-3">
        <div>
          <h3 className="text-sm font-bold text-white tracking-widest">PROP-{proposal._id.slice(-6).toUpperCase()}</h3>
          <p className="text-xs text-slate-400">Origin: {proposal.proposerTier}</p>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider border ${
          proposal.status === 'ACTIVE' ? 'bg-blue-900/30 text-blue-400 border-blue-800' :
          proposal.status === 'PASSED' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' :
          'bg-red-900/30 text-red-400 border-red-800'
        }`}>
          {proposal.status}
        </div>
      </div>

      <p className="mb-4 text-sm text-slate-300 line-clamp-2">{proposal.description}</p>

      {/* VIEW TOGGLE */}
      <div className="flex space-x-2 mb-3">
        <button 
          onClick={() => setViewMode('GLOBAL')}
          className={`px-2 py-1 text-[10px] border tracking-widest ${viewMode === 'GLOBAL' ? 'bg-slate-700 border-slate-500 text-white' : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}
        >
          GLOBAL
        </button>
        <button 
          onClick={() => setViewMode('TIER')}
          className={`px-2 py-1 text-[10px] border tracking-widest ${viewMode === 'TIER' ? 'bg-slate-700 border-slate-500 text-white' : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}
        >
          TIER BREAKDOWN
        </button>
      </div>

      {/* DATA VISUALIZATION */}
      {viewMode === 'GLOBAL' ? (
        <div className="bg-black/50 p-3 rounded border border-slate-800">
          <div className="flex justify-between text-xs mb-2 font-bold">
            <span className="text-emerald-500">APPROVE: {proposal.aggregatedStats.totalFor}</span>
            <span className="text-red-500">REJECT: {proposal.aggregatedStats.totalAgainst}</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded overflow-hidden flex">
            <div style={{ width: `${forPercentage}%` }} className="bg-emerald-500 h-full"></div>
            <div style={{ width: `${100 - forPercentage}%` }} className="bg-red-500 h-full"></div>
          </div>
          <div className="text-[10px] text-slate-500 mt-2 text-right">
            Nodes Synced: {proposal.aggregatedStats.participation}
          </div>
        </div>
      ) : (
        <div className="bg-black/50 p-3 rounded border border-slate-800 grid gap-2">
          {Object.entries(proposal.tierMetrics).map(([tier, metrics]) => (
            <div key={tier} className="flex justify-between items-center text-xs border-b border-slate-800 pb-1">
              <span className="uppercase text-slate-400">{tier}</span>
              <span className="text-slate-300">
                <span className="text-emerald-500">+{metrics.votesFor || 0}</span> / <span className="text-red-500">-{metrics.votesAgainst || 0}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}