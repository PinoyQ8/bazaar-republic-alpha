'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import StasisShield from '@/components/StasisShield'; // 🛡️ INJECTED: Web3 Kill-Switch

export default function CommandCenter() {
  // 🛡️ 1. CORE ROUTING & SECURITY STATE
  const router = useRouter();
  const [isNodeLocked, setIsNodeLocked] = useState(true);

  // 🛠️ 2. DASHBOARD DATA STATES
  const [secureNodeAddress, setSecureNodeAddress] = useState<string>("SYNCING...");
  const [ledgerData, setLedgerData] = useState({
    stakedPi: 120.50, // Added base defaults for live visual layout validation
    trustScore: 85,
    mBZRWeight: 1.45,
  });

  // 🚀 3. THE VAULT SYNC PROTOCOL
  useEffect(() => {
    const meshAnchor = localStorage.getItem('MESH_ANCHOR'); 
    const pioneerId = localStorage.getItem('Mesh Genesis'); 
    const meshTier = localStorage.getItem('MESH Tier');     

    if (!meshAnchor || !pioneerId) {
      console.warn("Secure handshake failed. MESH keys not found in Vault.");
      setIsNodeLocked(true);
    } else {
      console.log(`Vault Payload verified. Welcome back, ${meshTier} ${pioneerId}.`);
      setSecureNodeAddress(pioneerId); 
      setIsNodeLocked(false);
      triggerOracleSync(); 
    }
  }, [router]);

  // 📡 4. MESH ORACLE FUNCTION
  const triggerOracleSync = async () => {
    console.log("[MESH] Syncing live ledger data...");
    // Future fetch logic streams straight through this socket array
  };

  // 🛡️ 5. DERIVED UI METRICS
  const tScore = ledgerData.trustScore;
  const isEligible = tScore >= 50; 
  const pAlign = "Verified";      
  const sStake = ledgerData.stakedPi; 
  const cEco = "Active";          
  const lSync = "Synced";          

  // 🛑 6. THE LOCK SCREEN RENDER (Optimized for S23 Ultra Bounds)
  if (isNodeLocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black font-mono p-4 text-center select-none">
        <div className="w-full max-w-85 border border-red-900/60 bg-red-950/10 p-5 rounded-sm space-y-4 shadow-[0_0_20px_rgba(239,68,68,0.05)]">
          <p className="text-red-500 font-black text-sm tracking-widest animate-pulse">
            ⚠️ !! NODE_LOCKED !!
          </p>
          <p className="text-red-400/80 text-[11px] leading-relaxed">
            Secure handshake failed. Critical MESH payload tokens missing from local data vault array.
          </p>
          <div className="h-px bg-red-900/40 w-full" />
          <button 
            onClick={() => router.push('/academy/module-01')} 
            className="w-full py-2.5 bg-red-950/40 border border-red-700/50 hover:bg-red-900 hover:text-white text-red-400 font-bold rounded-sm text-[10px] tracking-widest uppercase transition-all"
          >
            Resync via Genesis
          </button>
        </div>
      </div>
    );
  }

  // ✅ 7. THE SECURE DASHBOARD RENDER (Locked to S23 Ultra Grid Bounds)
  return (
    <div className="min-h-screen bg-black text-green-500 font-mono p-4 flex flex-col justify-between animate-in fade-in duration-500 selection:bg-green-500 selection:text-black">
      
      {/* 📡 PERIMETER HEADER */}
      <header className="border-b border-green-900/60 pb-2.5 pt-1 flex justify-between items-end">
        <div>
          <span className="text-[9px] text-green-700 uppercase tracking-widest block font-bold">// COMMAND CENTER</span>
          <h1 className="text-xl font-black tracking-tight text-white uppercase">Bazaar Matrix</h1>
        </div>
        <div className="text-right text-[9px] text-green-400 space-y-0.5">
          <p><span className="text-green-700">NODE:</span> CLINICAL_PC*</p>
          <p><span className="text-green-700">T-SCORE:</span> {tScore}</p>
        </div>
      </header>

      {/* 📊 CORE TELEMETRY METRICS GRID */}
      <section className="grid grid-cols-2 gap-2 my-2.5">
        <div className="p-2.5 border border-green-900/50 bg-green-950/5 rounded-sm">
          <span className="text-[9px] uppercase text-green-700 block">Staked Balance</span>
          <span className="text-xs font-bold text-white block mt-0.5">{sStake.toFixed(2)} <span className="text-green-500 text-[9px]">Pi</span></span>
        </div>
        <div className="p-2.5 border border-green-900/50 bg-green-950/5 rounded-sm">
          <span className="text-[9px] uppercase text-green-700 block">Airdrop Link</span>
          <span className={`text-xs font-bold block mt-0.5 tracking-wide ${isEligible ? "text-emerald-400" : "text-red-400"}`}>
            {isEligible ? "ELIGIBLE" : "LOCKED"}
          </span>
        </div>
      </section>

      {/* 🛡️ SECURITY AUDIT MATRIX SUB-BLOCK */}
      <section className="border border-green-900/60 bg-green-950/10 p-3 rounded-sm space-y-2 flex-1 my-1 text-[11px]">
        <div className="flex justify-between items-center border-b border-green-900/30 pb-1.5">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Node Verification Data</h3>
          <span className="text-[8px] px-1 bg-green-900 text-black font-bold rounded-sm uppercase tracking-wide">SECURE</span>
        </div>
        
        <div className="space-y-1.5 pt-1 text-green-400/90">
          <div className="flex justify-between border-b border-green-950 pb-1">
            <span className="text-green-700">Secure Node Target:</span>
            <span className="text-white text-[10px] truncate max-w-37.5">{secureNodeAddress}</span>
          </div>
          <div className="flex justify-between border-b border-green-950 pb-1">
            <span className="text-green-700">Pioneer Alignment:</span>
            <span className="text-emerald-400">{pAlign}</span>
          </div>
          <div className="flex justify-between border-b border-green-950 pb-1">
            <span className="text-green-700">E-Network Economy:</span>
            <span className="text-yellow-500">{cEco}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-700">Ledger Status:</span>
            <span className="text-cyan-400">{lSync}</span>
          </div>
        </div>
      </section>

      {/* 🛑 ON-CHAIN STASIS KILL-SWITCH INJECTION */}
      <section className="my-1.5">
        <StasisShield pioneerUid={secureNodeAddress} />
      </section>

      {/* ⚡ SYSTEM LEDGER STREAM FEED */}
      <section className="space-y-1 mt-2">
        <h2 className="text-[9px] font-bold text-green-600 uppercase tracking-widest">// Local Node Core Telemetry</h2>
        <div className="p-2.5 bg-black border border-green-900 rounded-sm text-[9px] space-y-1 text-green-500/60 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-green-500 to-transparent opacity-20"></div>
          <p>&gt; Vault Payload verified via MESH anchor keys.</p>
          <p>&gt; Cloud Node connection active on mainnet branch protocol.</p>
        </div>
      </section>

      {/* 🚀 COMMAND OVERLAY FOOTER */}
      <footer className="pt-2 mt-3 border-t border-green-900/60 flex justify-between items-center text-[10px]">
        <button 
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
          className="text-red-800 hover:text-red-500 transition-colors uppercase tracking-wider text-[9px]"
        >
          [ Flush Vault ]
        </button>
        <span className="text-green-900 text-[9px] select-none">
          BA-ALPHA-V23 // ONLINE
        </span>
      </footer>
    </div>
  );
}