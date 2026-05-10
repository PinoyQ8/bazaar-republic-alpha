"use client";

import React, { useState, useEffect } from 'react';
import { fetchPioneerLedger } from '@/lib/oracle-read';

export default function TrustScoreDashboard() {
  const [wallet, setWallet] = useState<string | null>(null);
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [status, setStatus] = useState<'LOADING' | 'ACTIVE' | 'NOT_FOUND' | 'LOCKED'>('LOADING');

  useEffect(() => {
    // 1. Check Local Memory for Active Node (Master TS Sync Bridge)
    const activeNode = localStorage.getItem('active_pioneer_node');
    
    if (!activeNode) {
      setStatus('LOCKED');
      return;
    }
    
    setWallet(activeNode);
    triggerOracleSync(activeNode);
  }, []);

  const triggerOracleSync = async (nodeAddress: string) => {
    setStatus('LOADING');
    const response = await fetchPioneerLedger(nodeAddress);

    if (response.status === 'FORGED') {
      setLedgerData(response.data);
      setStatus('ACTIVE');
    } else {
      setStatus('NOT_FOUND');
    }
  };

  // --- RENDER SECTORS ---

  if (status === 'LOCKED') {
    return (
      <div className="p-6 bg-black min-h-screen font-mono text-zinc-500 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-2">{"!! "} NODE_LOCKED</p>
          <p className="text-xs">No active wallet detected in local RAM.</p>
          <p className="text-xs mt-4">Please sync your node via the Pioneer Registry first.</p>
        </div>
      </div>
    );
  }

  if (status === 'LOADING') {
    return (
      <div className="p-6 bg-black min-h-screen font-mono text-blue-500 flex items-center justify-center">
        <p className="animate-pulse">{"|| "} QUERYING_ORACLE...</p>
      </div>
    );
  }

  if (status === 'NOT_FOUND') {
    return (
      <div className="p-6 bg-black min-h-screen font-mono text-center flex items-center justify-center">
        <div>
          <p className="text-yellow-500 mb-2">{"?? "} LEDGER_VOID</p>
          <p className="text-xs text-zinc-400">Node {wallet} not found in the E-Network.</p>
        </div>
      </div>
    );
  }

  // ACTIVE DASHBOARD (S23 Ultra Optimized)
  const isEligible = ledgerData.governance_eligible;
  const tScore = (ledgerData.calculated_ts * 100).toFixed(0);

  return (
    <div className="p-4 bg-black min-h-screen font-mono space-y-6">
      
      {/* HEADER TIER */}
      <div className="border border-zinc-800 p-4 rounded-lg bg-zinc-950">
        <h1 className="text-blue-500 text-xs tracking-widest uppercase mb-1">Oracle_Readout</h1>
        <p className="text-[10px] text-zinc-500 break-all bg-black p-2 rounded border border-zinc-900 mt-2">
          NODE: {wallet}
        </p>
      </div>

      {/* TRUSTSCORE TIER */}
      <div className={`p-6 rounded-lg border ${isEligible ? 'border-green-800 bg-green-950/20' : 'border-red-800 bg-red-950/20'} flex flex-col items-center justify-center`}>
        <h2 className="text-[10px] text-zinc-400 uppercase tracking-widest mb-2">Master_TrustScore</h2>
        <div className={`text-5xl font-bold ${isEligible ? 'text-green-500' : 'text-red-500'}`}>
          {tScore}%
        </div>
        <p className={`mt-3 text-[10px] uppercase tracking-widest ${isEligible ? 'text-green-400' : 'text-red-400'}`}>
          {isEligible ? '>> GOVERNANCE_UNLOCKED' : '!! GOVERNANCE_LOCKED'}
        </p>
      </div>

      {/* QUADRANT TIER */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 border border-zinc-800 rounded bg-zinc-950">
          <p className="text-[9px] text-zinc-500 uppercase">P_Align</p>
          <p className="text-sm text-blue-400">{(ledgerData.quadrants?.P_align?.score * 100) || 25}%</p>
        </div>
        <div className="p-3 border border-zinc-800 rounded bg-zinc-950">
          <p className="text-[9px] text-zinc-500 uppercase">S_Stake</p>
          <p className="text-sm text-blue-400">{(ledgerData.quadrants?.S_stake?.score * 100) || 25}%</p>
        </div>
        <div className="p-3 border border-zinc-800 rounded bg-zinc-950">
          <p className="text-[9px] text-zinc-500 uppercase">C_Eco</p>
          <p className="text-sm text-blue-400">{(ledgerData.quadrants?.C_eco?.score * 100) || 25}%</p>
        </div>
        <div className="p-3 border border-zinc-800 rounded bg-zinc-950">
          <p className="text-[9px] text-zinc-500 uppercase">L_Sync</p>
          <p className="text-sm text-blue-400">{(ledgerData.quadrants?.L_sync?.score * 100) || 25}%</p>
        </div>
      </div>

    </div>
  );
}