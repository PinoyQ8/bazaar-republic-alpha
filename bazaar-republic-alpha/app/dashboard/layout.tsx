// Location: /app/dashboard/layout.tsx
import React from "react";
// 🛡️ MESH ANCHOR: The Cryptographic Bouncer
import PioneerAuthGate from "@/components/PioneerAuthGate"; 
import BottomNav from "./components/BottomNav";

/**
 * 🛡️ THE DASHBOARD PERIMETER (Sector Layout)
 * Wraps all nested dashboard routes in a secured S23 Ultra mobile container.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 🛡️ SECURITY PERIMETER: Instantly locks all routes matching /dashboard/*
    <PioneerAuthGate requiredTier="CITIZEN">
      <div className="min-h-screen bg-neutral-950 text-neutral-200 flex flex-col items-center font-mono">
        
        {/* 📱 S23 Ultra Viewport Container Lock (384x854) */}
        <div className="w-full max-w-[384px] min-h-screen flex flex-col relative pb-24 border-x border-neutral-900 shadow-2xl">
          
          {/* 🧭 Top Navigation/Header */}
          <header className="sticky top-0 z-50 w-full border-b border-neutral-900 bg-neutral-950/90 backdrop-blur-md px-4 py-3 shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-black text-amber-500 tracking-widest uppercase">
                Bazaar Republic
              </span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/20 border border-emerald-900 rounded shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                <span className="text-[9px] font-bold text-emerald-400 tracking-wider">SECURED</span>
              </div>
            </div>
          </header>

          {/* 🧩 Nested Page Content Injection */}
          <main className="flex-1 w-full px-4 pt-4">
            {children}
          </main>

          {/* 🧭 Persistent Mobile Bottom Navigation */}
          <BottomNav />

        </div>
      </div>
    </PioneerAuthGate>
  );
}