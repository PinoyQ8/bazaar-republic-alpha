// Location: app/dashboard/proposals/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PioneerAuthGate from "@/app/components/PioneerAuthGate"; // 🛡️ MESH PERIMETER SHIELD
import { getActiveProposals, castVote, seedGenesisProposal } from "@/app/actions/proposalActions";

interface MESHProposal {
  proposalId: string;
  title: string;
  description: string;
  proposerId: string;
  status: string;
  createdAt: number;
  expiresAt: number;
  totalVotesFor: number;
  totalVotesAgainst: number;
  quorumTarget: number;
  voters: { pioneerId: string }[];
}

export default function ProposalsMatrix() {
  const router = useRouter();
  const [session, setSession] = useState<{ username: string; uid: string } | null>(null);
  const [proposals, setProposals] = useState<MESHProposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [votingOn, setVotingOn] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    const storedAuth = localStorage.getItem("pi_auth_user");
    const authData = storedAuth ? JSON.parse(storedAuth) : { username: "PinoyQ8_Dev", uid: "PinoyQ8_Dev" };
    
    setSession(authData);
    fetchLedger(authData.uid);
  }, []);

  const fetchLedger = async (currentUid: string) => {
    try {
      const activeProposals = await getActiveProposals();
      setProposals(activeProposals);
    } catch (error) {
      console.error("[MESH] Ledger Sync Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (proposalId: string, voteDirection: 'FOR' | 'AGAINST') => {
    if (!session?.uid) return;
    setVotingOn(proposalId);
    setStatusMsg(null);
    
    try {
      const res = await castVote(proposalId, session.uid, voteDirection);
      
      if (res.success) {
        setStatusMsg(`✅ ${res.message}`);
        await fetchLedger(session.uid);
      } else {
        setStatusMsg(`🚨 ${res.message}`);
      }
    } catch (error) {
      console.error("[MESH] Voting Engine Panic:", error);
      setStatusMsg("🚨 System panic during vote execution.");
    } finally {
      setVotingOn(null);
    }
  };

  const handleSeed = async () => {
    setIsLoading(true);
    setStatusMsg("Initializing Genesis Motion...");
    const res = await seedGenesisProposal();
    if (res?.success) {
      setStatusMsg("✅ Genesis Motion re-seeded with fresh temporal window.");
    }
    await fetchLedger(session?.uid || "");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-amber-500 font-mono flex flex-col items-center justify-center space-y-4 pb-24">
        <div className="animate-pulse text-2xl font-bold tracking-widest">SYNCING LEDGER...</div>
        <div className="text-xs text-neutral-500">Retrieving 26.1.0 Vote Pool</div>
      </div>
    );
  }

  return (
    <PioneerAuthGate>
      <div className="w-full max-w-full overflow-x-hidden space-y-4 p-2 min-h-screen bg-black text-neutral-300 font-mono flex flex-col pb-24">
        
        {/* HEADER BLOCK WITH RE-SEED CONTROL */}
        <header className="border-b border-amber-900/60 pb-3 space-y-2 mt-2">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold tracking-tight text-amber-500 uppercase">
              The Vote Pool
            </h1>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleSeed}
                className="text-[10px] px-2 py-1 bg-amber-950/80 hover:bg-amber-900/90 border border-amber-700 text-amber-400 font-bold uppercase rounded tracking-wider transition-colors shadow-[0_0_10px_rgba(217,119,6,0.2)]"
              >
                ⚡ RE-SEED GENESIS
              </button>
              <button 
                onClick={() => router.push('/dashboard')}
                className="text-xs px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded text-neutral-400 hover:text-amber-400 transition-colors"
              >
                DASHBOARD
              </button>
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-neutral-500 uppercase tracking-widest">
            <span>80% VP Supermajority Required</span>
            <span className="text-amber-600">ID: {session?.uid.slice(0, 12)}...</span>
          </div>
        </header>

        {/* TELEMETRY FEEDBACK BANNER */}
        {statusMsg && (
          <div className="p-2.5 bg-neutral-900 border border-amber-600/60 text-amber-400 text-xs rounded font-mono">
            {statusMsg}
          </div>
        )}

        {/* PROPOSAL MATRIX */}
        <div className="space-y-4 grow">
          {proposals.length === 0 ? (
            <div className="p-6 bg-neutral-900/60 border border-amber-900/30 rounded-lg flex flex-col items-center justify-center text-center space-y-4 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
              <span className="text-neutral-500 text-xs uppercase tracking-widest">No active logic drafts in the E-Network.</span>
              
              <button 
                onClick={handleSeed}
                className="px-4 py-2 border border-amber-900 bg-amber-950/30 text-amber-500 text-[10px] uppercase tracking-widest rounded hover:bg-amber-900/50 transition-all shadow-[0_0_10px_rgba(217,119,6,0.1)]"
              >
                Initialize Genesis Motion
              </button>
            </div>
          ) : (
            proposals.map((prop) => {
              const isProcessing = votingOn === prop.proposalId;
              const totalVP = prop.totalVotesFor + prop.totalVotesAgainst;
              const approvalRate = totalVP > 0 ? (prop.totalVotesFor / totalVP) * 100 : 0;
              const hoursLeft = Math.max(0, Math.floor((prop.expiresAt - Date.now()) / (1000 * 60 * 60)));
              const hasVoted = prop.voters?.some(v => v.pioneerId === session?.uid);

              return (
                <div key={prop.proposalId} className="p-3 bg-neutral-900/60 border border-amber-900/50 rounded-lg space-y-3 shadow-[0_0_10px_rgba(0,0,0,0.3)]">
                  
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-amber-400 uppercase leading-tight">{prop.title}</h3>
                      <div className="flex space-x-2 text-[9px] mt-1">
                        <span className="px-1.5 py-0.5 bg-neutral-800 text-neutral-400 rounded border border-neutral-700">
                          ORIGIN: {prop.proposerId}
                        </span>
                        <span className="px-1.5 py-0.5 bg-blue-900/30 text-blue-400 rounded border border-blue-900/50">
                          T-MINUS: {hoursLeft}H
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-400 line-clamp-3 bg-black/40 p-2 rounded border border-neutral-800 leading-relaxed">
                    {prop.description}
                  </p>

                  {/* VP Progress Shield */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] text-neutral-500 uppercase tracking-widest">
                      <span>Approval: {approvalRate.toFixed(1)}%</span>
                      <span>Total VP: {totalVP.toFixed(2)} / {prop.quorumTarget}</span>
                    </div>
                    <div className="h-1.5 w-full bg-neutral-800 rounded overflow-hidden flex relative">
                      <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${approvalRate}%` }}></div>
                      <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${100 - approvalRate}%` }}></div>
                      {/* Hard-coded 80% Supermajority Line */}
                      <div className="absolute top-0 bottom-0 w-0.5 bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.8)]" style={{ left: '80%' }}></div>
                    </div>
                  </div>

                  {/* Adjudicator Action Gate */}
                  <div className="pt-2 border-t border-amber-900/40">
                    {hasVoted ? (
                      <div className="w-full text-center py-2 text-xs font-bold bg-neutral-800/50 text-neutral-500 rounded border border-neutral-800 uppercase tracking-widest">
                        VP Locked in Ledger
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => handleVote(prop.proposalId, 'AGAINST')}
                          disabled={isProcessing}
                          className="py-2 text-xs bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded font-bold transition-all disabled:opacity-50 tracking-wider flex items-center justify-center"
                        >
                          {isProcessing ? 'SYNCING...' : 'REJECT'}
                        </button>
                        <button 
                          onClick={() => handleVote(prop.proposalId, 'FOR')}
                          disabled={isProcessing}
                          className="py-2 text-xs bg-emerald-950/30 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-900/50 rounded font-bold transition-all disabled:opacity-50 tracking-wider flex items-center justify-center"
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