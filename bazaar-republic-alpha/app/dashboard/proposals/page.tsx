// 🛡️ THE PROPOSAL MATRIX (Frontend UI: Two-Stage Filter Active)
"use client";

import { useEffect, useState } from "react";

// Maps E-Network roles to schema keys for localized UI logic
const TIER_MAP: Record<string, string> = {
  'FOUNDER': 'founder',
  'ELDER': 'circleOfElders',
  'MERCHANT': 'merchant',
  'PROVIDER': 'serviceProvider',
  'CITIZEN': 'citizen'
};

export default function ProposalsMatrix() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [votingOn, setVotingOn] = useState<string | null>(null);

  // Hard-coded local identity for Alpha testing
  const TEST_UID = "GENESIS-ANCHOR";
  const TEST_ROLE = "FOUNDER";
  const userTierKey = TIER_MAP[TEST_ROLE];

  const fetchLedger = async () => {
    try {
      const res = await fetch('/api/governance/get-proposals');
      const data = await res.json();
      if (data.success) {
        setProposals(data.proposals);
      }
    } catch (error) {
      console.error("MESH UI Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  const handleVote = async (proposalId: string, decision: 'APPROVE' | 'REJECT') => {
    setVotingOn(proposalId);
    try {
      const res = await fetch('/api/governance/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-mesh-pioneer-uid': TEST_UID,
          'x-mesh-pioneer-role': TEST_ROLE
        },
        body: JSON.stringify({ proposalId, decision })
      });
      
      const data = await res.json();
      
      if (data.success) {
        console.log(`[MESH-GOVERNANCE] Vote mathematically bound: ${decision}`);
        await fetchLedger(); // Re-sync the ledger to update UI state
      } else {
        console.error(`[ADJUDICATOR] Vote rejected: ${data.error}`);
        alert(`Vote Blocked by Adjudicator: ${data.error}`);
      }
    } catch (error) {
      console.error("Voting Engine Panic:", error);
    } finally {
      setVotingOn(null);
    }
  };

  if (isLoading) {
    return <div className="text-green-500 font-mono text-sm animate-pulse">[MESH-SCAN] Syncing Ledger...</div>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6 font-mono">
      <div className="border-b border-green-500/30 pb-2 mb-4 flex justify-between items-end">
        <div>
          <h2 className="text-xl text-green-400 font-bold tracking-widest">ACTIVE PROPOSALS</h2>
          <p className="text-xs text-gray-400">14+14 Two-Stage Filter | 4/5 Consensus Required</p>
        </div>
        <div className="text-xs text-green-500/50">NODE: {TEST_ROLE}</div>
      </div>

      {proposals.length === 0 ? (
        <div className="p-4 bg-black/40 border border-gray-800 rounded text-gray-500 text-sm">
          No active proposals detected in the E-Network.
        </div>
      ) : (
        proposals.map((prop) => {
          const hasVoted = prop.votedUids?.includes(TEST_UID);
          const isProcessing = votingOn === prop._id;
          
          // 🛡️ UI LOGIC GATE: Is the Pioneer authorized to vote right now?
          const isAuthorized = prop.currentStage === 'REPUBLIC_FLOOR' || prop.proposerTier === userTierKey;
          
          // Calculate days remaining
          const daysLeft = Math.max(0, Math.ceil((new Date(prop.currentDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

          return (
            <div 
              key={prop._id} 
              className={`rounded-lg p-5 transition-all duration-300 ${
                isAuthorized 
                  ? "bg-black/60 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.05)] hover:border-green-500/50" 
                  : "bg-black/30 border border-gray-800 opacity-70 grayscale-50"
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className={`text-lg font-semibold uppercase ${isAuthorized ? "text-white" : "text-gray-400"}`}>
                    {prop.title}
                  </h3>
                  <div className="flex space-x-2 mt-1">
                    <span className={`text-[9px] px-2 py-0.5 rounded border ${
                      prop.currentStage === 'REPUBLIC_FLOOR' 
                        ? 'bg-blue-900/20 text-blue-400 border-blue-900/50' 
                        : 'bg-orange-900/20 text-orange-400 border-orange-900/50'
                    }`}>
                      {prop.currentStage.replace('_', ' ')}
                    </span>
                    <span className="text-[9px] bg-gray-900/50 text-gray-400 px-2 py-0.5 rounded border border-gray-800">
                      T-MINUS: {daysLeft} DAYS
                    </span>
                  </div>
                </div>
                <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-1 rounded border border-green-500/30">
                  TARGET: {prop.targetContract}
                </span>
              </div>
              
              <p className={`text-sm mb-4 leading-relaxed ${isAuthorized ? "text-gray-300" : "text-gray-500"}`}>
                {prop.description}
              </p>
              
              <div className="flex justify-between items-center border-t border-gray-800 pt-4 mt-2">
                <div className="text-[10px] text-gray-500">
                  ORIGIN TIER: <span className="text-gray-400 uppercase">{prop.proposerTier}</span>
                </div>
                
                {/* Voting Terminal */}
                <div className="flex space-x-3">
                  {!isAuthorized ? (
                    <span className="px-4 py-1.5 text-[10px] bg-red-900/10 text-red-500/50 border border-red-900/30 rounded uppercase tracking-wider">
                      [ LOCKED IN PHASE 1 ]
                    </span>
                  ) : hasVoted ? (
                    <span className="px-4 py-1.5 text-[10px] bg-gray-900/50 text-gray-500 border border-gray-800 rounded uppercase tracking-wider">
                      [ VOTE CAST ]
                    </span>
                  ) : (
                    <>
                      <button 
                        onClick={() => handleVote(prop._id, 'REJECT')}
                        disabled={isProcessing}
                        className="px-4 py-1.5 text-xs bg-red-900/30 text-red-400 border border-red-900/50 hover:bg-red-900/50 rounded transition-all disabled:opacity-50"
                      >
                        {isProcessing ? 'SYNCING...' : 'REJECT'}
                      </button>
                      <button 
                        onClick={() => handleVote(prop._id, 'APPROVE')}
                        disabled={isProcessing}
                        className="px-4 py-1.5 text-xs bg-green-900/30 text-green-400 border border-green-900/50 hover:bg-green-900/50 rounded transition-all disabled:opacity-50"
                      >
                        {isProcessing ? 'SYNCING...' : 'APPROVE'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}