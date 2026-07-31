"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { MESH_VERSION, MESH_STATUS } from "@/app/config/meshVersion";
import { Activity } from "lucide-react";

// 🛡️ CONSTITUTIONAL DATA: SCHEMA v2.3 GOVERNANCE TIERS
const GOVERNANCE_TIERS = [
  { tier: "BAZAAR_FOUNDER", weight: "20% + Soft Veto", role: "Constitutional Oversight" },
  { tier: "MESH_GUARDIAN", weight: "20%", role: "Protocol Development (Staked)" },
  { tier: "ACADEMY_CORE", weight: "20%", role: "Liquidity Provision & Voting" },
  { tier: "NOVICE", weight: "20%", role: "E-Network Maintenance" },
  { tier: "CITIZEN", weight: "20%", role: "Governance Participation (Entry)" },
];

export default function DaoArchitectureModule() {
  const { pioneer } = useAuth();

  // 🛡️ PRE-FLIGHT RENDER BLOCK
  if (!pioneer.isHydrated) {
    return (
      <main className="max-w-[384px] mx-auto p-4 min-h-screen bg-zinc-950 flex items-center justify-center font-mono">
        <p className="text-emerald-500 text-xs animate-pulse tracking-widest uppercase">Decentralizing Data...</p>
      </main>
    );
  }

  return (
    <main className="max-w-[384px] mx-auto p-4 pb-24 min-h-screen bg-zinc-950 text-zinc-100 font-mono selection:bg-emerald-500/30">
      
      {/* 🛡️ MODULE HEADER */}
      <div className="mb-6 border-b border-zinc-800 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-emerald-400 font-bold tracking-widest uppercase text-sm">DAO ARCHITECTURE</h2>
          <p className="text-zinc-500 text-xs mt-1">
            Status: <span className="text-emerald-500 font-bold">{MESH_STATUS?.version || "LIVE"}</span>
          </p>
        </div>
        <div className="text-[10px] text-zinc-600 border border-zinc-800 px-2 py-1 rounded">
          {MESH_VERSION || "v2.3.0"}
        </div>
      </div>

      {/* 🛡️ LIVE NODE METADATA (Dynamic Reflection) */}
      <div className="p-4 bg-[#05140e] border border-emerald-500/30 rounded-lg mb-6 shadow-[0_0_15px_rgba(0,210,138,0.05)]">
        <h3 className="text-[10px] text-emerald-500/70 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Activity className="w-3 h-3" /> Live Node Metadata
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-zinc-500 uppercase mb-1">Identity</p>
            <p className="text-xs font-bold text-zinc-300 truncate">@{pioneer.username || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase mb-1">Current Tier</p>
            <p className="text-xs font-bold text-emerald-400">{pioneer.tier}</p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase mb-1">Trust Score</p>
            <p className="text-xs font-bold text-cyan-400">{pioneer.trustScore}/100</p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase mb-1">Node Status</p>
            <p className="text-xs font-bold text-emerald-400">{pioneer.status}</p>
          </div>
        </div>
      </div>

      {/* 🛡️ CONSTITUTIONAL DATA: 5-TIER GOVERNANCE */}
      <div className="space-y-6">
        <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg shadow-[0_0_15px_rgba(0,0,0,0.3)]">
          <h3 className="text-emerald-300 font-bold text-xs tracking-wider uppercase mb-4 border-b border-zinc-800 pb-2">
            Governance Distribution
          </h3>
          <div className="space-y-3">
            {GOVERNANCE_TIERS.map((item, idx) => {
              // 🛡️ DYNAMIC HIGHLIGHT: Illuminates the Pioneer's exact tier
              const isCurrentTier = pioneer.tier === item.tier;

              return (
                <div 
                  key={idx} 
                  className={`flex justify-between items-center text-xs p-2 rounded border transition-all ${
                    isCurrentTier 
                      ? 'bg-emerald-950/40 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                      : 'bg-black/20 border-zinc-800/50 opacity-60'
                  }`}
                >
                  <span className={`font-medium ${isCurrentTier ? 'text-emerald-400 font-bold' : 'text-emerald-600'}`}>
                    {item.tier}
                  </span>
                  <div className="text-right">
                    <div className={isCurrentTier ? 'text-zinc-100 font-bold' : 'text-zinc-400'}>
                      {item.weight}
                    </div>
                    <div className={isCurrentTier ? 'text-zinc-400 text-[9px]' : 'text-zinc-600 text-[9px]'}>
                      {item.role}
                    </div>
                  </div>
                </div>
              );
            })}
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

      {/* 🛡️ PIPELINE NAVIGATION */}
      <div className="mt-8 flex flex-col gap-3">
        <Link href="/alpha-track" className="block w-full">
          <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-xs font-bold uppercase tracking-wider rounded transition-all">
            Proceed to Alpha Track
          </button>
        </Link>
        <Link href="/academy" className="block w-full">
          <button className="w-full py-3 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-500 text-xs font-bold uppercase tracking-wider rounded transition-all">
            Return to Hub
          </button>
        </Link>
      </div>

    </main>
  );
}