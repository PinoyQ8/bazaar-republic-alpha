"use client";

import React, { useState, useEffect } from 'react';
<<<<<<< HEAD
// 🛡️ ALIGNED TO MESH SERVER ACTIONS (Bypassing slow REST APIs)
import { getActiveProposals, createProposal, castVote } from '@/app/actions/governanceActions';

interface GovernanceDashboardProps {
  activePioneerId?: string; 
}

export default function GovernanceDashboard({ activePioneerId = "PinoyQ8" }: GovernanceDashboardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proposal, setProposal] = useState({ title: '', description: '', targetParameter: 'MAX_DISCOUNT', proposedValue: '' });
  
  // 🛡️ DIRECT MESH TELEMETRY STATE
  const [proposals, setProposals] = useState<any[]>([]);
=======
import ProposalCard from './mesh/ProposalCard';
import { getActiveProposals, createProposal } from "@/app/actions/governanceActions";

interface DashboardProps {
  activePioneerId: string;
}

export default function GovernanceDashboard({ activePioneerId }: DashboardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proposal, setProposal] = useState({ title: '', description: '', targetContract: 'CUAOZQ52REMESH2806' });
  const [activeProposalIds, setActiveProposalIds] = useState<string[]>([]);
>>>>>>> main
  const [isSyncingFeed, setIsSyncingFeed] = useState(true);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fetchMasterIndex = async () => {
    setIsSyncingFeed(true);
    try {
      // 🚀 DIRECT SERVER ACTION UPLINK
      const data = await getActiveProposals();
      setProposals(data);
    } catch (error) {
      console.error("[MESH-SCAN] Master Index fetch failed:", error);
    } finally {
      setIsSyncingFeed(false);
    }
  };

  useEffect(() => {
<<<<<<< HEAD
=======
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
>>>>>>> main
    fetchMasterIndex();
  }, []);

  const submitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
<<<<<<< HEAD
    setStatusMsg("Syncing to Ledger...");

    try {
      // 🚀 SECURE SERVER ACTION EXECUTION
      const result = await createProposal(
        activePioneerId,
        proposal.title,
        proposal.description,
        proposal.targetParameter,
        parseFloat(proposal.proposedValue)
      );

      if (result.success) {
        setStatusMsg(`🟢 SUCCESS: ${result.message}`);
        setProposal({ title: '', description: '', targetParameter: 'MAX_DISCOUNT', proposedValue: '' });
        fetchMasterIndex(); // Force UI refresh
      } else {
        setStatusMsg(`❌ FRACTURE: ${result.message}`);
      }
=======
    try {
      const result = await createProposal("GENESIS-ANCHOR", proposal.title, proposal.description, proposal.targetContract, 0);
      if (result.success) alert("Proposal Cryptographically Bound (SANDBOX)");
>>>>>>> main
    } catch (err) {
      console.error("[MESH-GOVERNANCE] Submission Fracture:", err);
      setStatusMsg("🚨 FATAL: Submission Engine Offline.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeVote = async (proposalId: string, voteType: "YES" | "NO") => {
    setStatusMsg(`Locking Vote: ${voteType}...`);
    const result = await castVote(activePioneerId, proposalId, voteType);
    
    if (result.success) {
      setStatusMsg(`🟢 ${result.message}`);
      fetchMasterIndex(); // Refresh feed to show updated vote weight
    } else {
      setStatusMsg(`❌ ${result.message}`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 border border-emerald-900/30 bg-black rounded-lg font-mono text-emerald-500">
      <div className="flex flex-col">
<<<<<<< HEAD
        <h2 className="text-sm font-bold uppercase tracking-widest mb-4 border-b border-emerald-900/50 pb-2 text-emerald-400">
          Governance HUD // Propose Action
        </h2>

        {statusMsg && (
          <div className={`mb-4 p-3 text-xs border ${statusMsg.includes('SUCCESS') || statusMsg.includes('🟢') ? 'border-emerald-500 text-emerald-400 bg-emerald-900/20' : 'border-red-500 text-red-400 bg-red-900/20'}`}>
            {statusMsg}
          </div>
        )}

        <form onSubmit={submitProposal} className="space-y-4 grow">
          <input 
            placeholder="Proposal Title" 
            value={proposal.title}
            className="w-full bg-slate-900 p-3 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition-colors placeholder-slate-500 text-sm"
            onChange={(e) => setProposal({...proposal, title: e.target.value})}
            required
          />
          <textarea 
            placeholder="Proposal Description & Intent" 
            value={proposal.description}
            className="w-full h-24 bg-slate-900 p-3 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition-colors placeholder-slate-500 resize-none text-sm"
            onChange={(e) => setProposal({...proposal, description: e.target.value})}
            required
          />
          <div className="flex gap-2">
            <select 
              value={proposal.targetParameter} 
              onChange={(e) => setProposal({...proposal, targetParameter: e.target.value})}
              className="w-1/2 bg-slate-900 p-3 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 text-sm"
            >
              <option value="MAX_DISCOUNT">Max Subsidy (%)</option>
              <option value="BASE_TAX">Base Tax (%)</option>
            </select>
            <input 
              type="number" 
              step="0.01"
              placeholder="Value (e.g. 0.15)" 
              value={proposal.proposedValue}
              className="w-1/2 bg-slate-900 p-3 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 text-sm"
              onChange={(e) => setProposal({...proposal, proposedValue: e.target.value})}
              required
            />
          </div>
          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-emerald-800 text-black font-bold uppercase tracking-widest hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
          >
            {isSubmitting ? "Syncing to Ledger..." : "Submit Proposal"}
          </button>
=======
        <h2 className="text-sm font-bold uppercase tracking-widest mb-4 text-emerald-400">Governance HUD // Propose Action</h2>
        <form onSubmit={submitProposal} className="space-y-4">
          <input className="w-full bg-slate-900 p-3 border border-slate-700 text-white" placeholder="Title" onChange={(e) => setProposal({...proposal, title: e.target.value})} required />
          <textarea className="w-full h-40 bg-slate-900 p-3 border border-slate-700 text-white" placeholder="Description" onChange={(e) => setProposal({...proposal, description: e.target.value})} required />
          <button type="submit" className="w-full py-3 bg-emerald-800 text-black font-bold uppercase">Submit Proposal</button>
>>>>>>> main
        </form>
      </div>

      <div className="flex flex-col">
<<<<<<< HEAD
        <h2 className="text-sm font-bold uppercase tracking-widest mb-4 border-b border-emerald-900/50 pb-2 text-emerald-400">
          Active Telemetry Feed
        </h2>
        <div className="space-y-4 max-h-75 lg:max-h-100 overflow-y-auto pr-2 custom-scrollbar grow">
          {isSyncingFeed ? (
            <div className="text-emerald-700 text-xs border border-emerald-900/30 p-6 text-center animate-pulse">
              [SCANNING LEDGER FOR ACTIVE PROPOSALS...]
            </div>
          ) : proposals.length === 0 ? (
            <div className="text-slate-500 text-xs border border-slate-800 p-6 text-center border-dashed">
              [NO ACTIVE PROPOSALS DETECTED IN LEDGER]
            </div>
          ) : (
            proposals.map((p) => {
              const totalVotes = p.votesFor + p.votesAgainst;
              const forPercent = totalVotes === 0 ? 0 : Math.round((p.votesFor / totalVotes) * 100);

              return (
                <div key={p._id} className="p-4 border border-emerald-900/50 bg-slate-900/50 rounded">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-emerald-300 text-sm">{p.title}</h3>
                    <span className="text-[10px] text-slate-500">EXP: {new Date(p.expiresAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">{p.description}</p>
                  <p className="text-xs text-emerald-500 mb-3 font-bold border-l-2 border-emerald-500 pl-2">
                    {p.targetParameter} ⚡ TARGET: {p.proposedValue}
                  </p>

                  <div className="w-full bg-slate-800 h-1.5 rounded mb-2 overflow-hidden flex">
                    <div className="bg-emerald-500 h-full" style={{ width: `${forPercent}%` }}></div>
                    <div className="bg-red-900 h-full" style={{ width: `${100 - forPercent}%` }}></div>
                  </div>
                  
                  <div className="flex justify-between text-[10px] text-slate-400 mb-4 uppercase">
                    <span>Yes: {p.votesFor} power</span>
                    <span>No: {p.votesAgainst} power</span>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => executeVote(p._id, "YES")} className="flex-1 bg-emerald-900/40 hover:bg-emerald-800 py-2 border border-emerald-700 text-emerald-400 text-xs font-bold transition-colors">
                      VOTE YES
                    </button>
                    <button onClick={() => executeVote(p._id, "NO")} className="flex-1 bg-red-900/20 hover:bg-red-900/60 py-2 border border-red-900 text-red-500 text-xs font-bold transition-colors">
                      VOTE NO
                    </button>
                  </div>
                </div>
              );
            })
          )}
=======
        <h2 className="text-sm font-bold uppercase tracking-widest mb-4 text-emerald-400">Active Telemetry</h2>
        <div className="space-y-4 max-h-125 overflow-y-auto">
          {activeProposalIds.map((id: string) => <ProposalCard key={id} proposalId={id} />)}
>>>>>>> main
        </div>
      </div>
    </div>
  );
}