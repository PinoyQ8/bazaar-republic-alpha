"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function GenesisNodePage() {
  // 🛠️ 1. TELEMETRY & MOUNT STATES
  const [syncStatus, setSyncStatus] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [checklist, setChecklist] = useState({
    piIdentity: false,
    bridgeHandshake: true, // Preset by Genesis execution
    meshBuffer: false,
    moduleComplete: false,
  });

  // 🛡️ 2. IDENTITY HYDRATION: Auto-Verify Master Node on Layer Mount
  useEffect(() => {
    const savedMaster = localStorage.getItem('Bazaar_Master_TS');
    if (savedMaster?.toLowerCase() === 'pinoyq8') {
      setChecklist((prev) => ({
        ...prev,
        piIdentity: true, // Auto-resolve identity checklist for Founder node
      }));
      setSyncStatus(50); // Pre-sync the network dial to 50%
    }
  }, []);

  // 🚀 3. CORE HANDSHAKE ENGINE
  const handleInitiateModule = async () => {
    console.log("[MESH-INIT] Initiating Module 01 Protocol...");
    const localMasterToken = localStorage.getItem('Bazaar_Master_TS') || "PinoyQ8";
    setIsProcessing(true); // Engaged UI firewall locks

    try {
      const response = await fetch('/api/academy/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localMasterToken}`
        },
        body: JSON.stringify({ moduleId: "01" })
      });

      // 🛡️ CRITICAL BOUNDARY GUARD: Intercept HTML leaks before parsing JSON
      if (!response.ok) {
        const rawText = await response.text();
        console.error(`[MESH-ERROR] API returned Status ${response.status}. Payload trace:`, rawText);
        throw new Error(`PCT Edge Exception: Server responded with status ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log("[MESH-SYNC] Module 01 initiated successfully in backend vault.");
        
        // 🟢 MUTATE ALL CHECKS ON LEDGER RESOLUTION
        setChecklist((prev) => ({ 
          ...prev, 
          piIdentity: true,
          meshBuffer: true, 
          moduleComplete: true 
        }));
        
        setSyncStatus(100); // Drive the metric panel to full execution
      } else {
        throw new Error(data.error || "Adjudicator rejected state verification.");
      }

    } catch (error: any) {
      console.error("[browser] [MESH-SCAN FAILURE]:", error.message);
    } finally {
      setIsProcessing(false); // Disengage structural locks
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* 🚀 HEADER: SECTOR IDENTITY */}
      <header className="space-y-4">
        <div className="inline-block px-3 py-1 bg-blue-600/10 border border-blue-600/30 rounded text-[10px] text-blue-400 font-bold tracking-[0.3em] uppercase">
          Orientation Module 00
        </div>
        <h1 className="text-4xl font-extrabold tracking-tighter text-white uppercase">
          The Genesis Node
        </h1>
        <p className="text-slate-400 max-w-2xl text-sm leading-relaxed italic">
          "The stability of the DAO depends on the logic purity of its Founders. 
          The MESH Protocol is not just code—it is the digital DNA of the Bazaar Republic."
        </p>
      </header>

      {/* 🛡️ MISSION OBJECTIVE */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 p-8 bg-slate-900/40 border border-slate-800 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg className="w-24 h-24 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h3 className="text-blue-500 font-bold mb-4 uppercase tracking-widest text-xs">Mission Objective</h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            In this sector, you will verify the underlying **E-Network architecture**. 
            As a Pioneer, your node must be synchronized with the Bazaar Republic's 
            Security Adjudicator before you can participate in DAO Governance.
          </p>
        </div>
        
        <div className="p-8 bg-blue-600/5 border border-blue-900/30 rounded-xl flex flex-col justify-center">
          <span className="text-4xl font-bold text-blue-500 mb-2 font-mono transition-all duration-300">
            {syncStatus}%
          </span>
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
            Protocol Sync Status
          </span>
        </div>
      </section>

      {/* 🛠️ ARCHITECTURE OVERVIEW: THE E-NETWORK */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-slate-100 uppercase tracking-tight">E-Network Architecture</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-6 border border-slate-800 bg-slate-950 rounded-lg space-y-3">
            <h4 className="text-sm font-bold text-blue-400 font-mono underline decoration-blue-900 underline-offset-4">Sector 01: The Mesh</h4>
            <p className="text-xs text-slate-500 font-mono">
              The decentralized backbone utilizing Stellar-based Soroban smart contracts for transaction finality.
            </p>
          </div>
          <div className="p-6 border border-slate-800 bg-slate-950 rounded-lg space-y-3">
            <h4 className="text-sm font-bold text-blue-400 font-mono underline decoration-blue-900 underline-offset-4">Sector 02: The Vault</h4>
            <p className="text-xs text-slate-500 font-mono">
              Secure HttpOnly session management and identity verification via the Pi Network SDK.
            </p>
          </div>
        </div>
      </section>

      {/* 🏁 INITIALIZATION STEPS */}
      <section className="p-8 border border-slate-800 bg-slate-900/20 rounded-xl space-y-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Initialization Checklist</h3>
        <div className="space-y-4">
          <CheckItem label="Verify Pi Network Identity (P23 Compliant)" checked={checklist.piIdentity} />
          <CheckItem label="Initialize Bridge Handshake (Done via Genesis Sector)" checked={checklist.bridgeHandshake} />
          <CheckItem label="Sync local MESH with Mainnet-Alpha Buffer" checked={checklist.meshBuffer} />
          <CheckItem label="Complete Module 01: Protocol Logic" checked={checklist.moduleComplete} />
        </div>
      </section>

      {/* 🚀 ACTION: ENTER NEXT MODULE / DAO ACCESS GATE */}
      <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center gap-4">
        
        {/* Real-time Status Readout */}
        <div className="font-mono text-[11px] tracking-wider uppercase">
          {syncStatus === 100 ? (
            <span className="text-emerald-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              [SECURITY ADJUDICATOR]: Access Granted. Security Circle Unlocked.
            </span>
          ) : (
            <span className="text-slate-500">
              [SYSTEM]: Awaiting full E-Network ledger synchronization...
            </span>
          )}
        </div>

        {/* Dynamic Interactive Logic Gate */}
        <div>
          {syncStatus === 100 ? (
            <Link
              href="/academy/protocol-forge" // 🛰️ Target route for Module 01: Protocol Logic
              className="inline-block px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold rounded shadow-[0_0_25px_rgba(16,185,129,0.3)] hover:shadow-[0_0_35px_rgba(16,185,129,0.5)] transition-all uppercase text-xs tracking-widest text-center animate-in fade-in zoom-in-95 duration-500"
            >
              Enter Module 01: Logic Forge →
            </Link>
          ) : (
            <button
              onClick={handleInitiateModule}
              disabled={isProcessing}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-mono font-bold rounded shadow-[0_0_20px_rgba(37,99,235,0.2)] disabled:shadow-none transition-all uppercase text-xs tracking-widest min-w-55 text-center"
            >
              {isProcessing ? "Synchronizing..." : "Initiate Module 01 →"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

// 🛡️ REUSABLE CHECKLIST ITEM
function CheckItem({ label, checked = false }: { label: string; checked?: boolean }) {
  return (
    <div className="flex items-center gap-4 group">
      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all duration-300 ${checked ? 'bg-blue-600 border-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.4)]' : 'border-slate-700 group-hover:border-slate-500'}`}>
        {checked && (
          <svg className="w-3 h-3 text-white animate-in zoom-in-50 duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className={`text-xs font-mono transition-all duration-300 ${checked ? 'text-slate-500 line-through decoration-slate-700' : 'text-slate-300'}`}>
        {label}
      </span>
    </div>
  );
}