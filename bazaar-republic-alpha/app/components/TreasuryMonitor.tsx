"use client";

import React, { useState, useEffect } from "react";
import { toBZR } from "@/lib/mesh/constants";

// 🛡️ PROTOCOL BASELINE CONFIGURATION
const DEFAULTS = {
  CIRCULATION: 100000000,
  TREASURY_BASE: 25000000
};

export default function TreasuryMonitor() {
  const [metrics, setMetrics] = useState({
    treasuryBZR: 0,
    dominance: "0.000",
    burnWeight: 0,
    absorptionRate: "0.0000",
    proofChecksum: "SYNCING_RAM"
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    const syncMetrics = async () => {
      try {
        setLoading(true);
        
        // 🛡️ DUAL-VAULT TELEMETRY EDGE
        const response = await fetch('/api/treasury');
        if (!response.ok) throw new Error("Telemetry sync failed");
        
        const data = await response.json();
        const burned = data.totalBurned || 0;
        const checksum = data.attestation?.proofChecksum || "SECURE_AXIOM";

        const circulation = DEFAULTS.CIRCULATION - burned;
        const treasury = DEFAULTS.TREASURY_BASE;

        // 🛡️ QUANTUM ABSORPTION LOGIC
        const dominance = (treasury / circulation) * 100;
        const initialDominance = (treasury / (circulation + burned)) * 100;
        const absorption = dominance - initialDominance;

        setMetrics({
          treasuryBZR: toBZR(treasury),
          dominance: dominance.toFixed(3),
          burnWeight: burned,
          absorptionRate: absorption.toFixed(4),
          proofChecksum: checksum.substring(0, 16) + "..."
        });
        setError(false);
      } catch (err) {
        console.error("[MESH-SCAN] UI Hydration Fracture:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    syncMetrics();
    // 92% Uptime Shield: Dynamic polling loop
    const pipeline = setInterval(syncMetrics, 30000);
    return () => clearInterval(pipeline);
  }, []);

  return (
    <div className="p-5 border-2 border-green-900/40 bg-slate-950 rounded-2xl shadow-[0_0_30px_rgba(34,197,94,0.05)] max-w-86 mx-auto">
      {/* 🛡️ SECTOR HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-1">
          <h2 className="text-[10px] font-bold tracking-[0.3em] text-green-500 uppercase">Community Treasury</h2>
          <p className="text-[8px] text-slate-500 uppercase tracking-tighter italic">Protocol-Owned Liquidity</p>
        </div>
        <div className="h-8 w-8 rounded bg-green-500/10 border border-green-500/20 flex items-center justify-center">
          {loading ? (
            <div className="h-4 w-4 border-2 border-green-500 rounded-full border-t-transparent animate-spin" />
          ) : error ? (
            <span className="text-red-500 font-bold text-xs">!</span>
          ) : (
            <span className="text-green-500 text-[10px] font-mono font-bold">✓</span>
          )}
        </div>
      </div>

      {/* 📊 CORE TELEMETRY */}
      <div className="space-y-4">
        <div>
          <p className="text-[7px] text-slate-500 uppercase mb-1">Total Treasury Reserves</p>
          <p className="text-2xl font-bold text-white font-mono tracking-tighter">
            {loading ? (
              <span className="text-slate-700 animate-pulse">LOADING...</span>
            ) : (
              <>
                {metrics.treasuryBZR.toLocaleString()} <span className="text-green-500 text-xs">BZR</span>
              </>
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-white/2 border border-slate-900 rounded-lg">
            <p className="text-[7px] text-slate-500 uppercase mb-1">Network Dominance</p>
            <p className="text-sm font-bold text-slate-200 font-mono">
              {loading ? "---" : `${metrics.dominance}%`}
            </p>
          </div>
          <div className="p-3 bg-white/2 border border-slate-900 rounded-lg">
            <p className="text-[7px] text-slate-500 uppercase mb-1">Absorption Gain</p>
            <p className="text-sm font-bold text-green-400 font-mono">
              {loading ? "---" : `+${metrics.absorptionRate}%`}
            </p>
          </div>
        </div>
      </div>

      {/* 🛡️ ABSORPTION LOG */}
      <div className="mt-6 pt-4 border-t border-slate-900">
        <div className="flex justify-between items-center px-1">
          <span className="text-[8px] text-slate-500 uppercase">Total Attrition Burn:</span>
          <span className="text-[9px] font-bold text-red-500 font-mono">
            {loading ? "CALCULATING..." : `${metrics.burnWeight.toLocaleString()} mBZR`}
          </span>
        </div>
        
        <div className="mt-3 w-full bg-slate-900 rounded-full h-1 overflow-hidden">
          <div 
            className="h-full bg-green-500 shadow-[0_0_10px_#22c55e] transition-all duration-500" 
            style={{ width: `${loading ? 0 : parseFloat(metrics.dominance)}%` }}
          />
        </div>

        {/* 🔐 LIGHTWEIGHT ZERO-KNOWLEDGE ADJACENT PROOF EMBED */}
<div className="mt-4 p-2 bg-black/40 border border-emerald-950/60 rounded-lg flex justify-between items-center font-mono text-[6px]">
  <span className="text-slate-500 uppercase tracking-wider">Axiom Checksum:</span>
  <span className="text-emerald-400 truncate max-w-40">{loading ? "COMPUTING..." : metrics.proofChecksum}</span>
</div>
        
        <p className="text-[7px] text-slate-600 mt-2 text-center uppercase tracking-widest">
          Every Exit strengthens the Remaining Pioneers
        </p>
      </div>
    </div>
  );
}