// Location: app/dashboard/layout.tsx
"use client";

import React, { useEffect } from "react";
import PioneerAuthGate from "@/components/PioneerAuthGate"; 
import { usePassportGate } from "@/app/hooks/usePassportGate";
import HeirSuccessionPanel from "@/components/HeirSuccessionPanel";
import { Loader2, ShieldAlert } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { passport, isQuerying, verifyOnChainPassport, activeWallet } = usePassportGate();

  useEffect(() => {
    if (activeWallet) {
      verifyOnChainPassport(activeWallet);
    }
  }, [activeWallet, verifyOnChainPassport]);

  return (
    <PioneerAuthGate>
      {/* 🧭 Dashboard Sector Header */}
      <header className="sticky top-0 z-50 w-full border-b border-neutral-900 bg-neutral-950/90 backdrop-blur-md px-4 py-3 mb-4 shadow-[0_4px_30px_rgba(0,0,0,0.8)] -mx-4">
        <div className="flex items-center justify-between w-full">
          <span className="text-xs font-black text-amber-500 tracking-widest uppercase">
            Bazaar Republic
          </span>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/20 border border-emerald-900 rounded shadow-[0_0_10px_rgba(16,185,129,0.1)]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            <span className="text-[9px] font-bold text-emerald-400 tracking-wider">
              {passport.tier === 'UNREGISTERED' ? 'SYNCING' : passport.tier}
            </span>
          </div>
        </div>
      </header>

      {/* 🛡️ Smart Contract Verification Gate */}
      <div className="w-full flex-1 space-y-6">
        {isQuerying ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            <p className="text-[10px] text-amber-500 font-mono tracking-widest uppercase animate-pulse">
              Querying Ledger Passport...
            </p>
          </div>
        ) : !passport.isAuthorized ? (
          <div className="flex flex-col items-center justify-center h-64 p-6 border border-rose-900/50 bg-rose-950/20 rounded-xl text-center">
            <ShieldAlert className="w-8 h-8 text-rose-500 mb-3" />
            <h3 className="text-rose-500 text-xs font-bold tracking-widest uppercase mb-2">Access Denied</h3>
            <p className="text-[10px] text-slate-400">Your wallet does not hold an active Republic Passport on the blockchain.</p>
          </div>
        ) : (
          <>
            {/* 🧩 Nested Page Content */}
            {children}

            {/* 🏛️ Persistent Heir Succession Protocol Panel */}
            <div className="pt-4 border-t border-neutral-900">
              <HeirSuccessionPanel 
                founderAddress={activeWallet || "GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3"} 
                isFounder={true} 
              />
            </div>
          </>
        )}
      </div>
    </PioneerAuthGate>
  );
}