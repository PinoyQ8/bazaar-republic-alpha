"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
// 🛡️ THE BRIDGE: Import the Server Action directly into the Client Component
import { commitModuleSignature } from "../../actions/academyActions";

export default function ModuleOneSector() {
  const router = useRouter();
  
  // 🧠 Extract the decentralized identity from the memory core
  const { pioneer } = useAuth();
  
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // 🔐 THE LOGIC GATE: Commits completion via the Server Action
  const handleCompletion = async () => {
    if (!pioneer.username) {
      console.error("[MESH-SCAN] 🚨 FATAL: Identity missing from RAM. Cannot sign payload.");
      return;
    }

    setIsSyncing(true);
    console.log(`[MESH-BRIDGE] 🟢 Initiating Module 01 signature for ${pioneer.username}...`);
    
    try {
      // 🚀 Trigger the backend Adjudicator
      const response = await commitModuleSignature(pioneer.username, "MODULE-01");

      if (response.success) {
        console.log(`[MESH-BRIDGE] ✅ Signature verified. Hash: ${response.signatureHash}`);
        // Bounce to the Hub upon successful DB write
        router.push("/academy");
      } else {
        console.error(`[MESH-BRIDGE] 🚨 Adjudicator rejected signature: ${response.message}`);
        setIsSyncing(false); // Release the UI lock so they can retry
      }
    } catch (error) {
      console.error("[MESH-BRIDGE] 🚨 Network fracture during DB sync:", error);
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen px-4 pt-8 pb-20 animate-in fade-in duration-700 bg-slate-950">
      
      {/* 🛡️ VIEWPORT LOCK: max-w-sm aligns with S23 Ultra */}
      <div className="w-full max-w-sm mx-auto space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <Link 
            href="/academy" 
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-blue-400 hover:border-blue-500/50 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="font-mono text-xl font-bold text-slate-100 uppercase tracking-tighter">
              Module 01
            </h1>
            <p className="text-[10px] font-mono text-blue-500 tracking-widest uppercase">
              The MESH Genesis
            </p>
          </div>
        </div>

        {/* 📖 E-Network Manifest Content */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          <h2 className="text-sm font-mono font-bold text-slate-200 uppercase border-b border-slate-800 pb-2">
            Directive 1: Decentralized Security
          </h2>
          <p className="text-xs text-slate-400 font-mono leading-relaxed">
            The Bazaar Republic is not a traditional platform; it is an <span className="text-blue-400">E-Network</span>. Your mobile node is a localized logic forge. You do not rely on central servers to validate your truth. 
          </p>
          <p className="text-xs text-slate-400 font-mono leading-relaxed">
            The <span className="text-emerald-400">90% Uptime Shield</span> is maintained by the Pioneers. If a node fractures, the DAO reroutes the logic.
          </p>

          <h2 className="text-sm font-mono font-bold text-slate-200 uppercase border-b border-slate-800 pb-2 pt-4">
            Directive 2: Zero-Trust Perimeter
          </h2>
          <p className="text-xs text-slate-400 font-mono leading-relaxed">
            Every transaction, governance vote, and protocol shift must be signed by your Pi Network Wallet. Trust is mathematical, not assumed.
          </p>
        </div>

        {/* 🔐 The Logic Gate Switch */}
        <div className="flex items-center gap-3 p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <button 
            onClick={() => setIsAcknowledged(!isAcknowledged)}
            className={`w-6 h-6 rounded flex items-center justify-center transition-all ${
              isAcknowledged ? "bg-emerald-500 border-emerald-400" : "bg-slate-800 border-slate-600"
            } border`}
          >
            {isAcknowledged && (
              <svg className="w-4 h-4 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          <span className="text-xs font-mono text-slate-300 uppercase tracking-wider">
            Acknowledge MESH Directives
          </span>
        </div>

        {/* 🚀 Execution Bridge */}
        <button
          onClick={handleCompletion}
          disabled={!isAcknowledged || isSyncing}
          className={`w-full py-4 rounded-xl font-mono text-xs font-bold uppercase tracking-widest transition-all ${
            isAcknowledged 
              ? "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]" 
              : "bg-slate-800 text-slate-500 cursor-not-allowed"
          }`}
        >
          {isSyncing ? "Forging Signature..." : "Commit to Ledger"}
        </button>

      </div>
    </div>
  );
}