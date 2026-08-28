"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function VaultSyncSector() {
  const { pioneer } = useAuth();
  const router = useRouter();
  
  const [syncState, setSyncState] = useState<"IDLE" | "SYNCING" | "VERIFIED" | "FRACTURED">("IDLE");
  const [progress, setProgress] = useState(0);

  // 🛑 ZERO-TRUST PERIMETER: SSOT Check
  const isUnlocked = !!pioneer?.isAuthenticated;

  useEffect(() => {
    if (!isUnlocked) {
      // Auto-bounce unauthorized nodes back to the Hero Sector
      router.push("/");
    }
  }, [isUnlocked, router]);

  const initiateVaultSync = () => {
    setSyncState("SYNCING");
    setProgress(0);

    // Simulated Vault Manifest Hard-Coding Sequence
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setSyncState("VERIFIED");
          // Cache the sync timestamp to the local node
          localStorage.setItem("VAULT_SYNC_TS", Date.now().toString());
          return 100;
        }
        return prev + 25; // 4-tick sync simulation
      });
    }, 600);
  };

  if (!isUnlocked) return null; // Prevent UI flash before bounce

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[80vh] px-4 text-center animate-in fade-in duration-700">
      {/* Background Pulse */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-75 h-75 bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="z-10 w-full max-w-[350px] mx-auto space-y-8 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-[0_0_40px_rgba(16,185,129,0.05)]">
        
        {/* Terminal Header */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center relative shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            {syncState === "SYNCING" && (
              <div className="absolute inset-0 rounded-full border-t-2 border-emerald-500 animate-spin"></div>
            )}
            <svg className={`w-6 h-6 ${syncState === "VERIFIED" ? "text-emerald-500" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h1 className="font-mono text-xl font-bold text-slate-100 tracking-widest uppercase">
            Vault Sync
          </h1>
          <p className="text-[10px] font-mono text-slate-500 tracking-tighter uppercase">
            Target: <span className="text-emerald-400">{pioneer?.username || "UNKNOWN_NODE"}</span>
          </p>
        </div>

        {/* Sync Status Display */}
        <div className="space-y-4">
          <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div 
              className="h-full bg-emerald-500 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(16,185,129,0.8)]"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <div className="h-6">
            {syncState === "IDLE" && <p className="text-xs font-mono text-slate-400">Awaiting Handshake...</p>}
            {syncState === "SYNCING" && <p className="text-xs font-mono text-emerald-400 animate-pulse">Writing to manifest-vault.js [{progress}%]</p>}
            {syncState === "VERIFIED" && <p className="text-xs font-mono text-emerald-500 font-bold tracking-widest">SYNC COMPLETE.</p>}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={initiateVaultSync}
            disabled={syncState === "SYNCING" || syncState === "VERIFIED"}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-mono font-bold rounded-lg transition-all text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.2)]"
          >
            {syncState === "VERIFIED" ? "Ledger Locked" : "Initialize Sync"}
          </button>
          
          <button
            onClick={() => router.push('/academy/vault')}
            className="w-full py-3 px-4 bg-transparent border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 font-mono font-bold rounded-lg transition-all text-xs uppercase tracking-widest"
          >
            Return to Vault
          </button>
        </div>
        
      </div>
    </div>
  );
}