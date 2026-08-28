'use client';

import { useState } from 'react';

// 🛡️ MOCK DATA TYPES
interface PioneerTelemetry {
  tier: string;
  trustScore: number;
  stakedPi: number;
  votingPower: number;
}

interface ProposalData {
  id: string;
  title: string;
  domain: string;
  description: string;
  expiresAt: string;
  status?: string;
  founderVeto?: {
    isVetoed: boolean;
    reason: string;
  };
}

export default function BallotCard({ proposal, telemetry }: { proposal: ProposalData, telemetry: PioneerTelemetry }) {
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false); 

  // 🛡️ ADJUDICATOR FLOOR LOGIC
  const isEligible = telemetry.trustScore >= 65;
  const isEmergency = proposal.domain === 'STAT_OVERRIDE';
  
  // ⚡ THE VETO LOCK
  const isVetoed = proposal.founderVeto?.isVetoed || proposal.status === 'CIRCUIT_BREAKER_ACTIVE';

  const handleVote = async (vote: 'YES' | 'NO') => {
    if (!isEligible || isVoting || isVetoed) return; // Hard-stop if vetoed
    
    setIsVoting(true);
    console.log(`[MESH-LOG] Initiating ${vote} strike for payload ${proposal.id}...`);

    try {
      const response = await fetch('/api/governance/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pioneerUid: "NODE-001-FOUNDER",
          proposalId: proposal.id,
          voteChoice: vote
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log(`[MESH-LOG] ✅ Ballot Encrypted:`, data);
        setHasVoted(true);
      } else {
        console.error(`[MESH FRACTURE] Ledger rejected ballot:`, data.message);
      }
    } catch (error) {
      console.error("[MESH FRACTURE] Network timeout or crash:", error);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className={`p-6 border-2 rounded-lg bg-gray-900 text-gray-100 shadow-[0_0_15px_rgba(30,58,138,0.2)] ${isVetoed ? 'border-red-700 opacity-90' : isEmergency ? 'border-red-600' : 'border-blue-500'}`}>
      
      {/* 🚨 CIRCUIT BREAKER BANNER */}
      {isVetoed && (
        <div className="bg-red-900 text-red-100 p-2 text-center font-bold text-xs font-mono mb-4 border border-red-500 rounded tracking-widest animate-pulse">
          🚨 MESH LOCKDOWN: CIRCUIT BREAKER ACTIVE
        </div>
      )}

      {/* HEADER: Domain & Title */}
      <div className="flex justify-between items-start mb-4 border-b border-gray-700 pb-2">
        <div>
          <span className={`text-xs font-bold px-2 py-1 rounded tracking-widest ${isVetoed ? 'bg-red-800 text-gray-300' : isEmergency ? 'bg-red-600 text-white' : 'bg-blue-900 text-blue-300'}`}>
            {proposal.domain || 'IMPLEMENTATION'}
          </span>
          <h2 className={`text-xl font-bold mt-2 font-mono ${isVetoed ? 'text-gray-500 line-through' : ''}`}>
            {proposal.title}
          </h2>
        </div>
        <div className="text-right text-sm text-gray-400 font-mono">
          <p>TTL EXPIRY:</p>
          <p className={isVetoed ? 'text-gray-600' : 'text-red-400'}>{proposal.expiresAt}</p>
        </div>
      </div>

      {/* PAYLOAD / DESCRIPTION */}
      <div className={`mb-6 p-4 rounded text-sm font-mono border ${isVetoed ? 'bg-black text-gray-600 border-red-900' : 'bg-gray-800 text-gray-300 border-gray-700'}`}>
        <p>{proposal.description}</p>
      </div>

      {/* PIONEER TELEMETRY HUD */}
      <div className={`mb-6 grid grid-cols-4 gap-4 text-center border-t border-b py-4 ${isVetoed ? 'border-red-900 opacity-50' : 'border-gray-700'}`}>
        <div>
          <p className="text-xs text-gray-500">TIER</p>
          <p className="font-bold text-blue-400">{telemetry.tier}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">TRUST SCORE</p>
          <p className={`font-bold ${telemetry.trustScore >= 65 ? 'text-green-400' : 'text-red-500'}`}>
            {telemetry.trustScore} / 100
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">STAKED (Pi)</p>
          <p className="font-bold text-purple-400">{telemetry.stakedPi}</p>
        </div>
        <div className={`rounded border pb-1 ${isVetoed ? 'bg-black border-red-900' : 'bg-gray-800 border-gray-700'}`}>
          <p className="text-xs text-gray-500 pt-1">VOTING POWER</p>
          <p className="font-bold text-yellow-400 text-lg">{isEligible && !isVetoed ? telemetry.votingPower.toLocaleString() : '0'}</p>
        </div>
      </div>

      {/* ACTION MATRIX */}
      {isVetoed ? (
        <div className="w-full text-center p-3 bg-red-950 border-2 border-red-700 text-red-200 rounded font-mono text-sm tracking-wide">
          ⛔ PERMANENT LOCK: {proposal.founderVeto?.reason || 'Executive Override: E-Network Security Threat'}
        </div>
      ) : !isEligible ? (
        <div className="w-full text-center p-3 bg-red-900/50 border border-red-500 text-red-200 rounded font-mono text-sm">
          ⚠️ ADJUDICATOR LOCK: TrustScore below 65. Voting rights suspended.
        </div>
      ) : hasVoted ? (
        <div className="w-full text-center p-3 bg-green-900/50 border border-green-500 text-green-200 rounded font-mono text-sm">
          ✅ ENCRYPTED: Ballot registered in the {telemetry.tier} Bucket.
        </div>
      ) : (
        <div className="flex space-x-4">
          <button 
            onClick={() => handleVote('YES')}
            disabled={isVoting}
            className={`flex-1 font-bold py-3 rounded transition-colors font-mono ${isVoting ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-green-800 hover:bg-green-600 text-white border border-green-500'}`}
          >
            {isVoting ? 'SYNCING...' : 'AUTHORIZE (YES)'}
          </button>
          <button 
            onClick={() => handleVote('NO')}
            disabled={isVoting}
            className={`flex-1 font-bold py-3 rounded transition-colors font-mono ${isVoting ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-red-800 hover:bg-red-600 text-white border border-red-500'}`}
          >
            {isVoting ? 'SYNCING...' : 'REJECT (NO)'}
          </button>
        </div>
      )}

    </div>
  );
}