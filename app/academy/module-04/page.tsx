"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function GenesisCapstonePage() {
  const { pioneer } = useAuth();
  const [mintStatus, setMintStatus] = useState<"IDLE" | "SIGNING" | "MINTED" | "FAILED" | "LOCKED">("IDLE");
  const [logs, setLogs] = useState<string[]>([]);
  const [genesisSlot, setGenesisSlot] = useState<number | string>("SYNCING");

  // 🛡️ LOGIC PURITY: The live minting function
  const initiateGenesisMint = async () => {
    if (mintStatus !== "IDLE" && mintStatus !== "FAILED") return;
    
    setMintStatus("SIGNING");
    setLogs([`[VAULT] Requesting Genesis Node signature for @${pioneer?.username || "UNKNOWN"}...`]);
    
    try {
      setLogs((prev) => [...prev, "[MESH] Transmitting signature to MongoDB Vault..."]);
      
      const response = await fetch('/api/genesis/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: pioneer?.username }),
      });

      const data = await response.json();

      if (data.success) {
        setGenesisSlot(data.slotNumber);
        setLogs((prev) => [
          ...prev, 
          `[SOROBAN] Minting Genesis NFT Badge... Locking Slot #${data.slotNumber}/100`,
          `[SUCCESS] Node permanently anchored to the Genesis Block. Welcome to the Republic.`
        ]);
        setMintStatus("MINTED");
      } else {
        // 🛡️ ADJUDICATOR REJECTIONS
        if (data.error === 'ALREADY_PLEDGED') {
          setGenesisSlot(data.slot);
          setLogs((prev) => [
            ...prev, 
            `[ADJUDICATOR] Duplicate detected. Slot #${data.slot} is already hard-coded to this Node.`,
            `[SUCCESS] Existing pledge verified. Access granted.`
          ]);
          setMintStatus("MINTED"); // We let them through if they already pledged
        } else if (data.error === 'CAPACITY_REACHED') {
          setGenesisSlot(100);
          setLogs((prev) => [...prev, `[ADJUDICATOR] FATAL: Genesis 100 capacity reached. The Vault is sealed.`]);
          setMintStatus("LOCKED");
        } else {
          setLogs((prev) => [...prev, `[ADJUDICATOR] Signature rejected: ${data.error}`]);
          setMintStatus("FAILED");
        }
      }
    } catch (error) {
      console.error("[MESH-SCAN] Network Fracture:", error);
      setLogs((prev) => [...prev, `[ADJUDICATOR] Network transmission failure. Node disconnected.`]);
      setMintStatus("FAILED");
    }
  };

  const slotsRemaining = typeof genesisSlot === "number" ? 100 - genesisSlot : "--";

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 max-w-5xl mx-auto pb-12">
      {/* 🚀 HEADER: THE CAPSTONE */}
      <header className="space-y-4 border-b border-slate-800 pb-8">
        <div className="inline-block px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded text-[10px] text-yellow-500 font-bold tracking-[0.3em] uppercase animate-pulse">
          Capstone Module 04
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase">
          The Genesis 100
        </h1>
        <p className="text-slate-400 max-w-2xl text-sm leading-relaxed font-mono border-l-2 border-yellow-500/50 pl-4">
          "The first 100 nodes form the bedrock of the Republic. You are not just joining a network; you are hard-coding the foundational laws of the Bazaar."
        </p>
      </header>

      {/* 🛡️ SCARCITY ENGINE: LIVE TRACKER */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 p-8 border border-slate-800 bg-slate-900/40 rounded-xl relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
            <div 
              className="h-full bg-yellow-500 transition-all duration-1000" 
              style={{ width: typeof genesisSlot === 'number' ? `${(genesisSlot / 100) * 100}%` : '0%' }}
            ></div>
          </div>
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4">Live Network Consensus</h3>
          <div className="text-6xl font-black text-white tracking-tighter">
            {genesisSlot} <span className="text-2xl text-slate-600">/ 100</span>
          </div>
          <p className="text-xs text-yellow-500 font-mono mt-2 uppercase tracking-widest">
            {slotsRemaining} Genesis Slots Remaining
          </p>
        </div>

        <div className="p-6 border border-slate-800 bg-slate-900/40 rounded-xl space-y-4">
          <h3 className="text-[10px] font-bold text-blue-500 uppercase tracking-widest border-b border-slate-800 pb-2">The Genesis Pledge</h3>
          <ul className="space-y-3 text-[10px] text-slate-400 font-mono list-none p-0">
            <li className="flex gap-2"><span className="text-blue-500">1.</span> Maintain 92% Uptime Shield.</li>
            <li className="flex gap-2"><span className="text-blue-500">2.</span> Adjudicate logic without bias.</li>
            <li className="flex gap-2"><span className="text-blue-500">3.</span> Vote on all V23 Mainnet PIPs.</li>
            <li className="flex gap-2"><span className="text-blue-500">4.</span> Defend the Zero-Trust perimeter.</li>
          </ul>
        </div>
      </section>

      {/* 🛠️ LIVE TERMINAL: THE SIGNATURE FORGE */}
      <section className="p-8 border border-slate-800 bg-slate-900/20 rounded-xl space-y-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-widest">Target: Core Ledger (MongoDB)</h3>
            <p className="text-[10px] text-slate-500 font-mono mt-1">Ready for cryptographic anchor...</p>
          </div>
          <button 
            onClick={initiateGenesisMint}
            disabled={mintStatus === "SIGNING" || mintStatus === "MINTED" || mintStatus === "LOCKED"}
            className={`px-6 py-2 font-mono font-bold rounded transition-all text-[10px] tracking-widest uppercase ${
              mintStatus === "IDLE" || mintStatus === "FAILED"
                ? "bg-yellow-600 hover:bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.3)]" 
                : "bg-slate-800 text-slate-500 cursor-not-allowed"
            }`}
          >
            {mintStatus === "IDLE" ? "Sign the Pledge" : 
             mintStatus === "FAILED" ? "Retry Uplink" :
             mintStatus === "MINTED" ? "Signature Accepted" : 
             mintStatus === "LOCKED" ? "Vault Sealed" : "Processing..."}
          </button>
        </div>

        {/* Interactive Terminal Output */}
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg font-mono text-[10px] min-h-32 flex flex-col justify-end space-y-2">
          {logs.length === 0 ? (
            <span className="text-slate-600 animate-pulse">&gt; Awaiting Pioneer signature to permanently lock slot...</span>
          ) : (
            logs.map((log, index) => (
              <span key={index} className={
                log.includes("[SUCCESS]") ? "text-yellow-500 font-bold" : 
                log.includes("FATAL") || log.includes("rejected") ? "text-red-500 font-bold" :
                log.includes("[SOROBAN]") || log.includes("[VAULT]") ? "text-blue-400" : 
                "text-slate-400"
              }>
                &gt; {log}
              </span>
            ))
          )}
        </div>
      </section>

      {/* 🚀 ACTION: FINAL ROUTING */}
      <div className="pt-8 border-t border-slate-900 flex justify-between items-center">
        <Link href="/academy/module-03" className="text-slate-500 hover:text-slate-300 font-mono text-xs uppercase tracking-widest transition-colors">
          ← Back to Module 03
        </Link>
        
        {mintStatus === "MINTED" ? (
          <Link 
            href="/dashboard"
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold rounded shadow-[0_0_20px_rgba(37,99,235,0.2)] transition-all uppercase text-xs tracking-widest text-center"
          >
            Access Genesis Command Center →
          </Link>
        ) : (
          <button 
            disabled
            className="px-8 py-3 bg-slate-800 text-slate-500 font-mono font-bold rounded transition-all uppercase text-xs tracking-widest cursor-not-allowed"
          >
            Signature Required
          </button>
        )}
      </div>
    </div>
  );
}