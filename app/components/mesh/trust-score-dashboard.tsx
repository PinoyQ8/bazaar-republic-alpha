"use client";

import React, { useState, useEffect } from 'react';
import { fetchPioneerLedger } from '@/lib/oracle-read';

// 🛡️ VAULT INJECTION: Receive the secure payload directly from the Server Component
interface DashboardProps {
  secureNodeAddress: string | null;
}

// 🛡️ MESH PURITY: Strict typing for the Oracle Payload
interface OracleLedgerData {
  governance_eligible: boolean;
  calculated_ts: number;
  quadrants?: {
    P_align?: { score: number };
    S_stake?: { score: number };
    C_eco?: { score: number };
    L_sync?: { score: number };
  };
}

export default function TrustScoreDashboard({ secureNodeAddress }: DashboardProps) {
  const [ledgerData, setLedgerData] = useState<OracleLedgerData | null>(null);
  const [status, setStatus] = useState<'LOADING' | 'ACTIVE' | 'NOT_FOUND' | 'LOCKED'>('LOADING');

  useEffect(() => {
    // 1. Check Server-Verified Node (Bypassing insecure localStorage)
    if (!secureNodeAddress) {
      setStatus('LOCKED');
      return;
    }
    
    triggerOracleSync(secureNodeAddress);
  }, [secureNodeAddress]);

  const triggerOracleSync = async (nodeAddress: string) => {
    setStatus('LOADING');
    try {
      const response = await fetchPioneerLedger(nodeAddress);

      if (response.status === 'FORGED') {
        setLedgerData(response.data);
        setStatus('ACTIVE');
      } else {
        setStatus('NOT_FOUND');
      }
    } catch (error) {
      console.error("MESH Error: Oracle Readout failed.", error);
      setStatus('NOT_FOUND');
    }
  };

  // --- RENDER SECTORS ---

  if (status === 'LOCKED') {
    return (
      <div className="p-6 bg-black min-h-screen font-mono text-zinc-500 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-2 font-bold animate-pulse">{"!! "} NODE_LOCKED</p>
          <p className="text-xs">Secure handshake failed. No active payload in the Vault.</p>
          <p className="text-xs mt-4 border border-zinc-800 p-2 rounded">Please resync via the Genesis entry gate.</p>
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
          <p className="text-yellow-500 mb-2 font-bold">{"?? "} LEDGER_VOID</p>
          <p className="text-xs text-zinc-400">Node [{secureNodeAddress}] not anchored in the E-Network.</p>
        </div>
      </div>
    );
  }

  // ACTIVE DASHBOARD (S23 Ultra Optimized)
  const isEligible = ledgerData?.governance_eligible ?? false;
  const tScore = ledgerData?.calculated_ts ? (ledgerData.calculated_ts * 100).toFixed(0) : "0";

  // 🛡️ Logic Purity: Nullish coalescing prevents 0% scores from inflating to 25%
  const pAlign = ((ledgerData?.quadrants?.P_align?.score ?? 0.25) * 100).toFixed(0);
  const sStake = ((ledgerData?.quadrants?.S_stake?.score ?? 0.25) * 100).toFixed(0);
  const cEco = ((ledgerData?.quadrants?.C_eco?.score ?? 0.25) * 100).toFixed(0);
  const lSync = ((ledgerData?.quadrants?.L_sync?.score ?? 0.25) * 100).toFixed(0);

  return (
    <div className="p-4 bg-black min-h-screen font-mono space-y-6 text-zinc-300">
      
      {/* HEADER TIER */}
      <div className="border border-zinc-800 p-4 rounded-lg bg-zinc-950 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
        <h1 className="text-blue-500 text-xs tracking-widest uppercase mb-1 font-bold">Oracle_Readout</h1>
        <p className="text-[10px] text-zinc-500 break-all bg-black p-2 rounded border border-zinc-900 mt-2">
          NODE: <span className="text-zinc-300">{secureNodeAddress}</span>
        </p>
      </div>

      {/* TRUSTSCORE TIER */}
      <div className={`p-6 rounded-lg border ${isEligible ? 'border-green-800 bg-green-950/20 shadow-[0_0_20px_rgba(34,197,94,0.1)]' : 'border-red-800 bg-red-950/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]'} flex flex-col items-center justify-center transition-all duration-500`}>
        <h2 className="text-[10px] text-zinc-400 uppercase tracking-widest mb-2">Master_TrustScore</h2>
        <div className={`text-5xl font-bold tracking-tighter ${isEligible ? 'text-green-500' : 'text-red-500'}`}>
          {tScore}%
        </div>
        <p className={`mt-3 text-[10px] uppercase tracking-widest font-bold ${isEligible ? 'text-green-400' : 'text-red-400'}`}>
          {isEligible ? '>> GOVERNANCE_UNLOCKED' : '!! GOVERNANCE_LOCKED'}
        </p>
      </div>

      {/* QUADRANT TIER */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 border border-zinc-800 rounded bg-zinc-950 hover:border-zinc-600 transition-colors">
          <p className="text-[9px] text-zinc-500 uppercase">P_Align</p>
          <p className="text-sm text-blue-400 font-bold">{pAlign}%</p>
        </div>
        <div className="p-3 border border-zinc-800 rounded bg-zinc-950 hover:border-zinc-600 transition-colors">
          <p className="text-[9px] text-zinc-500 uppercase">S_Stake</p>
          <p className="text-sm text-blue-400 font-bold">{sStake}%</p>
        </div>
        <div className="p-3 border border-zinc-800 rounded bg-zinc-950 hover:border-zinc-600 transition-colors">
          <p className="text-[9px] text-zinc-500 uppercase">C_Eco</p>
          <p className="text-sm text-blue-400 font-bold">{cEco}%</p>
        </div>
        <div className="p-3 border border-zinc-800 rounded bg-zinc-950 hover:border-zinc-600 transition-colors">
          <p className="text-[9px] text-zinc-500 uppercase">L_Sync</p>
          <p className="text-sm text-blue-400 font-bold">{lSync}%</p>
        </div>
      </div>

    </div>
  );
}