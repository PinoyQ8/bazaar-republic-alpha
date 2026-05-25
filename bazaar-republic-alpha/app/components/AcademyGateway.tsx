"use client";

import React from "react";
import PioneerBadge from "./PioneerBadge";

interface AcademyGatewayProps {
  children: React.ReactNode;
  isVerified: boolean;
  pioneerUid?: string;
}

export default function AcademyGateway({ children, isVerified, pioneerUid }: AcademyGatewayProps) {
  
  // 🛡️ NO BADGE = TOTAL LOCKDOWN
  if (!isVerified || !pioneerUid) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700">
        <div className="h-16 w-16 mb-6 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.15)]">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        
        <h2 className="text-[12px] font-bold text-red-500 uppercase tracking-[0.4em] mb-2">
          Sector Locked
        </h2>
        <div className="h-px w-16 bg-red-500/50 mx-auto mb-4" />
        <p className="text-[9px] text-slate-400 uppercase tracking-widest leading-relaxed">
          Access denied. A valid Soulbound Pioneer Badge is required to enter the Academy.
        </p>
        
        <button className="mt-8 px-6 py-3 bg-black border border-slate-800 text-slate-300 text-[9px] font-bold uppercase tracking-widest rounded-xl hover:border-blue-500 hover:text-blue-400 transition-all">
          Route to Registry
        </button>
      </div>
    );
  }

  // 🛡️ BADGE DETECTED = ACCESS GRANTED
  return (
    <div className="animate-in slide-in-from-bottom-4 duration-700">
      {/* 🛡️ Active Key Display */}
      <div className="mb-8 p-4 bg-slate-900/40 border border-blue-900/30 rounded-2xl backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Gateway Open</span>
        </div>
        <span className="text-[9px] font-mono text-blue-400">{pioneerUid}</span>
      </div>

      {/* 🚀 Render Academy Content */}
      {children}
    </div>
  );
}