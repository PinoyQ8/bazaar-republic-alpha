"use client";

import React from "react";
import Link from "next/link";

export default function DaoArchitectureModule() {
  return (
    <main className="max-w-[384px] mx-auto p-4 min-h-screen bg-zinc-950 text-zinc-100 font-mono selection:bg-emerald-500/30">
      
      {/* 🛡️ MODULE HEADER */}
      <div className="mb-6 border-b border-zinc-800 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-emerald-400 font-bold tracking-widest uppercase text-sm">DAO ARCHITECTURE</h2>
          <p className="text-zinc-500 text-xs mt-1">Module Status: <span className="text-emerald-500 font-bold">ACTIVE SYNC</span></p>
        </div>
        <div className="text-[10px] text-zinc-600 border border-zinc-800 px-2 py-1 rounded">
          L1 MATRIX
        </div>
      </div>

      {/* 🛡️ CONSTITUTIONAL DATA: THE 5 TIERS */}
      <div className="space-y-6">
        <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
          <h3 className="text-emerald-300 font-bold text-xs tracking-wider uppercase mb-3 border-b border-zinc-800 pb-2">
            The 5-Tier Governance
          </h3>
          <ul className="text-xs text-zinc-400 space-y-3">
            <li className="flex justify-between items-center">
              <span className="text-emerald-500">Founder</span>
              <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">20% + Soft Veto</span>
            </li>
            <li className="flex justify-between items-center">
              <span className="text-emerald-500">Genesis</span>
              <span>20% Weight</span>
            </li>
            <li className="flex justify-between items-center">
              <span className="text-emerald-500">Merchant</span>
              <span>20% Weight</span>
            </li>
            <li className="flex justify-between items-center">
              <span className="text-emerald-500">Service Provider</span>
              <span>20% Weight</span>
            </li>
            <li className="flex justify-between items-center">
              <span className="text-emerald-500">Citizen</span>
              <span>20% Weight</span>
            </li>
          </ul>
          <p className="text-[10px] text-zinc-500 mt-4 pt-3 border-t border-zinc-800 leading-relaxed">
            * Ratification requires exactly 80% consensus across all active nodes in the E-Network. Trust Score (TS) and active Stake dictate influence validation.
          </p>
        </div>

        {/* 🛡️ CONSTITUTIONAL DATA: THE ANCHORS */}
        <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
          <h3 className="text-emerald-300 font-bold text-xs tracking-wider uppercase mb-3 border-b border-zinc-800 pb-2">
            Protocol Anchors
          </h3>
          <div className="space-y-5 text-xs">
            <div>
              <h4 className="text-zinc-300 font-bold mb-1 uppercase tracking-wider">1. The Uptime Shield</h4>
              <p className="text-zinc-500 leading-relaxed">
                Nodes dropping below 90% availability face immediate Trust Score penalties. Voting rights are mathematically suspended if uptime drops below 85%.
              </p>
            </div>
            <div>
              <h4 className="text-zinc-300 font-bold mb-1 uppercase tracking-wider">2. The Immutable Peg</h4>
              <p className="leading-relaxed font-bold text-amber-500/80">
  1 Pi = 1 BZR = 1000 mBZR.
              </p>
              <p className="text-zinc-500 leading-relaxed mt-1">
                Hard-coded. Non-negotiable. Zero subjective pricing logic permitted.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 🛡️ RETURN BRIDGE */}
      <div className="mt-8">
        <Link href="/academy" className="block w-full outline-none">
          <button className="w-full py-3 bg-zinc-950 border border-zinc-800 hover:border-emerald-500 hover:text-emerald-400 text-zinc-500 text-xs font-bold uppercase tracking-wider rounded transition-all">
            Terminate Matrix & Return
          </button>
        </Link>
      </div>

    </main>
  );
}