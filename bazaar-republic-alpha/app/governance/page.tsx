'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext"; 

// 🛡️ MESH TYPING: Strict Ledger Alignment
interface Proposal {
  _id: string;
  title: string;
  domain: string;
  description: string;
  proposerUid: string;
  status: string;
  currentDeadline: string;
  tierMetrics: Record<string, { votesFor: number; votesAgainst: number }>;
  founderVeto?: { isVetoed: boolean; reason: string; };
}

// ⚡ LOCAL TYPE EXTENSION: Satisfies the compiler without breaking global context
interface GovernancePioneer {
  username: string;
  uid?: string;
  tier?: string;
  trustScore?: number;
  votingPower?: number;
}

export default function GovernanceSector() {
  const { pioneer } = useAuth(); 
  
  // 🛡️ SAFE TYPE CASTING FIREWALL
  const activePioneer = pioneer as GovernancePioneer;

  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [loadingLedger, setLoadingLedger] = useState(true);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [votedProposals, setVotedProposals] = useState<string[]>([]);

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const res = await fetch('/api/governance/proposals');
        const data = await res.json();
        if (data.status === 'SYNC_COMPLETE') {
          setProposals(data.proposals);
        }
      } catch (error) {
        console.error("[VIEWPORT FRACTURE] Ledger connection failed:", error);
      } finally {
        setLoadingLedger(false);
      }
    };
    fetchLedger();
  }, []);

  // 🛡️ THE AUTH FIREWALL: Hard-lock if session missing
  if (!activePioneer) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-slate-950 px-6 font-mono text-center">
        <div className="p-6 border-2 border-red-900 bg-red-950/30 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.2)]">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 className="text-red-400 font-bold tracking-widest uppercase mb-2">Adjudicator Lock</h2>
          <p className="text-xs text-red-300/70">No active MESH session detected. Please authenticate.</p>
        </div>
      </div>
    );
  }

  // 🛡️ PHASE 2: Bound to Guarded Local Types
  const handleVote = async (proposalId: string, type: "YES" | "NO") => {
    if (isSyncing || votedProposals.includes(proposalId)) return;
    
    const trust = activePioneer.trustScore ?? 0; // ⚡ FIXED: Safe numeric isolation
    const power = activePioneer.votingPower ?? 1; // ⚡ FIXED: Safe fallback if uncalculated

    // Security Gate: Floor Enforcement
    if (trust < 65) {
      alert(`⚠️ ADJUDICATOR LOCK: TrustScore ${trust} is below the 65 threshold. Voting rights suspended.`);
      return;
    }

    setIsSyncing(true);
    console.log(`[MESH-BRIDGE] 🟢 Initiating DAO Vote (${type}) for Node: ${activePioneer.uid || activePioneer.username}`);

    try {
      const response = await fetch('/api/governance/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pioneerUid: activePioneer.uid || activePioneer.username,
          proposalId: proposalId,
          voteChoice: type
        })
      });

      if (response.ok) {
        setProposals(prev => prev.map(p => {
          if (p._id === proposalId) {
            const tierKey = (activePioneer.tier || 'CITIZEN').toLowerCase(); // ⚡ FIXED: Null-safe string conversion
            const metrics = { ...p.tierMetrics };
            if (metrics[tierKey]) {
              metrics[tierKey] = {
                ...metrics[tierKey],
                votesFor: type === "YES" ? metrics[tierKey].votesFor + power : metrics[tierKey].votesFor,
                votesAgainst: type === "NO" ? metrics[tierKey].votesAgainst + power : metrics[tierKey].votesAgainst
              };
            }
            return { ...p, tierMetrics: metrics };
          }
          return p;
        }));
        
        setVotedProposals([...votedProposals, proposalId]);
        setActiveId(null);
        console.log("[MESH-BRIDGE] ✅ Cryptographic signature committed to DAO ledger.");
      } else {
        const errorData = await response.json();
        console.error("[MESH-BRIDGE] 🚨 Vote rejected by Ledger:", errorData.message);
      }
    } catch (error) {
      console.error("[MESH-BRIDGE] 🚨 FATAL: Vote fracture detected.", error);
    } finally {
      setIsSyncing(false);
    }
  };

  // 🛡️ UTILITY: Calculate total votes across all 5 tiers
  const getAggregatedVotes = (metrics: Proposal['tierMetrics']) => {
    if (!metrics) return { for: 0, against: 0 };
    return Object.values(metrics).reduce(
      (acc, tier) => ({
        for: acc.for + (tier.votesFor || 0),
        against: acc.against + (tier.votesAgainst || 0)
      }),
      { for: 0, against: 0 }
    );
  };

  const calculateBarWidth = (forVotes: number, againstVotes: number) => {
    const total = forVotes + againstVotes;
    if (total === 0) return "50%";
    return `${(forVotes / total) * 100}%`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 animate-in fade-in duration-700">
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
                  NODE: {pioneer.uid || pioneer.username} // TIER: {pioneer.tier}
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
          
          {loadingLedger ? (
             <div className="text-center text-slate-500 font-mono text-xs mt-10 animate-pulse">
               SYNCING LEDGER...
             </div>
          ) : proposals.length === 0 ? (
             <div className="text-center text-slate-500 font-mono text-xs mt-10 p-6 border border-slate-800 rounded">
               NO ACTIVE PAYLOADS
             </div>
          ) : (
            proposals.map((prop) => {
              const isVetoed = prop.founderVeto?.isVetoed || prop.status === 'CIRCUIT_BREAKER_ACTIVE';
              const { for: totalFor, against: totalAgainst } = getAggregatedVotes(prop.tierMetrics);
              const isSelectable = !isVetoed && (prop.status === 'ACTIVE' || prop.status === 'PENDING');

              return (
                <div 
                  key={prop._id} 
                  className={`bg-slate-900/80 border ${isVetoed ? 'border-red-900/50' : activeId === prop._id ? 'border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.1)]' : 'border-slate-800'} rounded-xl overflow-hidden transition-all duration-300`}
                >
                  {/* Proposal Header */}
                  <div 
                    onClick={() => isSelectable && setActiveId(activeId === prop._id ? null : prop._id)}
                    className={`p-4 ${isSelectable ? 'cursor-pointer hover:bg-slate-800/50' : 'opacity-75 cursor-not-allowed'} transition-colors`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                        ID: {prop._id.slice(-6)}
                      </span>
                      <div className={`px-2 py-0.5 rounded flex items-center gap-1.5 border ${
                        isVetoed ? 'bg-red-950/50 border-red-900 text-red-500' :
                        isSelectable ? 'bg-emerald-950/50 border-emerald-900 text-emerald-400' :
                        'bg-slate-900 border-slate-700 text-slate-500'
                      }`}>
                        <span className="text-[8px] font-mono uppercase tracking-widest">
                          {isVetoed ? 'VETOED' : prop.status}
                        </span>
                      </div>
                    </div>
                    
                    <h2 className={`text-sm font-mono font-bold leading-snug ${isVetoed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                      {prop.title}
                    </h2>
                    
                    {/* Visual Consensus Bar */}
                    <div className={`mt-3 ${isVetoed ? 'opacity-30' : ''}`}>
                      <div className="flex justify-between text-[9px] font-mono uppercase tracking-widest mb-1">
                        <span className="text-emerald-500">{totalFor.toLocaleString()} FOR</span>
                        <span className="text-red-500">{totalAgainst.toLocaleString()} AGAINST</span>
                      </div>
                      <div className="w-full h-1.5 bg-red-500/20 rounded-full overflow-hidden flex">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-1000" 
                          style={{ width: calculateBarWidth(totalFor, totalAgainst) }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Voting Block */}
                  {activeId === prop._id && !isVetoed && (
                    <div className="border-t border-slate-800 bg-slate-950/50 p-4 animate-in slide-in-from-top-2 duration-300">
                      <p className="text-xs font-mono text-slate-400 leading-relaxed mb-4">
                        {prop.description}
                      </p>
                      
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Author Node</span>
                          <span className="text-xs font-mono text-blue-400">{prop.proposerUid}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">TTL Expiry</span>
                          <span className="text-xs font-mono text-amber-500">{new Date(prop.currentDeadline).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {votedProposals.includes(prop._id) ? (
                        <div className="p-3 bg-emerald-950/20 border border-emerald-900/50 rounded-lg text-center">
                          <span className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-widest">
                            ✅ Signature Committed to Ledger
                          </span>
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <button 
                            onClick={() => handleVote(prop._id, "YES")}
                            disabled={isSyncing}
                            className="flex-1 py-3 bg-emerald-950/30 hover:bg-emerald-900/50 border border-emerald-900/50 text-emerald-500 font-mono text-xs font-bold rounded-lg transition-all uppercase tracking-widest disabled:opacity-50"
                          >
                            Vote For
                          </button>
                          <button 
                            onClick={() => handleVote(prop._id, "NO")}
                            disabled={isSyncing}
                            className="flex-1 py-3 bg-red-950/30 hover:bg-red-900/50 border border-red-900/50 text-red-500 font-mono text-xs font-bold rounded-lg transition-all uppercase tracking-widest disabled:opacity-50"
                          >
                            Against
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
          
        </div>
      </div>
    </div>
  );
}