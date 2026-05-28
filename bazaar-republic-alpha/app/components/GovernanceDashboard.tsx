"use client";

import React, { useState, useEffect } from 'react';
import ProposalCard from './mesh/ProposalCard';
import { getActiveProposals, createProposal } from "@/app/actions/governanceActions";

interface DashboardProps {
  activePioneerId: string;
}

export default function GovernanceDashboard({ activePioneerId }: DashboardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proposal, setProposal] = useState({ title: '', description: '', targetContract: 'CUAOZQ52REMESH2806' });
  const [activeProposalIds, setActiveProposalIds] = useState<string[]>([]);
  const [isSyncingFeed, setIsSyncingFeed] = useState(true);

  useEffect(() => {
    const fetchMasterIndex = async () => {
      try {
        const data = await getActiveProposals();
        setActiveProposalIds(data.map((p: any) => p._id));
      } catch (error) {
        console.error("[MESH-SCAN] Shadow Engine fetch failed:", error);
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
      const result = await createProposal("GENESIS-ANCHOR", proposal.title, proposal.description, proposal.targetContract, 0);
      if (result.success) alert("Proposal Cryptographically Bound (SANDBOX)");
    } catch (err) {
      console.error("[MESH-GOVERNANCE] Submission Fracture:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 border border-emerald-900/30 bg-black rounded-lg font-mono text-emerald-500 shadow-[0_0_15px_rgba(4,120,87,0.1)]">
      <div className="flex flex-col">
        <h2 className="text-sm font-bold uppercase tracking-widest mb-4 border-b border-emerald-900/50 pb-2 text-emerald-400">Governance HUD // Propose Action</h2>
        <form onSubmit={submitProposal} className="space-y-4 grow">
          <input className="w-full bg-slate-900 p-3 border border-slate-700 text-white" placeholder="Title" onChange={(e) => setProposal({...proposal, title: e.target.value})} required />
          <textarea className="w-full h-40 bg-slate-900 p-3 border border-slate-700 text-white resize-none" placeholder="Description" onChange={(e) => setProposal({...proposal, description: e.target.value})} required />
          <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-emerald-800 text-black font-bold uppercase">{isSubmitting ? "Syncing..." : "Submit Proposal"}</button>
        </form>
      </div>
      <div className="flex flex-col">
        <h2 className="text-sm font-bold uppercase tracking-widest mb-4 border-b border-emerald-900/50 pb-2 text-emerald-400">Active Telemetry Feed</h2>
        <div className="space-y-4 max-h-125 overflow-y-auto grow">
          {isSyncingFeed ? <div className="text-emerald-700 p-6 text-center animate-pulse">[SCANNING LEDGER...]</div> 
          : activeProposalIds.length === 0 ? <div className="text-slate-500 p-6 text-center border border-dashed">[NO PROPOSALS]</div>
          : activeProposalIds.map((id: string) => <ProposalCard key={id} proposalId={id} />)}
        </div>
      </div>
    </div>
  );
}