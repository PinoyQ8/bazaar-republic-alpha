'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CommandCenter() {
  // 🛡️ 1. CORE ROUTING & SECURITY STATE
  const router = useRouter();
  const [isNodeLocked, setIsNodeLocked] = useState(true);

  // 🛠️ 2. DASHBOARD DATA STATES
  const [secureNodeAddress, setSecureNodeAddress] = useState<string>("SYNCING...");
  const [ledgerData, setLedgerData] = useState({
    stakedPi: 0,
    trustScore: 0,
    mBZRWeight: 0,
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
    // Future fetch logic goes here
  };

  // 🛡️ 5. DERIVED UI METRICS
  const tScore = ledgerData.trustScore;
  const isEligible = tScore >= 50; 
  const pAlign = "Verified";       
  const sStake = ledgerData.stakedPi; 
  const cEco = "Active";           
  const lSync = "Synced";          

  // 🛑 6. THE LOCK SCREEN RENDER
  if (isNodeLocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 font-mono text-center">
        <div className="p-8 border border-red-500/30 bg-red-500/10 rounded-xl space-y-4">
          <p className="text-red-500 font-bold text-xl animate-pulse">!! NODE_LOCKED</p>
          <p className="text-slate-400 text-sm">Secure handshake failed. No active payload in the Vault.</p>
          <button 
            onClick={() => router.push('/academy/module-01')} 
            className="px-6 py-2 mt-4 bg-red-900 hover:bg-red-800 text-red-200 font-bold rounded text-xs tracking-widest uppercase transition-colors"
          >
            Resync via Genesis
          </button>
        </div>
      </div>
    );
  }

  // ✅ 7. THE SECURE DASHBOARD RENDER
  return (
    <div className="p-8">
      {/* 
        ⚠️ BAZAAR FOUNDER: 
        Paste your specific Dashboard UI (the graphs, the stats blocks) right here, 
        replacing this placeholder text. 
      */}
      <h1 className="text-2xl text-white font-bold tracking-widest uppercase">Command Center Active</h1>
      <p className="text-green-400 font-mono mt-2">Node Address: {secureNodeAddress}</p>
      
      {/* UI verification of the variables */}
      <div className="mt-8 text-slate-400 font-mono space-y-2 text-sm">
        <p>Staked Balance: <span className="text-white">{sStake} Pi</span></p>
        <p>Trust Score: <span className="text-white">{tScore}</span></p>
        <p>Airdrop Eligible: <span className={isEligible ? "text-green-400" : "text-red-400"}>{isEligible ? "YES" : "NO"}</span></p>
        <p>Pioneer Alignment: <span className="text-blue-400">{pAlign}</span></p>
        <p>Economy Status: <span className="text-yellow-400">{cEco}</span></p>
        <p>Ledger Sync: <span className="text-purple-400">{lSync}</span></p>
      </div>
    </div>
  );
}