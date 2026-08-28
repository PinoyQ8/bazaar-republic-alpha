// app/components/TestnetNoticeBanner.tsx
'use client';

import React from 'react';
import { ShieldAlert, Info, GraduationCap } from 'lucide-react';

export function TestnetNoticeBanner() {
  const isSandbox = process.env.NEXT_PUBLIC_PI_SANDBOX !== 'false';

  if (!isSandbox) return null;

  return (
    <aside aria-label="Testnet Notice" className="w-full bg-amber-500/10 border-b border-amber-500/20 px-3.5 py-2.5 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-col gap-1.5 font-mono text-xs">
        
        {/* ROW 1: Status & Mode Tag */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px] uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
            <span>MESH Academy Active</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <GraduationCap className="w-3 h-3" />
            <span>Sandbox Mode</span>
          </div>
        </div>

        {/* ROW 2: Primary Transparency Explainer */}
        <div className="text-[11px] leading-snug text-amber-200/90 font-sans">
          All wallet balances, swap operations, and gas burns operate strictly with <span className="font-semibold text-amber-300 font-mono">Academy Test-Pi</span> (0 economic value).
        </div>

        {/* ROW 3: Secondary Scope / Ledger Assurance */}
        <div className="flex items-center justify-between text-[10px] text-amber-300/70 border-t border-amber-500/15 pt-1">
          <div className="flex items-center gap-1">
            <Info className="w-3 h-3 text-amber-400 shrink-0" />
            <span>Mainnet & Bazaar Republic tabs are sandbox simulations</span>
          </div>
          <span className="font-mono text-amber-400 font-bold tracking-tight">ZERO LIVE ASSETS</span>
        </div>

      </div>
    </aside>
  );
}