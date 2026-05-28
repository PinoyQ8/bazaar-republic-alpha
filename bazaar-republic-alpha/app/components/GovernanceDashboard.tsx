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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 border border-emerald-900/30 bg-black rounded-lg font-mono text-emerald-500">
      <div className="flex flex-col">
        <h2 className="text-sm font-bold uppercase tracking-widest mb-4 text-emerald-400">Governance HUD // Propose Action</h2>
        <form onSubmit={submitProposal} className="space-y-4">
          <input className="w-full bg-slate-900 p-3 border border-slate-700 text-white" placeholder="Title" onChange={(e) => setProposal({...proposal, title: e.target.value})} required />
          <textarea className="w-full h-40 bg-slate-900 p-3 border border-slate-700 text-white" placeholder="Description" onChange={(e) => setProposal({...proposal, description: e.target.value})} required />
          <button type="submit" className="w-full py-3 bg-emerald-800 text-black font-bold uppercase">Submit Proposal</button>
        </form>
      </div>

      <div className="flex flex-col">
        <h2 className="text-sm font-bold uppercase tracking-widest mb-4 text-emerald-400">Active Telemetry</h2>
        <div className="space-y-4 max-h-125 overflow-y-auto">
          {activeProposalIds.map((id: string) => <ProposalCard key={id} proposalId={id} />)}
        </div>
      </div>
    </div>
  );
}