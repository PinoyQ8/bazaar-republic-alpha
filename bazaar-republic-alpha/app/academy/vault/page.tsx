"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function VaultSector() {
  const { pioneer } = useAuth();
  const [isDecrypting, setIsDecrypting] = useState(true);
  const [syncTime, setSyncTime] = useState<string>("");

  // 🛡️ SIMULATED DECRYPTION PROTOCOL
  useEffect(() => {
    // Generate a static timestamp for the current session sync
    const now = new Date();
    setSyncTime(now.toISOString().replace("T", " ").substring(0, 19));

    // Force the Adjudicator to hold the UI in a "locked" state for 1.2 seconds
    const timer = setTimeout(() => {
      setIsDecrypting(false);
      console.log(`[MESH-SCAN] 🟢 Vault decrypted for Node: ${pioneer.username}`);
    }, 1200);

    return () => clearTimeout(timer);
  }, [pioneer.username]);

  // Generate a deterministic mock hash based on the username for visual anchor
  const generateMockHash = (name: string) => {
    if (!name) return "0x0000...0000";
    const prefix = name.substring(0, 3).toUpperCase();
    return `PI-${prefix}8F9A...${name.length}C42`;
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen px-4 pt-8 pb-20 animate-in fade-in duration-700 bg-slate-950">
      
      {/* 🛡️ VIEWPORT LOCK: max-w-sm aligns with S23 Ultra */}
      <div className="w-full max-w-sm mx-auto space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Link 
              href="/academy" 
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="font-mono text-xl font-bold text-slate-100 uppercase tracking-tighter">
                The Vault
              </h1>
              <p className="text-[10px] font-mono text-emerald-500 tracking-widest uppercase">
                Secure Data Viewer
              </p>
            </div>
          </div>
          
          {/* Uptime Shield Indicator */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900 border border-slate-800 rounded">
            <span className={`w-1.5 h-1.5 rounded-full ${isDecrypting ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
            <span className="text-[9px] font-mono text-slate-400 uppercase">
              {isDecrypting ? "Locked" : "Synced"}
            </span>
          </div>
        </div>

        {/* 🔐 DECRYPTION OVERLAY */}
        {isDecrypting ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 border-t-2 border-emerald-500 rounded-full animate-spin"></div>
              <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="font-mono text-xs text-emerald-500 uppercase tracking-widest animate-pulse">
              Decrypting Ledger...
            </p>
          </div>
        ) : (
          /* 🗄️ DECRYPTED LEDGER VIEW */
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Identity Block */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <h2 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Node Identity</h2>
              <p className="text-lg font-mono font-bold text-slate-200">
                {pioneer.username || "UNKNOWN_NODE"}
              </p>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800">
                <span className="text-[10px] font-mono text-slate-500 uppercase">Clearance:</span>
                <span className="text-xs font-mono font-bold text-blue-400">{pioneer.tier || "PIONEER"}</span>
              </div>
            </div>

            {/* Cryptographic Anchor */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
              <h2 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Pi Public Anchor (Mock)</h2>
              <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded px-3 py-2 mt-2">
                <span className="text-xs font-mono text-emerald-400 truncate">
                  {generateMockHash(pioneer.username || "")}
                </span>
                <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            {/* Sync Metadata */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
              <h2 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-3">MESH Telemetry</h2>
              <ul className="space-y-2">
                <li className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400">Last Sync</span>
                  <span className="text-slate-200">{syncTime}</span>
                </li>
                <li className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400">Protocol</span>
                  <span className="text-slate-200">Neo (Project Bazaar)</span>
                </li>
                <li className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400">Network</span>
                  <span className="text-slate-200">v23-MAINNET-ALPHA</span>
                </li>
              </ul>
            </div>

            {/* Action Matrix */}
            <div className="pt-2">
              <button 
                onClick={() => setIsDecrypting(true)}
                className="w-full py-3 bg-slate-900 border border-slate-700 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-400 font-mono text-xs rounded-lg transition-all uppercase tracking-widest flex items-center justify-center gap-2 group"
              >
                <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Force Ledger Refresh
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}