"use client";

import React, { useState, useEffect } from 'react';
import ProposalCard from './mesh/ProposalCard'; 

export default function GovernanceDashboard() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proposal, setProposal] = useState({ title: '', description: '', targetContract: 'CUAOZQ52REMESH2806' });
  
  // State to hold the ledger's active proposal IDs
  const [activeProposalIds, setActiveProposalIds] = useState<string[]>([]);
  const [isSyncingFeed, setIsSyncingFeed] = useState(true);

  // 🛡️ INITIALIZATION SCAN: Fetch active proposals from the MESH
  useEffect(() => {
    const fetchMasterIndex = async () => {
      try {
        const response = await fetch('/api/governance/proposals');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setActiveProposalIds(data.proposalIds || []);
          }
        }
      } catch (error) {
        console.error("[MESH-SCAN] Master Index fetch failed:", error);
      } finally {
        setIsSyncingFeed(false);
      }
    };
    fetchMasterIndex();
  }, []);

  const submitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/governance/submit-proposal', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-mesh-pioneer-uid': 'GENESIS-ANCHOR', // Current session ID
          'x-mesh-pioneer-role': 'FOUNDER' 
        },
        body: JSON.stringify(proposal),
      });

      const data = await response.json();
      if (data.success) {
        alert(`Proposal Cryptographically Bound. Voting Weight: ${data.votingPower}`);
        // Optionally: Trigger a local state refresh here to show the new proposal immediately
      }
    } catch (err) {
      console.error("[MESH-GOVERNANCE] Submission Fracture:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 border border-emerald-900/30 bg-black rounded-lg font-mono text-emerald-500 shadow-[0_0_15px_rgba(4,120,87,0.1)]">
      
      {/* 🛡️ SECTOR 1: PROPOSAL FORGE (WRITE) */}
      <div className="flex flex-col">
        <h2 className="text-sm font-bold uppercase tracking-widest mb-4 border-b border-emerald-900/50 pb-2 text-emerald-400">
          Governance HUD // Propose Action
        </h2>
        <form onSubmit={submitProposal} className="space-y-4 grow">
          <input 
            placeholder="Proposal Title" 
            className="w-full bg-slate-900 p-3 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition-colors placeholder-slate-500"
            onChange={(e) => setProposal({...proposal, title: e.target.value})}
            required
          />
          <textarea 
            placeholder="Proposal Description & Intent" 
            className="w-full h-40 bg-slate-900 p-3 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition-colors placeholder-slate-500 resize-none"
            onChange={(e) => setProposal({...proposal, description: e.target.value})}
            required
          />
          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-emerald-800 text-black font-bold uppercase tracking-widest hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? "Syncing to Ledger..." : "Submit Proposal"}
          </button>
        </form>
      </div>

      {/* 🛡️ SECTOR 2: ACTIVE MESH TELEMETRY (READ) */}
      <div className="flex flex-col">
        <h2 className="text-sm font-bold uppercase tracking-widest mb-4 border-b border-emerald-900/50 pb-2 text-emerald-400">
          Active Telemetry Feed
        </h2>
        <div className="space-y-4 max-h-75 lg:max-h-100 overflow-y-auto pr-2 custom-scrollbar grow">
          {isSyncingFeed ? (
            <div className="text-emerald-700 text-xs border border-emerald-900/30 p-6 text-center animate-pulse">
              [SCANNING LEDGER FOR ACTIVE PROPOSALS...]
            </div>
          ) : activeProposalIds.length === 0 ? (
            <div className="text-slate-500 text-xs border border-slate-800 p-6 text-center border-dashed">
              [NO ACTIVE PROPOSALS DETECTED IN LEDGER]
            </div>
          ) : (
            activeProposalIds.map((id) => (
              <ProposalCard key={id} proposalId={id} />
            ))
          )}
        </div>
      </div>

    </div>
  );
}