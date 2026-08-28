"use client";

import React from "react";

interface PioneerBadgeProps {
  uid: string;
  tier: "Genesis" | "Alpha" | "Standard";
  syncDate: string;
}

export default function PioneerBadge({ uid, tier, syncDate }: PioneerBadgeProps) {
  // 🛡️ Dynamic Tier Styling
  const tierStyles = {
    Genesis: "from-blue-600 via-purple-600 to-blue-900 border-blue-400 text-blue-100",
    Alpha: "from-green-600 via-teal-600 to-green-900 border-green-400 text-green-100",
    Standard: "from-slate-600 via-slate-500 to-slate-800 border-slate-400 text-slate-100",
  };

  return (
    <div className={`relative overflow-hidden p-0.5 rounded-2xl bg-linear-to-br ${tierStyles[tier]} shadow-2xl`}>
      {/* 🛡️ Holographic Glare Effect */}
      <div className="absolute inset-0 bg-linear-to-tr from-white/0 via-white/20 to-white/0 opacity-50 pointer-events-none" />
      
      <div className="bg-slate-950 p-5 rounded-[14px] h-full flex flex-col justify-between border border-slate-900/50 relative z-10">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-[8px] text-slate-500 uppercase tracking-[0.3em] font-bold">Bazaar Republic</p>
            <p className="text-[14px] font-bold text-white font-mono mt-1">{uid}</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-slate-900 border-2 border-current flex items-center justify-center shadow-[0_0_15px_currentColor]">
            <span className="text-[10px] font-bold">π</span>
          </div>
        </div>

        {/* Telemetry Grid */}
        <div className="grid grid-cols-2 gap-3 border-t border-slate-800 pt-4">
          <div>
            <p className="text-[7px] text-slate-500 uppercase tracking-widest mb-1">Clearance Tier</p>
            <p className={`text-[10px] font-bold uppercase tracking-wider ${tier === 'Genesis' ? 'text-blue-400' : 'text-current'}`}>
              {tier} NODE
            </p>
          </div>
          <div>
            <p className="text-[7px] text-slate-500 uppercase tracking-widest mb-1">Sync Date</p>
            <p className="text-[10px] font-mono text-slate-300">{syncDate}</p>
          </div>
        </div>

        {/* MESH Signature */}
        <div className="mt-5 text-center">
          <p className="text-[6px] text-slate-600 uppercase tracking-[0.4em]">Soulbound Asset • Non-Transferable</p>
        </div>
      </div>
    </div>
  );
}