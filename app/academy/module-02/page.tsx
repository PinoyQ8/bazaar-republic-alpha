"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function ModuleTwoPage() {
  const [vote, setVote] = useState<"PENDING" | "FOR" | "AGAINST">("PENDING");
  const [logs, setLogs] = useState<string[]>([]);

  const castVote = (decision: "FOR" | "AGAINST") => {
    if (vote !== "PENDING") return;
    
    setLogs((prev) => [...prev, `[TRANSACTION] Generating cryptographic signature...`]);
    setTimeout(() => {
      setLogs((prev) => [...prev, `[SOROBAN] Invoking contract: CBU...A7F`]);
      setTimeout(() => {
        setLogs((prev) => [...prev, `[SUCCESS] Vote cast: ${decision}. State locked on ledger.`]);
        setVote(decision);
      }, 800);
    }, 600);
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* 🚀 HEADER: SECTOR IDENTITY */}
      <header className="space-y-4">
        <div className="inline-block px-3 py-1 bg-blue-600/10 border border-blue-600/30 rounded text-[10px] text-blue-400 font-bold tracking-[0.3em] uppercase">
          Governance Module 02
        </div>
        <h1 className="text-4xl font-extrabold tracking-tighter text-white uppercase">
          DAO Governance
        </h1>
        <p className="text-slate-400 max-w-2xl text-sm leading-relaxed italic">
          "A Republic relies on the pulse of its Pioneers. Through Soroban Smart Contracts, 
          every decision is immutable, auditable, and mathematically secure."
        </p>
      </header>

      {/* 🛡️ ARCHITECTURE OF THE VOTE */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 border border-slate-800 bg-slate-900/40 rounded-xl space-y-4">
          <h3 className="text-sm font-bold text-blue-500 uppercase tracking-widest border-b border-slate-800 pb-2">The Proposal Buffer</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-mono">
            Proposals submitted by Real Pioneers are held in the RAM buffer. They require a baseline consensus threshold before being pushed to the Mainnet Ledger for execution.
          </p>
        </div>

        <div className="p-6 border border-slate-800 bg-slate-900/40 rounded-xl space-y-4">
          <h3 className="text-sm font-bold text-blue-500 uppercase tracking-widest border-b border-slate-800 pb-2">Soroban Execution</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-mono">
            We utilize Stellar's Soroban architecture. It guarantees rapid transaction finality without the gas-bloat of legacy EVM chains. The MESH requires speed *and* security.
          </p>
        </div>
      </section>

      {/* 🛠️ LIVE TERMINAL: THE GOVERNANCE SIMULATION */}
      <section className="p-8 border border-slate-800 bg-slate-900/20 rounded-xl space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-widest">Active Proposal: PIP-01</h3>
            <p className="text-[10px] text-slate-500 font-mono mt-1">Upgrade E-Network Security Adjudicator to v2.1</p>
          </div>
          <span className={`px-2 py-1 text-[9px] font-bold tracking-widest uppercase border rounded ${
            vote === "PENDING" ? "text-yellow-500 border-yellow-500/50 bg-yellow-500/10" : "text-green-500 border-green-500/50 bg-green-500/10"
          }`}>
            {vote === "PENDING" ? "AWAITING SIGNATURE" : "LEDGER LOCKED"}
          </span>
        </div>

        {/* Voting UI */}
        <div className="flex gap-4">
          <button 
            onClick={() => castVote("FOR")}
            disabled={vote !== "PENDING"}
            className="flex-1 py-3 bg-slate-950 border border-slate-700 hover:border-green-500 hover:bg-green-500/10 text-slate-300 font-mono font-bold rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs tracking-widest"
          >
            VOTE FOR
          </button>
          <button 
            onClick={() => castVote("AGAINST")}
            disabled={vote !== "PENDING"}
            className="flex-1 py-3 bg-slate-950 border border-slate-700 hover:border-red-500 hover:bg-red-500/10 text-slate-300 font-mono font-bold rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs tracking-widest"
          >
            VOTE AGAINST
          </button>
        </div>

        {/* Interactive Terminal Output */}
<div className="bg-slate-950 border border-slate-800 p-4 rounded-lg font-mono text-[10px] min-h-25 flex flex-col justify-end">
          {logs.length === 0 ? (
            <span className="text-slate-600 animate-pulse">&gt; Awaiting Pioneer action...</span>
          ) : (
            logs.map((log, index) => (
              <span key={index} className={log.includes("[SUCCESS]") ? "text-green-400" : "text-slate-400"}>
                &gt; {log}
              </span>
            ))
          )}
        </div>
      </section>

      {/* 🚀 ACTION: ENTER NEXT MODULE */}
      <div className="pt-8 border-t border-slate-900 flex justify-between items-center">
        <Link href="/academy/module-01" className="text-slate-500 hover:text-slate-300 font-mono text-xs uppercase tracking-widest transition-colors">
          ← Back to Module 01
        </Link>
        <Link 
          href="/academy/module-03" 
          className={`px-8 py-3 font-mono font-bold rounded shadow-[0_0_20px_rgba(37,99,235,0.2)] transition-all uppercase text-xs tracking-widest ${
            vote === "PENDING" ? "bg-slate-800 text-slate-500 cursor-not-allowed pointer-events-none" : "bg-blue-600 hover:bg-blue-500 text-white"
          }`}
        >
          {vote === "PENDING" ? "VOTE TO PROCEED" : "Initiate Module 03 →"}
        </Link>
      </div>
    </div>
  );
}