"use client";

import React, { useState } from "react";

// ... Interface remains unchanged

export default function AttritionLog() {
  // Simulation: Live feed of incinerated stakes
  const [exits] = useState([
    { id: "1", timestamp: "22:45", pioneerNode: "NODE_77X", amountBurned: 12000 },
    { id: "2", timestamp: "18:12", pioneerNode: "NODE_alpha_09", amountBurned: 1000 },
    { id: "3", timestamp: "14:30", pioneerNode: "NODE_beta_sync", amountBurned: 5500 },
  ]);

  return (
    <div className="mt-12 p-4 bg-black/40 border-t border-slate-800 font-mono">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.4em]">Attrition Telemetry</h3>
        <span className="text-[7px] text-green-500 animate-pulse">● LIVE_FEED</span>
      </div>
      
      {/* 🛡️ CANONICAL FIX: max-h-30 (120px) */}
      <div className="space-y-2 max-h-30 overflow-y-auto pr-2 custom-scrollbar">
        {exits.map((exit) => (
          <div key={exit.id} className="flex justify-between items-center text-[8px] border-b border-slate-800/50 pb-1">
            <div className="flex gap-3">
              <span className="text-slate-600">[{exit.timestamp}]</span>
              <span className="text-blue-400">Pioneer Exit: {exit.pioneerNode}</span>
            </div>
            <span className="text-red-500 font-bold">-{exit.amountBurned.toLocaleString()} mBZR INCINERATED</span>
          </div>
        ))}
      </div>
      
      <p className="mt-3 text-[7px] text-slate-600 text-center italic uppercase">
        Every Exit strengthens the Remaining Pioneers
      </p>
    </div>
  );
}