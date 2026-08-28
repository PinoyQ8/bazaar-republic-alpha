// Location: /app/components/EpochYieldTracker.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Timer, Pickaxe, Coins, ShieldCheck, Activity } from 'lucide-react';
import { useMeshCurrency } from "@/app/hooks/useMeshCurrency"; // 🛡️ INJECTED CURRENCY HOOK

interface EpochTelemetryProps {
  stakeWeight: number; // e.g., 0.02 for 2% of the total network stake
  epochDaysRemaining: number;
  initialNetworkBufferPi: number;
}

export default function EpochYieldTracker({ 
  stakeWeight = 0.015, // Defaulting to 1.5% for Co-Pioneer testing
  epochDaysRemaining = 14, 
  initialNetworkBufferPi = 1420.50 
}: EpochTelemetryProps) {
  
  // 🛡️ INITIALIZE DYNAMIC CURRENCY
  const { text: piText, symbol: piSymbol } = useMeshCurrency();

  // 🛡️ MESH PATCH: Live Buffer State
  const [networkBuffer, setNetworkBuffer] = useState<number>(initialNetworkBufferPi);

  // ⚙️ ALGORITHM: Simulate real-time micro-transactions hitting the E-Network
  useEffect(() => {
    const trafficSimulation = setInterval(() => {
      // Increment network buffer by a tiny fraction of currency to simulate global directory usage
      const simulatedTxnFee = Math.random() * 0.005; 
      setNetworkBuffer((prev) => prev + simulatedTxnFee);
    }, 4500); // Ticks every 4.5 seconds

    return () => clearInterval(trafficSimulation);
  }, []);

  // 🧮 70/30 MESH SPLITTER MATH
  const communityYieldPool = networkBuffer * 0.70;
  const pioneerPendingYield = communityYieldPool * stakeWeight;

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-5 font-mono space-y-5">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-start border-b border-zinc-800/60 pb-3">
        <div>
          <h2 className="text-emerald-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
            <Activity className="w-4 h-4" /> 30-Day Epoch Yield
          </h2>
          <p className="text-[10px] text-zinc-500 uppercase mt-1">Pending {piText} Network Distribution</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-950/30 border border-emerald-900/50 px-2.5 py-1 rounded">
          <Timer className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-400 uppercase">
            Snapshot: {epochDaysRemaining} Days
          </span>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* GLOBAL NETWORK BUFFER */}
        <div className="p-4 bg-zinc-950 border border-zinc-800 rounded flex flex-col justify-center space-y-1">
          <span className="text-[10px] text-zinc-500 uppercase flex items-center gap-1.5">
            <Coins className="w-3 h-3 text-cyan-400" /> Total E-Network Buffer
          </span>
          <p className="text-lg font-bold text-cyan-400">
            {networkBuffer.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} <span className="text-xs text-zinc-400 font-normal">{piSymbol}</span>
          </p>
          <div className="w-full bg-zinc-900 h-1 mt-2 rounded overflow-hidden">
            <div className="bg-cyan-500 h-full w-full animate-pulse opacity-50"></div>
          </div>
        </div>

        {/* PIONEER PENDING YIELD (70% SPLIT) */}
        <div className="p-4 bg-purple-950/20 border border-purple-900/40 rounded flex flex-col justify-center space-y-1 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/10 blur-2xl rounded-full"></div>
          
          <span className="text-[10px] text-purple-300/70 uppercase flex items-center gap-1.5 z-10">
            <Pickaxe className="w-3 h-3 text-purple-400" /> Your Pending Yield (70% Split)
          </span>
          <p className="text-2xl font-bold text-purple-400 z-10 transition-all duration-300">
            {pioneerPendingYield.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 })} <span className="text-xs text-zinc-400 font-normal">{piSymbol}</span>
          </p>
          <p className="text-[9px] text-zinc-500 uppercase mt-1 z-10 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" /> Stake Weight: {(stakeWeight * 100).toFixed(2)}%
          </p>
        </div>

      </div>

      {/* WARNING FOOTER */}
      <div className="pt-2">
        <p className="text-[9px] text-zinc-600 uppercase leading-relaxed">
          * Yield is calculated from native {piText} smart contract fees generated within the E-Network. Unstaking before the 30-Day Snapshot forfeits pending yield to the remaining active Pioneers.
        </p>
      </div>

    </div>
  );
}