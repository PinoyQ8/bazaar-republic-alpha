"use client";

import React, { useState, useEffect } from "react";

export default function VaultMonitor({ minted = 1250000, burned = 45000 }) {
  const [isPulsing, setIsPulsing] = useState(false);
  const effectiveSupply = minted - burned;
  const progressPercent = (minted / 1000000000) * 100;

  // 🛡️ SCARCITY PULSE DETECTOR
  useEffect(() => {
    if (burned > 0) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [burned]);

  return (
    <div className={`mt-4 p-4 bg-slate-900/60 border rounded-xl backdrop-blur-xl transition-colors duration-500 ${
      isPulsing ? "border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]" : "border-blue-900/40"
    }`}>
      {/* ... Header stays consistent ... */}

      {/* 🏛️ SUPPLY METRICS */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {/* Effective */}
        <div className="p-2 bg-black/60 border border-slate-800 rounded">
          <p className="text-[7px] text-slate-500 uppercase tracking-tighter font-bold">Effective</p>
          <p className="text-[10px] font-bold text-white font-mono">{(effectiveSupply / 1000).toFixed(1)}k</p>
        </div>
        {/* Minted */}
        <div className="p-2 bg-black/60 border border-slate-800 rounded">
          <p className="text-[7px] text-slate-500 uppercase tracking-tighter">Minted</p>
          <p className="text-[10px] font-bold text-blue-500 font-mono">{(minted / 1000).toFixed(1)}k</p>
        </div>
        {/* Burned (Red Highlight) */}
        <div className={`p-2 bg-black/60 border rounded transition-all duration-500 ${
          isPulsing ? "border-red-500 bg-red-500/10" : "border-red-900/20"
        }`}>
          <p className={`text-[7px] uppercase tracking-tighter font-bold ${isPulsing ? "text-white" : "text-red-500/70"}`}>Burned</p>
          <p className={`text-[10px] font-bold font-mono ${isPulsing ? "text-white" : "text-red-500"}`}>{(burned / 1000).toFixed(1)}k</p>
        </div>
      </div>

      {/* 🛡️ GENESIS CAP PROGRESS (WITH RED PULSE) */}
      <div className="space-y-2">
        <div className="flex justify-between items-end px-1">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest">Genesis Cap</span>
          <span className={`text-[9px] font-mono transition-colors ${isPulsing ? "text-red-400" : "text-blue-400"}`}>
            {isPulsing ? "SCARCITY JUMP" : `${progressPercent.toFixed(4)}%`}
          </span>
        </div>
        <div className="relative w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className={`absolute top-0 left-0 h-full transition-all duration-1000 ${
              isPulsing ? "bg-red-500 shadow-[0_0_15px_#ef4444]" : "bg-linear-to-r from-blue-600 to-cyan-400"
            }`} 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
      
      {/* ... Footer stays consistent ... */}
    </div>
  );
}