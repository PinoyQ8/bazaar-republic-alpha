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
    <div className="min-h-screen bg-black text-green-500 font-mono p-4 flex flex-col justify-between animate-in fade-in slide-in-from-bottom-4 duration-700 selection:bg-green-500 selection:text-black">
      
      {/* 🚀 HEADER: SECTOR IDENTITY */}
      <header className="border-b border-green-900/60 pb-3 pt-1 space-y-1.5">
        <div className="inline-block px-2 py-0.5 bg-green-950/40 border border-green-700/40 rounded-sm text-[9px] text-green-400 font-bold tracking-[0.2em] uppercase">
          Governance Module 02
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white uppercase">
          DAO Governance
        </h1>
        <p className="text-green-400/80 text-[11px] leading-relaxed italic">
          "Through Soroban Smart Contracts, every decision is immutable, auditable, and mathematically secure."
        </p>
      </header>

      {/* 🛡️ ARCHITECTURE OF THE VOTE (Stacked layout for mobile tracking) */}
      <section className="space-y-2.5 my-2">
        <div className="p-3 border border-green-900/50 bg-green-950/10 rounded-sm space-y-1">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider border-b border-green-900/30 pb-1">
            The Proposal Buffer
          </h3>
          <p className="text-[11px] text-green-400/90 leading-normal">
            Proposals submitted by Real Pioneers are held in the RAM buffer. They require a baseline threshold before being pushed to the ledger.
          </p>
        </div>

        <div className="p-3 border border-green-900/50 bg-green-950/10 rounded-sm space-y-1">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider border-b border-green-900/30 pb-1">
            Soroban Execution
          </h3>
          <p className="text-[11px] text-green-400/90 leading-normal">
            We utilize Soroban architecture to guarantee rapid transaction finality without the gas-bloat of legacy EVM chains.
          </p>
        </div>
      </section>

      {/* 🛠️ LIVE TERMINAL: THE GOVERNANCE SIMULATION */}
      <section className="p-3 border border-green-900/60 bg-green-950/5 rounded-sm space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">Proposal: PIP-01</h3>
            <p className="text-[9px] text-green-600 font-mono">Upgrade Security Adjudicator to v2.1</p>
          </div>
          <span className={`px-2 py-0.5 text-[8px] font-bold tracking-wider uppercase border rounded-sm ${
            vote === "PENDING" ? "text-yellow-500 border-yellow-500/40 bg-yellow-500/10" : "text-emerald-400 border-emerald-500/40 bg-emerald-500/10"
          }`}>
            {vote === "PENDING" ? "AWAITING SIGNATURE" : "LEDGER LOCKED"}
          </span>
        </div>

        {/* Voting Inputs */}
        <div className="flex gap-2">
          <button 
            onClick={() => castVote("FOR")}
            disabled={vote !== "PENDING"}
            className="flex-1 py-2 bg-black border border-green-900 hover:border-emerald-500 hover:bg-emerald-950/20 text-emerald-400 text-[10px] font-bold rounded-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed tracking-widest uppercase"
          >
            VOTE FOR
          </button>
          <button 
            onClick={() => castVote("AGAINST")}
            disabled={vote !== "PENDING"}
            className="flex-1 py-2 bg-black border border-green-900 hover:border-red-500 hover:bg-red-950/20 text-red-400 text-[10px] font-bold rounded-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed tracking-widest uppercase"
          >
            VOTE AGAINST
          </button>
        </div>

        {/* Interactive Terminal Screen */}
        <div className="bg-black border border-green-900 p-2.5 rounded-sm font-mono text-[9px] h-24 overflow-y-auto relative flex flex-col justify-start gap-1">
          <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-green-500 to-transparent opacity-30"></div>
          {logs.length === 0 ? (
            <span className="text-green-700 animate-pulse">&gt; Awaiting Pioneer authentication...</span>
          ) : (
            logs.map((log, index) => (
              <span key={index} className={log.includes("[SUCCESS]") ? "text-emerald-400" : log.includes("[SOROBAN]") ? "text-cyan-400" : "text-green-500/80"}>
                &gt; {log}
              </span>
            ))
          )}
        </div>
      </section>

      {/* 🚀 ACTION: LINKED MESH GATEWAYS */}
      <footer className="pt-3 mt-2 border-t border-green-900/60 flex justify-between items-center">
        <Link href="/academy/module-01" className="text-green-700 hover:text-green-400 text-[10px] uppercase tracking-wider transition-colors">
          ← Module 01
        </Link>
        <Link 
          href="/academy/module-03" 
          className={`px-4 py-2 font-bold rounded-sm transition-all uppercase text-[10px] tracking-wider ${
            vote === "PENDING" 
              ? "bg-green-950/20 border border-green-900/40 text-green-800 cursor-not-allowed pointer-events-none" 
              : "bg-green-900 text-black hover:bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
          }`}
        >
          {vote === "PENDING" ? "VOTE TO PROCEED" : "Initiate Module 03 →"}
        </Link>
      </footer>
    </div>
  );
}