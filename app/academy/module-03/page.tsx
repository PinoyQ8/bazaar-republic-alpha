"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function ModuleThreePage() {
  const [deploymentState, setDeploymentState] = useState<"IDLE" | "COMPILING" | "DEPLOYED">("IDLE");
  const [logs, setLogs] = useState<string[]>([]);
  const [contractId, setContractId] = useState<string | null>(null);

  const initiateDeployment = () => {
    if (deploymentState !== "IDLE") return;
    
    setDeploymentState("COMPILING");
    setLogs(["[RUST] Validating DAO_Governance.rs source logic..."]);
    
    setTimeout(() => {
      setLogs((prev) => [...prev, "[WASM] Compiling to WebAssembly bytecode..."]);
      
      setTimeout(() => {
        setLogs((prev) => [...prev, "[MESH] Forging Testnet transaction envelope..."]);
        
        setTimeout(() => {
          const generatedId = `C${Math.random().toString(36).substring(2, 15).toUpperCase()}...A7F`;
          setContractId(generatedId);
          setLogs((prev) => [...prev, `[SUCCESS] Contract deployed to E-Network. ID: ${generatedId}`]);
          setDeploymentState("DEPLOYED");
        }, 1200);
      }, 1000);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono p-4 flex flex-col justify-between animate-in fade-in slide-in-from-bottom-4 duration-700 selection:bg-green-500 selection:text-black">
      
      {/* 🚀 HEADER: SECTOR IDENTITY */}
      <header className="border-b border-green-900/60 pb-3 pt-1 space-y-1.5">
        <div className="inline-block px-2 py-0.5 bg-green-950/40 border border-green-700/40 rounded-sm text-[9px] text-green-400 font-bold tracking-[0.2em] uppercase">
          Architecture Module 03
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white uppercase">
          The Soroban Forge
        </h1>
        <p className="text-green-400/80 text-[11px] leading-relaxed italic">
          "Governance without execution is just philosophy. The MESH requires automated logic directly on the ledger."
        </p>
      </header>

      {/* 🛡️ RUST & WASM ARCHITECTURE (Stacked smoothly for mobile layout tracking) */}
      <section className="space-y-2.5 my-2">
        <div className="p-3 border border-green-900/50 bg-green-950/10 rounded-sm space-y-1">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider border-b border-green-900/30 pb-1">
            Logic Purity (Rust)
          </h3>
          <p className="text-[11px] text-green-400/90 leading-normal">
            Written in Rust. Memory safety controls eliminate common smart contract security vulnerabilities natively.
          </p>
        </div>

        <div className="p-3 border border-green-900/50 bg-green-950/10 rounded-sm space-y-1">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider border-b border-green-900/30 pb-1">
            WASM Compilation
          </h3>
          <p className="text-[11px] text-green-400/90 leading-normal">
            Compiled into WebAssembly bytecode for maximum transaction finality speed across node topology frames.
          </p>
        </div>
      </section>

      {/* 🛠️ LIVE TERMINAL: THE COMPILER SIMULATION */}
      <section className="p-3 border border-green-900/60 bg-green-950/5 rounded-sm space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">Target: DAO_Governance.rs</h3>
            <p className="text-[9px] text-green-600 font-mono">v23 Mainnet Readiness Protocol</p>
          </div>
          <button 
            onClick={initiateDeployment}
            disabled={deploymentState !== "IDLE"}
            className="px-3 py-1.5 bg-green-900 hover:bg-green-500 disabled:bg-green-950/20 text-black disabled:text-green-800 border border-transparent disabled:border-green-900/40 font-mono font-bold rounded-sm transition-all text-[9px] tracking-wider uppercase"
          >
            {deploymentState === "IDLE" ? "Execute Build" : deploymentState === "COMPILING" ? "Compiling..." : "Node Synced"}
          </button>
        </div>

        {/* Interactive Terminal Output Screen */}
        <div className="bg-black border border-green-900 p-2.5 rounded-sm font-mono text-[9px] h-28 overflow-y-auto relative flex flex-col justify-start gap-1">
          <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-green-500 to-transparent opacity-30"></div>
          {logs.length === 0 ? (
            <span className="text-green-700 animate-pulse">&gt; Awaiting compiler instructions...</span>
          ) : (
            logs.map((log, index) => (
              <span key={index} className={
                log.includes("[SUCCESS]") ? "text-emerald-400 font-bold" : 
                log.includes("[WASM]") ? "text-cyan-400" : 
                "text-green-500/80"
              }>
                &gt; {log}
              </span>
            ))
          )}
        </div>

        {/* Post-Deployment Status Token */}
        {deploymentState === "DEPLOYED" && (
          <div className="p-2 bg-emerald-950/20 border border-emerald-500/30 rounded-sm flex items-center justify-between animate-in fade-in text-[10px]">
            <span className="font-mono text-emerald-400 uppercase tracking-wider">Active Contract ID</span>
            <span className="font-mono text-white bg-black border border-green-900/60 px-2 py-0.5 rounded-sm">{contractId}</span>
          </div>
        )}
      </section>

      {/* 🚀 ACTION: ACADEMY COMPLETION GATEWAY */}
      <footer className="pt-3 mt-1 border-t border-green-900/60 flex justify-between items-center">
        <Link href="/academy/module-02" className="text-green-700 hover:text-green-400 text-[10px] uppercase tracking-wider transition-colors">
          ← Module 02
        </Link>
        
        {/* 🛡️ CONDITIONAL LINKING MAPPED IN BOUNDING BOX */}
        {deploymentState === "DEPLOYED" ? (
          <Link 
            href="/dashboard"
            className="px-3 py-2 bg-green-900 text-black font-bold rounded-sm hover:bg-green-500 transition-all uppercase text-[10px] tracking-wider text-center shadow-[0_0_15px_rgba(34,197,94,0.1)]"
          >
            Complete Academy ✔
          </Link>
        ) : (
          <button 
            disabled
            className="px-3 py-2 bg-green-950/20 border border-green-900/40 text-green-800 font-mono font-bold rounded-sm uppercase text-[10px] tracking-wider cursor-not-allowed"
          >
            Deploy to Proceed
          </button>
        )}
      </footer>
    </div>
  );
}