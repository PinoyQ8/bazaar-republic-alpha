"use client";

import React, { useState } from "react";
import SecurityCircleHUD from "../components/SecurityCircleHUD";
import MeshStakeButton from "../components/MeshStakeButton";
import { useAuth } from "@/context/AuthContext";
import { ShieldCheck, RefreshCw, Layers } from "lucide-react";

export default function VaultPage() {
  const { pioneer, isHydrated } = useAuth();
  const [escrowId, setEscrowId] = useState("MBZR_ESCROW_CANARY_01");
  const [isSyncing, setIsSyncing] = useState(false);
  const [escrowStatus, setEscrowStatus] = useState<string | null>(null);

  // ðŸ›¡ï¸ Loading & Auth Lockout Viewport
  if (!isHydrated || !pioneer?.isAuthenticated || !pioneer?.username) {
    return (
      <div className="min-h-screen bg-black text-zinc-400 p-6 flex flex-col items-center justify-center font-mono space-y-4">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="animate-pulse tracking-widest text-emerald-500 text-xs border border-emerald-900/60 p-3 rounded bg-emerald-950/20">
          [SECURITY GATE] AWAITING NODE UPLINK...
        </p>
      </div>
    );
  }

  const activeNodeId = pioneer.username;

  const handleSyncEscrow = async () => {
    setIsSyncing(true);
    setEscrowStatus("Processing MESH Cryptographic Pipeline...");
    
    // Simulate/Trigger on-chain Soroban query
    setTimeout(() => {
      setIsSyncing(false);
      setEscrowStatus("No active escrow loaded. Sync an Escrow ID.");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-300 p-4 font-mono pb-24 flex flex-col items-center">
      <div className="w-full max-w-[384px] space-y-5">
        
        {/* VAULT HEADER */}
        <div className="border-b border-zinc-800 pb-3 mt-2 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-emerald-400 tracking-widest uppercase flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Treasury Vault
            </h1>
            <p className="text-zinc-500 text-[11px] mt-0.5">
              Protocol Node // S23 Ultra Viewport (384x854)
            </p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-400">
            v28.0.0
          </span>
        </div>

        {/* ðŸ›¡ï¸ ESCROW NODE CONTROLLER (Stacked to prevent mobile overflow) */}
        <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-4 space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" /> Escrow Anchor ID
            </span>
            <span className="text-[10px] text-zinc-500">Soroban Layer-2</span>
          </div>

          {/* Vertical Stack: Full-Width Input + Full-Width Button */}
          <div className="flex flex-col gap-2.5 w-full">
            <input
              type="text"
              value={escrowId}
              onChange={(e) => setEscrowId(e.target.value)}
              placeholder="e.g. MBZR_ESCROW_CANARY_01"
              className="w-full bg-zinc-900/90 border border-zinc-700/80 rounded px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 transition-colors"
            />

            <button
              onClick={handleSyncEscrow}
              disabled={isSyncing}
              className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-black font-bold py-2.5 px-3 rounded font-mono text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing Pipeline..." : "Sync Escrow Node"}
            </button>
          </div>

          {/* Status Display Area */}
          {escrowStatus && (
            <p className="text-[11px] text-zinc-400 text-center pt-1 border-t border-zinc-900 animate-fadeIn">
              {escrowStatus}
            </p>
          )}
        </div>

        {/* HUD MOUNT */}
        <SecurityCircleHUD pioneerId={activeNodeId} />

        {/* STAKE TRANSACTION MODULE */}
        <MeshStakeButton pioneerId={activeNodeId} />

      </div>
    </div>
  );
}
