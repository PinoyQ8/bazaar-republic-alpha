// Location: /app/dashboard/proposals/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PioneerAuthGate from "@/app/components/PioneerAuthGate";

// Mapped directly to /app/models/mesh-schema.ts
interface MESHProposal {
  proposalId: string;
  title: string;
  rawText: string;
  tierOrigin: string;
  status: string;
  startTime: string;
  endTime: string;
  yesVP: number;
  noVP: number;
  hasVoted?: boolean; // Injected by backend if current UID already voted
}

export default function ProposalsMatrix() {
  const router = useRouter();
  const [session, setSession] = useState<{ username: string; uid: string } | null>(null);
  const [proposals, setProposals] = useState<MESHProposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [votingOn, setVotingOn] = useState<string | null>(null);

  useEffect(() => {
    const storedAuth = localStorage.getItem("pi_auth_user");
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        setSession(parsed);
        fetchLedger(parsed.uid);
      } catch (e) {
        console.error("[MESH] Failed to parse local auth", e);
        setIsLoading(false);
      }
    }
  }, []);

  const fetchLedger = async (uid: string) => {
    try {
      // 🛡️ API will pull active proposals and flag if this UID voted
      const res = await fetch('/api/mesh-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'FETCH_ACTIVE', uid })
      });
      const data = await res.json();
      if (data.proposals) setProposals(data.proposals);
    } catch (error) {
      console.error("[MESH] Ledger Sync Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (proposalId: string, voteDirection: 'YES' | 'NO') => {
    if (!session?.uid) return;
    setVotingOn(proposalId);
    
    try {
      const res = await fetch('/api/mesh-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'CAST_VOTE',
          uid: session.uid, 
          proposalId, 
          voteDirection 
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        console.log(`[MESH] VP Bound: ${voteDirection}`);
        await fetchLedger(session.uid); // Resync UI with new VP math
      } else {
        alert(`[ADJUDICATOR HALT]: ${data.error}`);
      }
    } catch (error) {
      console.error("[MESH] Voting Engine Panic:", error);
    } finally {
      setVotingOn(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-amber-500 font-mono flex flex-col items-center justify-center space-y-4">
        <div className="animate-pulse text-2xl font-bold tracking-widest">SYNCING LEDGER...</div>
        <div className="text-xs text-neutral-500">Retrieving v25.2.2 Vote Pool</div>
      </div>
    );
  }

  return (
    <PioneerAuthGate>
      {/* 🛡️ Linter Fix: Swapped flex-grow for grow if it existed on the main wrapper, but focusing on the target line below */}
      <div className="w-full max-w-full overflow-x-hidden space-y-4 p-2 min-h-screen bg-black text-neutral-300 font-mono flex flex-col">
        
        {/* HEADER BLOCK */}
        <header className="border-b border-amber-900/60 pb-3 space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold tracking-tight text-amber-500 uppercase">
              The Vote Pool
            </h1>
            <button 
              onClick={() => router.push('/dashboard')}
              className="text-xs px-2 py-1 bg-neutral-900 border border-neutral-700 rounded text-neutral-400 hover:text-amber-400"
            >
              DASHBOARD
            </button>
          </div>
          <div className="flex justify-between text-[10px] text-neutral-500 uppercase tracking-widest">
            <span>80% VP Supermajority Required</span>
            <span className="text-amber-600">ID: {session?.uid.slice(0, 8)}...</span>
          </div>
        </header>

        {/* PROPOSAL MATRIX */}
        {/* 🛡️ Linter Fix Applied Here: flex-grow replaced with grow */}
        <div className="space-y-4 grow">
          {proposals.length === 0 ? (
            <div className="p-4 bg-neutral-900/60 border border-amber-900/30 rounded text-neutral-500 text-xs text-center">
              No active logic drafts in the E-Network.
            </div>
          ) : (
            proposals.map((prop) => {
              const isProcessing = votingOn === prop.proposalId;
              const totalVP = prop.yesVP + prop.noVP;
              const approvalRate = totalVP > 0 ? (prop.yesVP / totalVP) * 100 : 0;
              
              // Timer calculation based on immutable ledger endTime
              const hoursLeft = Math.max(0, Math.floor((new Date(prop.endTime).getTime() - Date.now()) / (1000 * 60 * 60)));

              return (
                <div key={prop.proposalId} className="p-3 bg-neutral-900/60 border border-amber-900/50 rounded-lg space-y-3">
                  
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-amber-400 uppercase">{prop.title}</h3>
                      <div className="flex space-x-2 text-[9px]">
                        <span className="px-1.5 py-0.5 bg-neutral-800 text-neutral-400 rounded border border-neutral-700">
                          ORIGIN: {prop.tierOrigin}
                        </span>
                        <span className="px-1.5 py-0.5 bg-blue-900/30 text-blue-400 rounded border border-blue-900/50">
                          T-MINUS: {hoursLeft}H
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-400 line-clamp-3 bg-black/40 p-2 rounded border border-neutral-800">
                    {prop.rawText}
                  </p>

                  {/* VP Progress Shield */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] text-neutral-500">
                      <span>Approval: {approvalRate.toFixed(1)}%</span>
                      <span>Total VP: {totalVP.toFixed(2)}</span>
                    </div>
                    <div className="h-1.5 w-full bg-neutral-800 rounded overflow-hidden flex">
                      <div className="h-full bg-emerald-500" style={{ width: `${approvalRate}%` }}></div>
                      <div className="h-full bg-red-500" style={{ width: `${100 - approvalRate}%` }}></div>
                    </div>
                    {/* Hard-coded 80% Supermajority Line */}
                    <div className="relative w-full h-2">
                      <div className="absolute top-0 w-0.5 h-2 bg-amber-500" style={{ left: '80%' }}></div>
                    </div>
                  </div>

                  {/* Adjudicator Action Gate */}
                  <div className="pt-2 border-t border-amber-900/40">
                    {prop.hasVoted ? (
                      <div className="w-full text-center py-2 text-xs font-bold bg-neutral-800/50 text-neutral-500 rounded border border-neutral-800 uppercase tracking-widest">
                        VP Locked in Ledger
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => handleVote(prop.proposalId, 'NO')}
                          disabled={isProcessing}
                          className="py-2 text-xs bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded font-bold transition-all disabled:opacity-50 tracking-wider"
                        >
                          {isProcessing ? 'SYNCING...' : 'REJECT'}
                        </button>
                        <button 
                          onClick={() => handleVote(prop.proposalId, 'YES')}
                          disabled={isProcessing}
                          className="py-2 text-xs bg-emerald-900/20 hover:bg-emerald-900/40 text-emerald-400 border border-emerald-900/50 rounded font-bold transition-all disabled:opacity-50 tracking-wider"
                        >
                          {isProcessing ? 'SYNCING...' : 'APPROVE'}
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              );
            })
          )}
        </div>
      </div>
    </PioneerAuthGate>
  );
}