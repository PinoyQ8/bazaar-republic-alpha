// Location: /app/dashboard/layout.tsx
import React from "react";
// 🛡️ MESH ANCHOR: The Cryptographic Bouncer
import PioneerAuthGate from "@/components/PioneerAuthGate"; 

/**
 * 🛡️ THE DASHBOARD PERIMETER (Sector Layout)
 * Relies on RootLayout for the S23 Viewport lock and Bottom Navigation.
 * Injects the Security Gate and Sector Header.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 🛡️ SECURITY PERIMETER: Instantly locks all routes matching /dashboard/*
    <PioneerAuthGate requiredTier="CITIZEN">
      
      {/* 🧭 Dashboard Sector Header */}
      <header className="sticky top-0 z-50 w-full border-b border-neutral-900 bg-neutral-950/90 backdrop-blur-md px-4 py-3 mb-4 shadow-[0_4px_30px_rgba(0,0,0,0.8)] -mx-4">
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
      <div className="w-full flex-1">
        {children}
      </div>

    </PioneerAuthGate>
  );
}