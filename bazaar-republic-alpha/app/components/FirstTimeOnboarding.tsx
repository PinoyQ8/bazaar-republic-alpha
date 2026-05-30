"use client";

import React from "react";

export default function FirstTimeOnboarding() {
  return (
    <main className="max-w-[384px] mx-auto p-6 min-h-screen bg-zinc-950 text-zinc-100 font-mono">
      <h1 className="text-emerald-500 text-2xl font-bold uppercase tracking-widest mb-6">
        Welcome to the Republic
      </h1>
      
      <div className="space-y-6 text-sm text-zinc-400">
        <p>You are entering a Decentralized Autonomous Organization anchored by the Pi Network.</p>
        
        <div className="p-4 border border-emerald-900/50 bg-emerald-950/10 rounded-lg">
          <h3 className="text-emerald-400 font-bold mb-2">The Mandate</h3>
          <p className="text-xs leading-relaxed">
            We operate on 80% consensus. Influence is derived from Trust Score (TS) and active collateral locking.
          </p>
        </div>

        <button 
          onClick={() => window.location.href = "/auth/pi-handshake"}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-black font-bold uppercase tracking-wider rounded transition-all"
        >
          Initialize Pi Wallet Handshake
        </button>
      </div>
      
      <footer className="mt-12 text-[10px] text-zinc-600 text-center">
        MESH PROTOCOL v24 | BAZAAR REPUBLIC
      </footer>
    </main>
  );
}