// Location: app/academy/module-03/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

// 🛡️ LOCAL MESH CONSTANTS (Bypasses import resolution desyncs)
const MESH_VERSION = "v25.0.ALPHA";
const MESH_STATUS = "L1 MATRIX LOCKED";

export default function Module03Page() {
  // 🛡️ HYDRATION GATE
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 🛡️ BUILD-WORKER SHIELD: Bypasses SSR prerender crash
  if (!isClient) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 font-mono text-zinc-500 text-xs">
        [INITIALIZING ACADEMY NODE...]
      </div>
    );
  }

  // 🛡️ SAFE CLIENT LOGIC & MESH STYLING
  return (
    <main className="max-w-[384px] mx-auto p-4 min-h-screen bg-zinc-950 text-zinc-100 font-mono selection:bg-emerald-500/30">
      
      {/* 🛡️ MODULE HEADER */}
      <div className="mb-6 border-b border-zinc-800 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-emerald-400 font-bold tracking-widest uppercase text-sm">ACADEMY // MODULE 03</h2>
          <p className="text-zinc-500 text-xs mt-1">Status: <span className="text-emerald-500 font-bold">{MESH_STATUS}</span></p>
        </div>
        <div className="text-[10px] text-zinc-600 border border-zinc-800 px-2 py-1 rounded">
          {MESH_VERSION}
        </div>
      </div>

      {/* 🛡️ MODULE CONTENT */}
      <div className="space-y-6">
        <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg shadow-[0_0_15px_rgba(0,0,0,0.3)]">
          <h3 className="text-emerald-300 font-bold text-xs tracking-wider uppercase mb-3 border-b border-zinc-800 pb-2">
            Consensus & Security Vectors
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Module 03 covers the operational mechanics of the MESH protocol, decentralized quorum enforcement, and the S23 mobile node verification matrix.
          </p>
        </div>
      </div>

      {/* 🛡️ RETURN BRIDGE */}
      <div className="mt-8">
        <Link href="/academy" className="block w-full">
          <button className="w-full py-3 bg-zinc-950 border border-zinc-800 hover:border-emerald-500 hover:text-emerald-400 text-zinc-500 text-xs font-bold uppercase tracking-wider rounded transition-all">
            Terminate Module & Return
          </button>
        </Link>
      </div>

    </main>
  );
}