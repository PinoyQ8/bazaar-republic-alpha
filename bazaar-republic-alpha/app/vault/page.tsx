"use client";

import SecurityCircleHUD from "../components/SecurityCircleHUD";
// 🛡️ THE TRUE IMPORT BRIDGE
import { useAuth } from "@/context/AuthContext";

export default function VaultPage() {
  // 1. Pull the exact variables broadcasted by your True Engine
  const { pioneer, isHydrated } = useAuth(); 

  // 2. 🛑 THE AUTHENTICATION GATE (Bulletproofed with Optional Chaining)
  if (!isHydrated || !pioneer?.isAuthenticated || !pioneer?.username) {
    return (
      <div className="min-h-screen bg-black text-zinc-400 p-6 flex items-center justify-center font-mono">
        <p className="animate-pulse tracking-widest text-emerald-900 border border-emerald-900 p-4 rounded bg-emerald-950/20">
          AWAITING NODE UPLINK...
        </p>
      </div>
    );
  }

  // 3. Identity is confirmed. Lock the routing variable.
  const activeNodeId = pioneer.username;

  return (
    /* 🛡️ S23 VIEWPORT SHIELD: Locked to max-w-[384px] to align with Mobile Dock */
    <div className="min-h-screen bg-black text-zinc-300 p-4 font-mono pb-24 flex flex-col items-center">
      <div className="w-full max-w-[384px] space-y-6">
        
        {/* VAULT HEADER */}
        <div className="border-b border-zinc-800 pb-4 mt-4">
          <h1 className="text-xl font-bold text-emerald-400 tracking-widest uppercase">
            DAO Treasury Vault
          </h1>
          <p className="text-zinc-500 text-xs mt-1">
            Sector 1: Security Circle & Node Staking
          </p>
        </div>

        {/* HUD MOUNT */}
        <SecurityCircleHUD pioneerId={activeNodeId} />

      </div>
    </div>
  );
}