"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

// 🛡️ MESH TYPING: Governance Protocol
interface Proposal {
  id: string;
  title: string;
  description: string;
  author: string;
  status: "ACTIVE" | "EXECUTED" | "REJECTED";
  votesFor: number;
  votesAgainst: number;
  timeRemaining: string;
}

export default function GovernanceSector() {
  const { pioneer } = useAuth();
  
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [votedProposals, setVotedProposals] = useState<string[]>([]);

  // Mock Ledger: Alpha-Track DAO Proposals
  const [proposals, setProposals] = useState<Proposal[]>([
    {
      id: "PROP-042",
      title: "Uptime Shield Penalty Adjustment",
      description: "Increase the Pi slashing penalty for nodes that drop below 92% Uptime Shield to enforce tighter network reliance.",
      author: "CypherNode",
      status: "ACTIVE",
      votesFor: 1420,
      votesAgainst: 310,
      timeRemaining: "14h 22m",
    },
    {
      id: "PROP-043",
      title: "Onboard Alpha-Track Services",
      description: "Approve the new E-Network provider schema (v2) allowing task-based micro-transactions across the MESH.",
      author: "MeshWeaver",
      status: "ACTIVE",
      votesFor: 890,
      votesAgainst: 950,
      timeRemaining: "2d 04h",
    },
    {
      id: "PROP-040",
      title: "Zero-Trust Perimeter Expansion",
      description: "Mandate ReCAPTCHA v3 equivalent decentral-checks for all incoming Edge API requests.",
      author: "LogicAuditor",
      status: "EXECUTED",
      votesFor: 5200,
      votesAgainst: 120,
      timeRemaining: "CLOSED",
    }
  ]);

  const handleVote = async (proposalId: string, type: "FOR" | "AGAINST") => {
    if (isSyncing || votedProposals.includes(proposalId)) return;

    setIsSyncing(true);
    console.log(`[MESH-BRIDGE] 🟢 Initiating DAO Vote (${type}) for Node: ${pioneer.username}`);

    try {
      // ⏱️ Simulated Adjudicator Vault Write
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Optimistic Ledger Update
      setProposals(prev => prev.map(p => {
        if (p.id === proposalId) {
          return {
            ...p,
            votesFor: type === "FOR" ? p.votesFor + 1 : p.votesFor,
            votesAgainst: type === "AGAINST" ? p.votesAgainst + 1 : p.votesAgainst
          };
        }
        return p;
      }));
      
      setVotedProposals([...votedProposals, proposalId]);
      setActiveId(null);
      console.log("[MESH-BRIDGE] ✅ Cryptographic signature committed to DAO ledger.");
      
    } catch (error) {
      console.error("[MESH-BRIDGE] 🚨 FATAL: Vote fracture detected.", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const calculateBarWidth = (forVotes: number, againstVotes: number) => {
    const total = forVotes + againstVotes;
    if (total === 0) return "50%";
    return `${(forVotes / total) * 100}%`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 animate-in fade-in duration-700">
      
      {/* 🛡️ VIEWPORT LOCK: max-w-sm aligns with S23 Ultra */}
      <div className="flex flex-col flex-1 w-full max-w-sm mx-auto h-screen relative">
        
        {/* 🧭 Sticky Header */}
        <div className="absolute top-0 left-0 right-0 z-10 px-4 py-4 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link 
                href="/dashboard" 
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-purple-400 hover:border-purple-500/50 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="font-mono text-lg font-bold text-slate-100 uppercase tracking-tighter leading-none">
                  DAO Governance
                </h1>
                <p className="text-[9px] font-mono text-purple-500 tracking-widest uppercase mt-1">
                  Decentralized Ledger
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-center w-8 h-8 rounded bg-purple-900/30 border border-purple-500/30">
              <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* 📊 Proposals Ledger (Scrollable Area) */}
        <div className="flex-1 overflow-y-auto px-4 pt-24 pb-12 custom-scrollbar space-y-4">
          
          {proposals.map((prop) => (
            <div 
              key={prop.id} 
              className={`bg-slate-900/80 border ${activeId === prop.id ? 'border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.1)]' : 'border-slate-800'} rounded-xl overflow-hidden transition-all duration-300`}
            >
              {/* Proposal Header (Click to expand) */}
              <div 
                onClick={() => prop.status === 'ACTIVE' && setActiveId(activeId === prop.id ? null : prop.id)}
                className={`p-4 ${prop.status === 'ACTIVE' ? 'cursor-pointer hover:bg-slate-800/50' : 'opacity-75 cursor-not-allowed'} transition-colors`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{prop.id}</span>
                  <div className={`px-2 py-0.5 rounded flex items-center gap-1.5 border ${
                    prop.status === 'ACTIVE' ? 'bg-emerald-950/50 border-emerald-900 text-emerald-400' :
                    'bg-slate-900 border-slate-700 text-slate-500'
                  }`}>
                    <span className="text-[8px] font-mono uppercase tracking-widest">{prop.status}</span>
                  </div>
                </div>
                
                <h2 className="text-sm font-mono font-bold text-slate-200 leading-snug">{prop.title}</h2>
                
                {/* Visual Consensus Bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-[9px] font-mono uppercase tracking-widest mb-1">
                    <span className="text-emerald-500">{prop.votesFor} FOR</span>
                    <span className="text-red-500">{prop.votesAgainst} AGAINST</span>
                  </div>
                  <div className="w-full h-1.5 bg-red-500/20 rounded-full overflow-hidden flex">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-1000" 
                      style={{ width: calculateBarWidth(prop.votesFor, prop.votesAgainst) }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Expandable Logic Forge (Voting Block) */}
              {activeId === prop.id && (
                <div className="border-t border-slate-800 bg-slate-950/50 p-4 animate-in slide-in-from-top-2 duration-300">
                  <p className="text-xs font-mono text-slate-400 leading-relaxed mb-4">
                    {prop.description}
                  </p>
                  
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Author Node</span>
                      <span className="text-xs font-mono text-blue-400">{prop.author}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Time Remaining</span>
                      <span className="text-xs font-mono text-amber-500">{prop.timeRemaining}</span>
                    </div>
                  </div>

                  {votedProposals.includes(prop.id) ? (
                    <div className="p-3 bg-emerald-950/20 border border-emerald-900/50 rounded-lg text-center">
                      <span className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-widest">
                        ✅ Signature Committed to Ledger
                      </span>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleVote(prop.id, "FOR")}
                        disabled={isSyncing}
                        className="flex-1 py-3 bg-emerald-950/30 hover:bg-emerald-900/50 border border-emerald-900/50 text-emerald-500 font-mono text-xs font-bold rounded-lg transition-all uppercase tracking-widest disabled:opacity-50"
                      >
                        Vote For
                      </button>
                      <button 
                        onClick={() => handleVote(prop.id, "AGAINST")}
                        disabled={isSyncing}
                        className="flex-1 py-3 bg-red-950/30 hover:bg-red-900/50 border border-red-900/50 text-red-500 font-mono text-xs font-bold rounded-lg transition-all uppercase tracking-widest disabled:opacity-50"
                      >
                        Against
                      </button>
                    </div>
                  )}
                  
                  {isSyncing && (
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></span>
                      <span className="text-[9px] font-mono text-purple-400 uppercase tracking-widest">Writing to blockchain...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          
        </div>
      </div>
    </div>
  );
}