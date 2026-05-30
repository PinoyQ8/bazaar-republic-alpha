"use client";

import React from "react";
import Link from "next/link";

// 🛡️ CONSTITUTIONAL DATA: HARD-CODED TIER LOGIC
const GOVERNANCE_TIERS = [
  { tier: "Founder", weight: "20% + Soft Veto", role: "Constitutional Oversight" },
  { tier: "Genesis", weight: "20%", role: "Protocol Development" },
  { tier: "Merchant", weight: "20%", role: "Liquidity Provision" },
  { tier: "Service", weight: "20%", role: "E-Network Maintenance" },
  { tier: "Citizen", weight: "20%", role: "Governance Participation" },
];

export default function DaoArchitectureModule() {
  return (
    <main className="max-w-[384px] mx-auto p-4 min-h-screen bg-zinc-950 text-zinc-100 font-mono selection:bg-emerald-500/30">
      
      {/* 🛡️ MODULE HEADER */}
      <div className="mb-6 border-b border-zinc-800 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-emerald-400 font-bold tracking-widest uppercase text-sm">DAO ARCHITECTURE</h2>
          <p className="text-zinc-500 text-xs mt-1">Status: <span className="text-emerald-500 font-bold">L1 MATRIX LOCKED</span></p>
        </div>
        <div className="text-[10px] text-zinc-600 border border-zinc-800 px-2 py-1 rounded">
          v24.0.ALPHA
        </div>
      </div>

      {/* 🛡️ CONSTITUTIONAL DATA: 5-TIER GOVERNANCE */}
      <div className="space-y-6">
        <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg shadow-[0_0_15px_rgba(0,0,0,0.3)]">
          <h3 className="text-emerald-300 font-bold text-xs tracking-wider uppercase mb-4 border-b border-zinc-800 pb-2">
            Governance Distribution
          </h3>
          <div className="space-y-3">
            {GOVERNANCE_TIERS.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs p-2 bg-black/20 rounded border border-zinc-800/50">
                <span className="text-emerald-500 font-medium">{item.tier}</span>
                <div className="text-right">
                  <div className="text-zinc-100">{item.weight}</div>
                  <div className="text-zinc-500 text-[9px]">{item.role}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-zinc-500 mt-4 pt-3 border-t border-zinc-800 leading-relaxed italic">
            * 80% consensus required for network ratification. Influence validated via Trust Score (TS) + Stake.
          </p>
        </div>

        {/* 🛡️ PROTOCOL ANCHORS */}
        <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
          <h3 className="text-emerald-300 font-bold text-xs tracking-wider uppercase mb-3 border-b border-zinc-800 pb-2">
            Protocol Anchors
          </h3>
          <div className="space-y-4 text-xs">
            <div className="border-l-2 border-emerald-500 pl-3">
              <h4 className="text-zinc-300 font-bold mb-1 uppercase tracking-wider">Uptime Shield</h4>
              <p className="text-zinc-500 leading-relaxed">
                90% availability mandated. Voting rights suspended below 85% threshold.
              </p>
            </div>
            <div className="border-l-2 border-amber-500 pl-3">
              <h4 className="text-zinc-300 font-bold mb-1 uppercase tracking-wider">Immutable Peg</h4>
              <p className="text-amber-500/80 font-bold mb-1">1 Pi = 1 BZR = 1000 mBZR</p>
              <p className="text-zinc-500 leading-relaxed">Hard-coded. Non-negotiable.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 🛡️ RETURN BRIDGE */}
      <div className="mt-8">
        <Link href="/academy" className="block w-full">
          <button className="w-full py-3 bg-zinc-950 border border-zinc-800 hover:border-emerald-500 hover:text-emerald-400 text-zinc-500 text-xs font-bold uppercase tracking-wider rounded transition-all">
            Terminate Matrix & Return
          </button>
        </Link>
      </div>

    </main>
  );
}