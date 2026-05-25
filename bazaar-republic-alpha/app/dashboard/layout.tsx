import React from "react";

/**
 * 🛡️ THE DASHBOARD PERIMETER (Sector Layout)
 * Wraps all nested dashboard routes in a consistent UI shell.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950">
      
      {/* 🧭 Top Navigation/Header (Optional, but good for structure) */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 py-3 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <span className="font-mono text-sm font-bold text-blue-500 tracking-widest uppercase">
            Bazaar Republic
          </span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-mono text-[10px] text-slate-400">Node Active</span>
          </div>
        </div>
      </header>

      {/* 🧩 Nested Page Content Injection */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
      
    </div>
  );
}