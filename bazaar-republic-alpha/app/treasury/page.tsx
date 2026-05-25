"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TreasuryViewport() {
  const [vaultStatus, setVaultStatus] = useState("UNBOUND");
  const [totalBurned, setTotalBurned] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // 🛡️ MESH-SCAN: Read Telemetry on Load
  useEffect(() => {
    async function syncLedger() {
      try {
        const res = await fetch('/api/treasury');
        if (res.ok) {
          const data = await res.json();
          setTotalBurned(data.totalBurned || 0);
          if (data.vaultState) setVaultStatus(data.vaultState);
        }
      } catch (error) {
        console.error("[MESH-TELEMETRY] 🚨 Fracture:", error);
      }
    }
    syncLedger();
  }, []);

  // 🛡️ THE GATEWAY: Execute Genesis Bind
  const handleGenesisBind = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/treasury', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'INITIALIZE_GENESIS_BIND' })
      });
      
      const data = await res.json();
      if (data.status === "SECURE") {
        setVaultStatus(data.vaultState || "BOUND");
      }
    } catch (error) {
      console.error("[MESH-BIND] 🚨 Fracture:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 animate-in fade-in duration-700">
      
      {/* 🛡️ VIEWPORT LOCK: S23 Ultra Matrix */}
      <div className="flex flex-col flex-1 w-full max-w-sm mx-auto h-screen relative shadow-2xl shadow-emerald-900/10">
        
        {/* 🧭 Sticky Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-3 px-4 py-4 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
          <Link 
            href="/enetwork/dashboard" 
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-emerald-500 hover:border-emerald-500/50 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="font-mono text-lg font-bold text-slate-100 uppercase tracking-tighter leading-none">
              DAO Treasury
            </h1>
            <div className="flex items-center gap-1 mt-1">
              <span className={`w-1.5 h-1.5 rounded-full ${vaultStatus === 'BOUND' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
              <p className={`text-[9px] font-mono tracking-widest uppercase ${vaultStatus === 'BOUND' ? 'text-emerald-500' : 'text-amber-500'}`}>
                {vaultStatus === 'BOUND' ? 'Stasis Shield Active' : 'Vault Unbound'}
              </p>
            </div>
          </div>
        </div>

        {/* 📊 Treasury Readout */}
        <div className="flex-1 overflow-y-auto px-4 pt-24 pb-20 space-y-6 custom-scrollbar">
          
          {/* Main Vault Status Card */}
          <div className={`p-5 rounded-sm border ${
            vaultStatus === 'BOUND' 
              ? 'bg-emerald-950/20 border-emerald-800/50' 
              : 'bg-slate-900/50 border-slate-700'
          }`}>
            <h2 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2 block">
              System State
            </h2>
            <div className="flex items-center gap-3">
              <div className={`text-2xl font-bold font-mono tracking-widest ${
                vaultStatus === 'BOUND' ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {vaultStatus}
              </div>
            </div>
          </div>

          {/* Incineration Matrix Card */}
          <div className="p-5 rounded-sm border bg-slate-900/50 border-slate-700">
            <h2 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2 flex justify-between">
              <span>Incinerated Mass</span>
              <span className="text-emerald-500">π</span>
            </h2>
            <div className="text-3xl font-mono text-slate-100">
              {totalBurned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[9px] text-slate-500 font-mono mt-2 uppercase tracking-widest">
              Total E-Network Governance Burn
            </p>
          </div>

          {/* Adjudicator Warning */}
          <div className="p-4 bg-slate-900/30 border border-slate-800 rounded-sm">
            <p className="text-[9px] font-mono text-slate-400 leading-relaxed uppercase tracking-widest">
              Adjudicator Notice: Treasury state is immutable. Genesis initialization permanently anchors the master ledger to the Pi Mainnet.
            </p>
          </div>
        </div>

        {/* 🚀 Execution Bridge (Sticky Bottom) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-slate-950/90 border-t border-slate-800 backdrop-blur-md">
          <button
            onClick={handleGenesisBind}
            disabled={vaultStatus === "BOUND" || isSyncing}
            className={`w-full py-4 font-mono text-xs font-bold rounded-sm transition-all uppercase tracking-widest flex items-center justify-center gap-3 ${
              vaultStatus === "BOUND"
                ? "bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed"
                : "bg-emerald-900/50 hover:bg-emerald-800 text-emerald-400 border border-emerald-700 shadow-[0_0_15px_rgba(16,185,129,0.15)] disabled:opacity-50"
            }`}
          >
            {isSyncing ? (
              <>
                <span className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></span>
                Writing Genesis Block...
              </>
            ) : vaultStatus === "BOUND" ? (
              "Vault Secured"
            ) : (
              "Execute Genesis Bind"
            )}
          </button>
        </div>

      </div>
    </div>
  );
}