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
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* 🚀 HEADER: SECTOR IDENTITY */}
      <header className="space-y-4">
        <div className="inline-block px-3 py-1 bg-blue-600/10 border border-blue-600/30 rounded text-[10px] text-blue-400 font-bold tracking-[0.3em] uppercase">
          Architecture Module 03
        </div>
        <h1 className="text-4xl font-extrabold tracking-tighter text-white uppercase">
          The Soroban Forge
        </h1>
        <p className="text-slate-400 max-w-2xl text-sm leading-relaxed italic">
          "Governance without execution is just philosophy. The MESH requires Pioneers to deploy immutable, automated logic directly to the decentralized ledger."
        </p>
      </header>

      {/* 🛡️ RUST & WASM ARCHITECTURE */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 border border-slate-800 bg-slate-900/40 rounded-xl space-y-4">
          <h3 className="text-sm font-bold text-blue-500 uppercase tracking-widest border-b border-slate-800 pb-2">Logic Purity (Rust)</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-mono">
            All Bazaar smart contracts are written in Rust. Its strict memory safety prevents the logic leaks and vulnerabilities common in legacy Solidity architectures.
          </p>
        </div>

        <div className="p-6 border border-slate-800 bg-slate-900/40 rounded-xl space-y-4">
          <h3 className="text-sm font-bold text-blue-500 uppercase tracking-widest border-b border-slate-800 pb-2">WASM Compilation</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-mono">
            The Rust logic is compiled into WebAssembly (WASM). This allows the contract to run at near-native speeds across the entire E-Network node topology.
          </p>
        </div>
      </section>

      {/* 🛠️ LIVE TERMINAL: THE COMPILER SIMULATION */}
      <section className="p-8 border border-slate-800 bg-slate-900/20 rounded-xl space-y-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-widest">Target: DAO_Governance.rs</h3>
            <p className="text-[10px] text-slate-500 font-mono mt-1">v23 Mainnet Readiness Protocol</p>
          </div>
          <button 
            onClick={initiateDeployment}
            disabled={deploymentState !== "IDLE"}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-mono font-bold rounded transition-all text-[10px] tracking-widest uppercase disabled:text-slate-500"
          >
            {deploymentState === "IDLE" ? "Execute Build" : deploymentState === "COMPILING" ? "Compiling..." : "Node Synced"}
          </button>
        </div>

        {/* Interactive Terminal Output */}
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg font-mono text-[10px] min-h-32 flex flex-col justify-end space-y-1">
          {logs.length === 0 ? (
            <span className="text-slate-600 animate-pulse">&gt; Awaiting compiler instructions...</span>
          ) : (
            logs.map((log, index) => (
              <span key={index} className={
                log.includes("[SUCCESS]") ? "text-green-400 font-bold" : 
                log.includes("[WASM]") ? "text-blue-400" : 
                "text-slate-400"
              }>
                &gt; {log}
              </span>
            ))
          )}
        </div>

        {/* Post-Deployment Status */}
        {deploymentState === "DEPLOYED" && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded flex items-center justify-between animate-in fade-in">
            <span className="text-xs font-mono text-green-400 uppercase tracking-widest">Active Contract ID</span>
            <span className="text-xs font-mono text-slate-300 bg-slate-900 px-2 py-1 rounded">{contractId}</span>
          </div>
        )}
      </section>

      {/* 🚀 ACTION: ACADEMY COMPLETION */}
      <div className="pt-8 border-t border-slate-900 flex justify-between items-center">
        <Link href="/academy/module-02" className="text-slate-500 hover:text-slate-300 font-mono text-xs uppercase tracking-widest transition-colors">
          ← Back to Module 02
        </Link>
        
        {/* 🛡️ CONDITIONAL ROUTING: Only opens when deployment is proven */}
        {deploymentState === "DEPLOYED" ? (
          <Link 
            href="/dashboard"
            className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-mono font-bold rounded shadow-[0_0_20px_rgba(34,197,94,0.2)] transition-all uppercase text-xs tracking-widest text-center"
          >
            Academy Complete: Enter Command Center →
          </Link>
        ) : (
          <button 
            disabled
            className="px-8 py-3 bg-slate-800 text-slate-500 font-mono font-bold rounded transition-all uppercase text-xs tracking-widest cursor-not-allowed"
          >
            Deploy to Proceed
          </button>
        )}
      </div>
    </div>
  );
}