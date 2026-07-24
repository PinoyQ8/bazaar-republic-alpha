"use client";

import { useEffect, useState } from "react";
import PioneerAuthGate from "@/app/components/PioneerAuthGate";

export default function DashboardPage() {
  const [session, setSession] = useState<{ username: string; uid: string } | null>(null);

  useEffect(() => {
    // 🛡️ Retrieve active Pioneer session seeded by safePi.ts
    const storedAuth = localStorage.getItem("pi_auth_user");
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        setSession(parsed);
      } catch (e) {
        console.error("[MESH] Failed to parse local auth state", e);
      }
    }
  }, []);

  return (
    <PioneerAuthGate>
      {/* 🛡️ STEP 1: Main Viewport Outer Shield (S23 Ultra 384px Safe) */}
      <div className="w-full max-w-full overflow-x-hidden space-y-6">
        
        {/* HEADER BLOCK */}
        <header className="border-b border-amber-900/60 pb-4 space-y-1">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h1 className="text-xl font-bold tracking-tight text-amber-500 uppercase">
              Logic Forge Dashboard
            </h1>
            <span className="text-xs px-2 py-0.5 border border-amber-500/40 bg-amber-950/40 rounded text-amber-400">
              92% UPTIME SHIELD
            </span>
          </div>
          <p className="text-xs text-neutral-400">
            Node: <span className="text-amber-400 font-mono">{session?.uid || "Connecting..."}</span> | Auth: <span className="text-amber-400 font-mono">{session?.username || "Verified"}</span>
          </p>
        </header>

        {/* STEP 4: RESPONSIVE METRIC GRID */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-amber-900/80 bg-neutral-900/60 rounded-lg space-y-1">
            <p className="text-xs text-neutral-500 uppercase">System Status</p>
            <p className="text-lg font-bold text-emerald-400">NEO-SYNC ACTIVE</p>
          </div>
          <div className="p-4 border border-amber-900/80 bg-neutral-900/60 rounded-lg space-y-1">
            <p className="text-xs text-neutral-500 uppercase">Security Layer</p>
            <p className="text-lg font-bold text-amber-500">MESH Protocol v23</p>
          </div>
          <div className="p-4 border border-amber-900/80 bg-neutral-900/60 rounded-lg space-y-1">
            <p className="text-xs text-neutral-500 uppercase">Domain Registry</p>
            <p className="text-lg font-bold text-neutral-200">E-Network Staging</p>
          </div>
        </section>

       {/* 🛡️ STEP 3: ISOLATED HORIZONTAL SCROLL FOR DATA TABLES/LOGS */}
<section className="space-y-2 w-full max-w-full">
  <h2 className="text-sm font-bold text-amber-500 uppercase">
    Active Telemetry Stream
  </h2>
  
  {/* 🛡️ Containment Wrapper: Added 'block w-full max-w-full overflow-x-auto' */}
  <div className="block w-full max-w-full overflow-x-auto border border-amber-900/50 rounded-lg bg-neutral-900/40 p-2">
    <table className="w-full min-w-120 text-left text-xs font-mono">
      <thead>
        <tr className="border-b border-amber-900/40 text-neutral-400">
          <th className="p-2">TIMESTAMP</th>
          <th className="p-2">SECTOR</th>
          <th className="p-2">EVENT</th>
          <th className="p-2 text-right">STATUS</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-neutral-800 text-neutral-300">
        <tr>
          <td className="p-2 text-neutral-500">01:19:29</td>
          <td className="p-2">AUTH_GATE</td>
          <td className="p-2">Mock Signature Injected</td>
          <td className="p-2 text-right text-emerald-400">VERIFIED</td>
        </tr>
        <tr>
          <td className="p-2 text-neutral-500">01:20:14</td>
          <td className="p-2">LAYOUT_ENGINE</td>
          <td className="p-2">S23 Viewport Locked (384px)</td>
          <td className="p-2 text-right text-emerald-400">PASS</td>
        </tr>
      </tbody>
    </table>
  </div>
</section>

      </div>
    </PioneerAuthGate>
  );
}