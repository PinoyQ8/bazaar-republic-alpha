"use client";

import React, { useState, useEffect } from "react";
import { fetchCurrentCirculation, fetchTreasuryBalance, fetchTotalBurned } from "@/lib/mesh/vault";
import { toBZR } from "@/lib/mesh/constants";

export default function TreasuryMonitor() {
  const [metrics, setMetrics] = useState({
    treasuryBZR: 0,
    dominance: "0.00",
    burnWeight: 0,
    absorptionRate: "0.000"
  });

  useEffect(() => {
    const syncMetrics = async () => {
      const circulation = await fetchCurrentCirculation();
      const treasury = await fetchTreasuryBalance();
      const burned = await fetchTotalBurned();

      // 🛡️ ABSORPTION LOGIC: 
      // How much has the Treasury's relative value grown due to burns?
      const dominance = (treasury / circulation) * 100;
      const initialDominance = (treasury / (circulation + burned)) * 100;
      const absorption = dominance - initialDominance;

      setMetrics({
        treasuryBZR: toBZR(treasury),
        dominance: dominance.toFixed(3),
        burnWeight: toBZR(burned),
        absorptionRate: absorption.toFixed(4)
      });
    };

    syncMetrics();
  }, []);

  return (
    <div className="p-5 border-2 border-green-900/40 bg-slate-950 rounded-2xl shadow-[0_0_30px_rgba(34,197,94,0.05)]">
      {/* 🛡️ SECTOR HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-1">
          <h2 className="text-[10px] font-bold tracking-[0.3em] text-green-500 uppercase">Community Treasury</h2>
          <p className="text-[8px] text-slate-500 uppercase tracking-tighter italic">Protocol-Owned Liquidity</p>
        </div>
        <div className="h-8 w-8 rounded bg-green-500/10 border border-green-500/20 flex items-center justify-center">
          <div className="h-4 w-4 border-2 border-green-500 rounded-full border-t-transparent animate-spin" />
        </div>
      </div>

      {/* 📊 CORE TELEMETRY */}
      <div className="space-y-4">
        <div>
          <p className="text-[7px] text-slate-500 uppercase mb-1">Total Treasury Reserves</p>
          <p className="text-2xl font-bold text-white font-mono tracking-tighter">
            {metrics.treasuryBZR.toLocaleString()} <span className="text-green-500 text-xs">BZR</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-white/2 border border-slate-800 rounded-lg">
            <p className="text-[7px] text-slate-500 uppercase mb-1">Network Dominance</p>
            <p className="text-sm font-bold text-slate-200 font-mono">{metrics.dominance}%</p>
          </div>
          <div className="p-3 bg-white/2 border border-slate-800 rounded-lg">
            <p className="text-[7px] text-slate-500 uppercase mb-1">Absorption Gain</p>
            <p className="text-sm font-bold text-green-400 font-mono">+{metrics.absorptionRate}%</p>
          </div>
        </div>
      </div>

      {/* 🛡️ ABSORPTION LOG */}
      <div className="mt-6 pt-4 border-t border-slate-800/50">
        <div className="flex justify-between items-center px-1">
          <span className="text-[8px] text-slate-500 uppercase">Total Attrition Burn:</span>
          <span className="text-[9px] font-bold text-red-500 font-mono">{metrics.burnWeight.toLocaleString()} BZR</span>
        </div>
        <div className="mt-3 w-full bg-slate-900 rounded-full h-1 overflow-hidden">
          <div 
            className="h-full bg-green-500 shadow-[0_0_10px_#22c55e]" 
            style={{ width: `${parseFloat(metrics.dominance)}%` }}
          />
        </div>
        <p className="text-[7px] text-slate-600 mt-2 text-center uppercase tracking-widest">
          Every Exit strengthens the Remaining Pioneers
        </p>
      </div>
    </div>
  );
}