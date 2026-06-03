"use client";

import { useMeshStatus } from "@/app/components/MeshInitializer";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const { isPiReady } = useMeshStatus();

  // 🛡️ BOOT GRAPHICS GATE
  if (!isPiReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-amber-500 font-mono p-4">
        <div className="border border-amber-500/30 bg-neutral-900/50 p-6 rounded-lg max-w-sm w-full text-center space-y-4 shadow-xl">
          <div className="flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
          <p className="text-xs tracking-widest uppercase animate-pulse">
            Initializing MESH...
          </p>
          <div className="text-[10px] text-neutral-500 border-t border-neutral-800 pt-2">
            X570 Taichi Workstation // Sandbox Mode
          </div>
        </div>
      </div>
    );
  }

  // 🚀 LIVE COMMAND LAYER (Swaps automatically when true)
  return (
    <main className="p-4 max-w-[384px] mx-auto min-h-screen">
      {/* Your actual dashboard markup or <ProviderList /> goes directly here */}
      <h1 className="text-lg font-bold text-amber-400">BAZAAR REPUBLIC DEPLOYED</h1>
      <p className="text-xs text-neutral-400 mt-1">E-Network core fully synced with Mongo Ledger.</p>
    </main>
  );
}