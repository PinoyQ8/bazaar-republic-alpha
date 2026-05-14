"use client";

import React, { useState, useEffect } from 'react';
import { fetchPioneerLedger } from '@/lib/oracle-read';

// 🛡️ VAULT INJECTION: Receive the secure payload directly from the Server Component
interface DashboardProps {
  secureNodeAddress: string | null;
}

export default function TrustScoreDashboard({ secureNodeAddress }: DashboardProps) {
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [status, setStatus] = useState<'LOADING' | 'ACTIVE' | 'NOT_FOUND' | 'LOCKED'>('LOADING');

  useEffect(() => {
    // 🛡️ LOGIC PURITY: The function is scoped INSIDE the effect to clear dependency errors.
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
        console.error("[MESH-SCAN] Oracle Readout failed.", error);
        setStatus('NOT_FOUND');
      }
    };

    // 1. 🛡️ Check Server-Verified Node (Bypassing insecure localStorage)
    if (!secureNodeAddress) {
      setStatus('LOCKED');
      return;
    }
    
    triggerOracleSync(secureNodeAddress);
  }, [secureNodeAddress]); // <- Node strictly locked to this dependency

  // --- 🛡️ THE ADJUDICATOR PERIMETERS ---

  if (status === 'LOCKED') {
    return (
      <div className="p-6 bg-slate-950 min-h-[50vh] font-mono text-slate-500 flex items-center justify-center rounded-xl border border-slate-900">
        <div className="text-center animate-in fade-in zoom-in duration-500">
          <p className="text-red-500 mb-2 text-sm tracking-widest font-bold">{"!! "} NODE_LOCKED</p>
          <p className="text-xs">Secure handshake failed. No active payload in the Vault.</p>
          <p className="text-[10px] mt-4 uppercase text-slate-600">Please resync via the Genesis entry gate.</p>
        </div>
      </div>
    );
  }

  if (status === 'LOADING') {
    return (
      <div className="p-6 bg-slate-950 min-h-[50vh] font-mono text-blue-500 flex items-center justify-center rounded-xl border border-slate-900">
        <p className="animate-pulse tracking-widest text-xs">{"|| "} QUERYING_ORACLE...</p>
      </div>
    );
  }

  if (status === 'NOT_FOUND') {
    return (
      <div className="p-6 bg-slate-950 min-h-[50vh] font-mono text-center flex items-center justify-center rounded-xl border border-slate-900">
        <div className="animate-in fade-in duration-500">
          <p className="text-yellow-500 mb-2 text-sm tracking-widest font-bold">{"?? "} LEDGER_VOID</p>
          <p className="text-xs text-slate-400">Node <span className="text-blue-400">{secureNodeAddress}</span> not anchored in the E-Network.</p>
        </div>
      </div>
    );
  }

  // --- 🚀 ACTIVE DASHBOARD (S23 Ultra Optimized) ---
  
  // 🛡️ Hardened Math Logic: Prevents NaN crashes if Oracle returns partial data
  const isEligible = ledgerData?.governance_eligible || false;
  const tScore = ledgerData?.calculated_ts !== undefined ? (ledgerData.calculated_ts * 100).toFixed(0) : "0";
  
  // Safe Fallback Extractors
  const getQuadrantScore = (path: any) => path?.score !== undefined ? (path.score * 100).toFixed(0) : "0";
  
  const pAlign = getQuadrantScore(ledgerData?.quadrants?.P_align);
  const sStake = getQuadrantScore(ledgerData?.quadrants?.S_stake);
  const cEco = getQuadrantScore(ledgerData?.quadrants?.C_eco);
  const lSync = getQuadrantScore(ledgerData?.quadrants?.L_sync);

  return (
    <div className="p-4 bg-slate-950 min-h-[60vh] font-mono space-y-6 rounded-xl border border-slate-900 animate-in fade-in duration-700">
      
      {/* 🚀 HEADER TIER */}
      <div className="border border-slate-800 p-4 rounded-lg bg-slate-900/50">
        <h1 className="text-blue-500 text-xs tracking-widest uppercase mb-1 font-bold">Oracle_Readout</h1>
        <p className="text-[10px] text-slate-400 break-all bg-slate-950 p-2 rounded border border-slate-800 mt-2">
          NODE: <span className="text-slate-300">{secureNodeAddress}</span>
        </p>
      </div>

      {/* 🛡️ TRUSTSCORE TIER */}
      <div className={`p-6 rounded-lg border transition-colors duration-500 flex flex-col items-center justify-center ${
        isEligible ? 'border-green-800 bg-green-950/20 shadow-[0_0_20px_rgba(34,197,94,0.05)]' : 'border-red-900 bg-red-950/10'
      }`}>
        <h2 className="text-[10px] text-slate-400 uppercase tracking-widest mb-2 font-bold">Master_TrustScore</h2>
        <div className={`text-6xl font-black tracking-tighter ${isEligible ? 'text-green-500' : 'text-red-500'}`}>
          {tScore}<span className="text-3xl text-slate-600">%</span>
        </div>
        <p className={`mt-4 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded border ${
          isEligible ? 'text-green-400 border-green-800/50 bg-green-900/20' : 'text-red-400 border-red-900/50 bg-red-900/20'
        }`}>
          {isEligible ? '>> GOVERNANCE_UNLOCKED' : '!! GOVERNANCE_LOCKED'}
        </p>
      </div>

      {/* 📊 QUADRANT TIER */}
      <div className="grid grid-cols-2 gap-3">
        <QuadrantCard label="P_Align" score={pAlign} />
        <QuadrantCard label="S_Stake" score={sStake} />
        <QuadrantCard label="C_Eco" score={cEco} />
        <QuadrantCard label="L_Sync" score={lSync} />
      </div>

    </div>
  );
}

// 🛡️ REUSABLE MESH COMPONENT
function QuadrantCard({ label, score }: { label: string, score: string }) {
  return (
    <div className="p-4 border border-slate-800 rounded-lg bg-slate-900/50 flex flex-col items-center justify-center group hover:border-blue-500/50 transition-colors">
      <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1 group-hover:text-blue-400 transition-colors">{label}</p>
      <p className="text-xl font-bold text-slate-200">
        {score}<span className="text-[10px] text-slate-600 ml-0.5">%</span>
      </p>
    </div>
  );
}