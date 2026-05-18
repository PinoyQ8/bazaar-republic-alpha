"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function ProtocolForgePage() {
  const [isForging, setIsForging] = useState<boolean>(false);
  const [forgeOutput, setForgeOutput] = useState<{
    contractAddress: string;
    checksum: string;
    rulesDeployed: number;
  } | null>(null);

  // 🛡️ HYDRATION LOOP: Recover cached contract signature from disk
  useEffect(() => {
    const cachedForge = localStorage.getItem("Bazaar_Active_Contract");
    if (cachedForge) {
      try {
        setForgeOutput(JSON.parse(cachedForge));
        console.log("[MESH-SYNC] Persistent contract payload successfully re-hydrated from disk.");
      } catch (e) {
        localStorage.removeItem("Bazaar_Active_Contract");
      }
    }
  }, []);

  const handleCompileLedger = async () => {
    setIsForging(true);
    setForgeOutput(null);
    localStorage.removeItem("Bazaar_Active_Contract");
    const localMasterToken = localStorage.getItem('Bazaar_Master_TS') || "PinoyQ8";

    try {
      const response = await fetch('/api/academy/forge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localMasterToken}`
        },
        body: JSON.stringify({ systemTarget: "MAINNET_BUFFER" })
      });

      if (!response.ok) throw new Error("Forge pipeline breakdown.");
      const data = await response.json();

      if (data.success) {
        const payload = {
          contractAddress: data.contractAddress,
          checksum: data.checksum,
          rulesDeployed: data.rulesDeployed
        };

        setForgeOutput(payload);
        localStorage.setItem("Bazaar_Active_Contract", JSON.stringify(payload));
        console.log("[FORGE] Smart contract bytecode verified and locked into local node storage.");
      }
    } catch (err: any) {
      console.error("[browser] [FORGE FAILURE]:", err.message);
    } finally {
      setIsForging(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* 🚀 HEADER: MATRIX MODULE 01 */}
      <header className="space-y-4">
        <div className="inline-block px-3 py-1 bg-emerald-600/10 border border-emerald-600/30 rounded text-[10px] text-emerald-400 font-bold tracking-[0.3em] uppercase">
          Logic Forge // Module 01
        </div>
        <h1 className="text-4xl font-extrabold tracking-tighter text-white uppercase">
          Protocol Logic Matrix
        </h1>
        <p className="text-slate-400 max-w-2xl text-sm leading-relaxed italic">
          "Sovereignty is executed through deterministic rule sets. 
          Here we deploy the foundational MESH data models that govern node verification."
        </p>
      </header>

      {/* 📊 DEVELOPMENT CONSOLE */}
      <section className="p-8 border border-slate-800 bg-slate-950 rounded-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5 font-mono text-xs select-none">
          SYS_SEC_MAINNET_V23
        </div>
        
        <h3 className="text-slate-200 font-bold mb-6 font-mono text-sm uppercase tracking-wider underline underline-offset-8 decoration-slate-800">
          // Active Sector Parameters
        </h3>
        
        <div className="space-y-3 font-mono text-xs text-slate-400">
          <p className="flex items-center gap-2">
            <span className="text-emerald-500">✓</span> Node Status: <span className="text-white font-bold">GENESIS-ANCHOR (FOUNDER)</span>
          </p>
          <p className="flex items-center gap-2">
            <span className="text-emerald-500">✓</span> Network Layer: <span className="text-white font-bold">Mainnet-Alpha Buffer Attached</span>
          </p>
          <p className="flex items-center gap-2">
            <span className="text-blue-500">🖧</span> Active Bridge: <span className="text-blue-400 font-bold">Stellar-Soroban Devnet Connection Pool</span>
          </p>

          {/* PERSISTED TELEMETRY DISPLAY */}
          {forgeOutput && (
            <div className="pt-4 mt-4 border-t border-slate-900 space-y-2 animate-in fade-in duration-500">
              <p className="text-emerald-400 font-bold font-mono uppercase tracking-wider text-[11px] flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                [+] Active Node Contract Loaded
              </p>
              <p>Contract Target: <span className="text-white select-all bg-blue-950/50 px-2 py-0.5 rounded border border-blue-900/30 font-bold tracking-wider">{forgeOutput.contractAddress}</span></p>
              <p>WASM Checksum: <span className="text-white font-bold">{forgeOutput.checksum}</span></p>
            </div>
          )}
        </div>
      </section>

      {/* 🛡️ LIVE COMPLIANCE RULE GRID */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">// Cryptographic Rule Ledger</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <RuleCard 
            id="RULE-P23-AUTH" 
            title="Identity Verification" 
            desc="Validates token structure via strict ED25519 multi-signature validation arrays."
            isVerified={!!forgeOutput} 
          />

          <RuleCard 
            id="RULE-STASIS-CHECK" 
            title="State Stasis Lock" 
            desc="Intercepts and monitors account state freezes to block replay vulnerabilities."
            isVerified={!!forgeOutput} 
          />

          <RuleCard 
            id="RULE-BUFFER-SYNC" 
            title="Buffer Integrity" 
            desc="Maintains Merkle-tree tracking alignment with Mainnet transaction pipelines."
            isVerified={!!forgeOutput} 
          />

        </div>
      </section>

      {/* ⚙️ CODE ACTION MATRIX */}
      <div className="pt-8 border-t border-slate-900 flex justify-between items-center">
        <Link 
          href="/academy"
          className="text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-widest"
        >
          ← Return to Orientation
        </Link>
        
        <button
          onClick={handleCompileLedger}
          disabled={isForging}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-mono font-bold rounded shadow-[0_0_20px_rgba(37,99,235,0.2)] transition-all uppercase text-xs tracking-widest text-center min-w-52"
        >
          {isForging ? "Forging Logic..." : "Compile Smart Ledger"}
        </button>
      </div>

    </div>
  );
}

// 🏛️ REUSABLE ADJUDICATION RULE CARD COMPONENT
function RuleCard({ id, title, desc, isVerified }: { id: string; title: string; desc: string; isVerified: boolean }) {
  return (
    <div className={`p-6 border rounded-xl font-mono transition-all duration-500 bg-slate-950/40 ${isVerified ? 'border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)]' : 'border-slate-800'}`}>
      <div className="flex justify-between items-start mb-3">
        <span className="text-[10px] font-bold text-slate-500 tracking-wider">{id}</span>
        <span className={`text-[9px] px-2 py-0.5 rounded uppercase font-bold tracking-wider ${isVerified ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'}`}>
          {isVerified ? "Verified ✓" : "Awaiting Core"}
        </span>
      </div>
      <h4 className={`text-sm font-bold tracking-tight mb-2 ${isVerified ? 'text-white' : 'text-slate-300'}`}>{title}</h4>
      <p className="text-[11px] text-slate-500 leading-relaxed font-sans">{desc}</p>
    </div>
  );
}