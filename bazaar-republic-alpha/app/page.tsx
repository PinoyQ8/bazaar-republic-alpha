"use client";

import { useMeshStatus } from "@/app/components/MeshInitializer";
import { Loader2, Terminal, ShieldCheck } from "lucide-react";

export default function HomePage() {
  const { isPiReady } = useMeshStatus();

  // 🛡️ BOOT GRAPHICS GATE
  if (!isPiReady) {
    return (
      // Changed to flex-1/h-[80vh] to center perfectly within the RootLayout's main viewport
      <div className="flex flex-col items-center justify-center h-[80vh] w-full">
        <div className="border border-amber-500/30 bg-neutral-900/50 p-8 rounded flex flex-col items-center max-w-sm w-full text-center space-y-4 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-xs font-mono tracking-widest text-amber-500 uppercase animate-pulse">
            Initializing MESH...
          </p>
          <div className="w-full text-[10px] text-neutral-500 border-t border-neutral-800 pt-3 flex justify-between uppercase font-mono">
            <span>Node: X570-Taichi</span>
            <span>Status: Syncing</span>
          </div>
        </div>
      </div>
    );
  }

  // 🚀 LIVE COMMAND LAYER (Swaps automatically when true)
  return (
    // Replaced <main> with <div>. Removed max-w-[384px]. Added fade-in animation.
    <div className="space-y-6 font-mono animate-in fade-in duration-500">
      
      {/* COMMAND CENTER HEADER */}
      <header className="border-b border-neutral-800 pb-4 flex justify-between items-end">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Terminal className="w-5 h-5 text-amber-500" />
            <h1 className="text-2xl font-bold text-amber-500 tracking-widest uppercase">
              Bazaar Republic
            </h1>
          </div>
          <p className="text-xs text-neutral-500 uppercase tracking-widest">
            E-Network Command Node • Protocol 24 Active
          </p>
        </div>
        
        {/* SYNC BADGE */}
        <div className="hidden md:flex items-center space-x-2 bg-emerald-950/30 border border-emerald-900/50 px-3 py-1 rounded">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold">Mesh Synced</span>
        </div>
      </header>

      {/* DASHBOARD WIDGETS ANCHOR */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded text-center">
        <p className="text-neutral-500 text-sm tracking-widest uppercase">
          Awaiting Pioneer Directives...
        </p>
        {/* Inject your ProviderList or Security Circle preview here */}
      </div>

    </div>
  );
}