// PROJECT BAZAAR DAO - PROTOCOL 26.1
// PAGE: ADJUDICATOR TIMELOCK REVIEW DASHBOARD

"use client";

import React, { useState } from 'react';

export default function AdjudicatorPage() {
  const [voteCast, setVoteCast] = useState<boolean>(false);
  const [consensusReached, setConsensusReached] = useState<boolean>(false);
  const [walletBlacklisted, setWalletBlacklisted] = useState<boolean>(false);

  // Mock Anomaly Data
  const anomaly = {
    id: "TX-9921-ANOMALY",
    amount: "8,500 Pi",
    walletAge: "2 Days",
    velocity: "High Velocity Transfer",
    targetGateway: "Pi Mainnet Bridge",
    timeRemaining: "23h 12m 45s"
  };

  const handleRevertVote = () => {
    setVoteCast(true);
    setConsensusReached(true);
    setWalletBlacklisted(true);
  };

  const handleApproveVote = () => {
    setVoteCast(true);
    setConsensusReached(true);
    setWalletBlacklisted(false);
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-2">
      <div className="w-[384px] p-4 bg-black text-white font-mono rounded-xl border border-red-900/50 shadow-2xl space-y-4">
        
        {/* Header Alert Badge */}
        <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
          <span className="text-[10px] tracking-wider uppercase text-red-400 font-bold">⚠️ Anomaly Detected</span>
          <span className="px-2 py-0.5 text-[10px] bg-red-950 border border-red-800 text-red-400 rounded">
            Timelock Active
          </span>
        </div>

        {/* Timelock Countdown Box */}
        <div className="bg-zinc-900 p-3 rounded border border-zinc-800 space-y-2 text-xs">
          <div className="flex justify-between"><span className="opacity-60">Anomaly ID:</span><span className="text-zinc-300">{anomaly.id}</span></div>
          <div className="flex justify-between"><span className="opacity-60">Locked Value:</span><span className="font-bold text-red-400">{anomaly.amount}</span></div>
          <div className="flex justify-between"><span className="opacity-60">Time Window:</span><span className="text-amber-400">{anomaly.timeRemaining}</span></div>
        </div>

        {/* On-Chain Metrics Inspection */}
        <div className="bg-zinc-900/60 p-3 rounded border border-zinc-800 space-y-1.5 text-xs">
          <div className="text-[10px] uppercase tracking-wider opacity-50 mb-1">On-Chain Forensic Inspection</div>
          <div className="flex justify-between text-[11px]"><span className="opacity-60">Wallet Age:</span><span className="text-amber-300">{anomaly.walletAge}</span></div>
          <div className="flex justify-between text-[11px]"><span className="opacity-60">Transfer Behavior:</span><span className="text-red-300">{anomaly.velocity}</span></div>
          <div className="flex justify-between text-[11px]"><span className="opacity-60">Target Gateway:</span><span>{anomaly.targetGateway}</span></div>
        </div>

        {/* Voting & Resolution Action Block */}
        {!voteCast ? (
          <div className="space-y-2 pt-2">
            <span className="text-[10px] opacity-60 block uppercase tracking-wider">Sub-Committee Vote (3/5 Required)</span>
            <button 
              onClick={handleRevertVote}
              className="w-full py-2.5 bg-red-950/80 border border-red-700 text-red-400 text-xs font-bold uppercase rounded hover:bg-red-900 transition"
            >
              REVERT & Blacklist Gateway
            </button>
            <button 
              onClick={handleApproveVote}
              className="w-full py-2.5 bg-zinc-800 border border-zinc-600 text-xs font-bold uppercase rounded hover:bg-zinc-700 transition"
            >
              Approve Transfer (Release)
            </button>
          </div>
        ) : (
          <div className={`p-3 rounded border text-center space-y-1 ${walletBlacklisted ? 'bg-red-950/30 border-red-800' : 'bg-emerald-950/30 border-emerald-800'}`}>
            <span className={`text-xs font-bold ${walletBlacklisted ? 'text-red-400' : 'text-emerald-400'}`}>
              {walletBlacklisted ? 'EXPLOIT INTERCEPTED: FUNDS SECURED' : 'TRANSFER RELEASED: CONSENSUS MET'}
            </span>
            <p className="text-[10px] opacity-60">
              {walletBlacklisted ? '3/5 Sub-Committee consensus reached. Sender permanently blacklisted from Gateway.' : '3/5 Sub-Committee approved transfer. Timelock released.'}
            </p>
          </div>
        )}

      </div>
    </main>
  );
}