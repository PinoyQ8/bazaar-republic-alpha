"use client";

import React, { useState } from "react";
import { castVote } from "@/app/actions/proposalActions";
import { CheckCircle, XCircle, MinusCircle, Loader2, ShieldAlert } from "lucide-react";

export default function ProposalCard({ data }: { data: any }) {
  const [isVoting, setIsVoting] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // 🛡️ MESH HARDCODE: We use your viewport ID for testing. 
  // In production, this pulls dynamically from your AuthContext.
  const pioneerId = "PinoyQ8_Dev";

  const handleVote = async (voteType: 'FOR' | 'AGAINST' | 'ABSTAIN') => {
    setIsVoting(true);
    setFeedback(null);

    try {
      const res = await castVote(data.proposalId, pioneerId, voteType);
      setFeedback({ message: res.message, type: res.success ? 'success' : 'error' });
    } catch (err: any) {
      setFeedback({ message: `FRACTURE: ${err.message}`, type: 'error' });
    } finally {
      setIsVoting(false);
    }
  };

  // 🧮 Live Quorum Math
  const totalCast = data.totalVotesFor + data.totalVotesAgainst;
  const quorumPercent = Math.min((totalCast / data.quorumTarget) * 100, 100);
  const forPercent = totalCast > 0 ? (data.totalVotesFor / totalCast) * 100 : 0;

  return (
    <div className="border border-neutral-800 bg-neutral-900/40 backdrop-blur-sm rounded-lg p-5 shadow-[0_0_15px_rgba(0,0,0,0.5)] flex flex-col gap-4">
      
      {/* 📜 Header Info */}
      <div>
        <div className="flex justify-between items-start mb-2">
          <h2 className="font-mono text-sm font-bold text-blue-400 leading-tight">{data.title}</h2>
          <span className="px-2 py-1 bg-blue-950/30 border border-blue-900 text-blue-500 font-mono text-[8px] tracking-widest rounded uppercase">
            {data.status}
          </span>
        </div>
        <p className="font-mono text-[10px] text-neutral-400 leading-relaxed">{data.description}</p>
      </div>

      {/* 📊 Telemetry Bars */}
      <div className="flex flex-col gap-3 p-3 bg-neutral-950/50 border border-neutral-900 rounded">
        <div>
          <div className="flex justify-between font-mono text-[9px] text-neutral-500 uppercase mb-1">
            <span>Quorum Target: {data.quorumTarget} VP</span>
            <span>{quorumPercent.toFixed(1)}% Reached</span>
          </div>
          <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full transition-all duration-500" style={{ width: `${quorumPercent}%` }}></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between font-mono text-[9px] text-neutral-500 uppercase mb-1">
            <span className="text-emerald-500">FOR: {data.totalVotesFor}</span>
            <span className="text-red-500">AGAINST: {data.totalVotesAgainst}</span>
          </div>
          <div className="w-full bg-red-900/30 h-1.5 rounded-full overflow-hidden flex">
            <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${forPercent}%` }}></div>
          </div>
        </div>
      </div>

      {/* ⚖️ Action Matrix */}
      <div className="grid grid-cols-3 gap-2 mt-2">
        <button onClick={() => handleVote('FOR')} disabled={isVoting} className="flex flex-col items-center justify-center py-2 bg-emerald-950/20 border border-emerald-900 rounded hover:bg-emerald-900/40 text-emerald-500 disabled:opacity-50 transition-all">
          <CheckCircle size={16} className="mb-1" />
          <span className="font-mono text-[9px] tracking-widest uppercase">Approve</span>
        </button>
        <button onClick={() => handleVote('AGAINST')} disabled={isVoting} className="flex flex-col items-center justify-center py-2 bg-red-950/20 border border-red-900 rounded hover:bg-red-900/40 text-red-500 disabled:opacity-50 transition-all">
          <XCircle size={16} className="mb-1" />
          <span className="font-mono text-[9px] tracking-widest uppercase">Reject</span>
        </button>
        <button onClick={() => handleVote('ABSTAIN')} disabled={isVoting} className="flex flex-col items-center justify-center py-2 bg-neutral-900/50 border border-neutral-800 rounded hover:bg-neutral-800 text-neutral-400 disabled:opacity-50 transition-all">
          <MinusCircle size={16} className="mb-1" />
          <span className="font-mono text-[9px] tracking-widest uppercase">Abstain</span>
        </button>
      </div>

      {/* 📡 Feedback Console */}
      {feedback && (
        <div className={`mt-2 p-2 rounded flex items-start gap-2 border ${feedback.type === 'success' ? 'bg-emerald-950/20 border-emerald-900 text-emerald-400' : 'bg-red-950/20 border-red-900 text-red-400'}`}>
          <ShieldAlert size={14} className="mt-0.5 shrink-0" />
          <span className="font-mono text-[9px] tracking-wide uppercase leading-tight">{feedback.message}</span>
        </div>
      )}
      
      {isVoting && (
        <div className="flex items-center justify-center gap-2 mt-2 text-blue-500 font-mono text-[10px] uppercase tracking-widest animate-pulse">
          <Loader2 size={12} className="animate-spin" /> Adjudicating...
        </div>
      )}

    </div>
  );
}