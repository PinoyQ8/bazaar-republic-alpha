// Location: /app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import PioneerAuthGate from "@/app/components/PioneerAuthGate";
import EpochYieldTracker from '@/app/components/EpochYieldTracker';
import PioneerVaultCard from "@/app/dashboard/components/PioneerVaultCard";

// Define the TS Matrix interface
interface TelemetryData {
  ts: number;
  tier: string;
  vBase: number;
  uShield: number;
  cFlow: number;
  pSlash: number;
  votingPower: number;
  status: string;
}

export default function DashboardPage() {
  const [session, setSession] = useState<{ username: string; uid: string } | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 🛡️ STEP 1: Retrieve local session
    const storedAuth = localStorage.getItem("pi_auth_user");
    
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        setSession(parsed);

        // 🛡️ STEP 2: Execute live API fetch to 26.1.0 Node
        fetch("/api/mesh-telemetry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: parsed.uid }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.error) {
              console.error("[MESH] API Error:", data.error);
            } else {
              setTelemetry(data);
            }
          })
          .catch((err) => console.error("[MESH] Fetch Failure:", err))
          .finally(() => setIsLoading(false));
          
      } catch (e) {
        console.error("[MESH] Failed to parse local auth state", e);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  // 🛡️ LOADING HUD SHIELD
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-amber-500 font-mono flex flex-col items-center justify-center space-y-4">
        <div className="animate-pulse text-2xl font-bold tracking-widest">SYNCING MESH...</div>
        <div className="text-xs text-neutral-500">Querying 26.1.0 Node Telemetry</div>
      </div>
    );
  }

  // 🛡️ FALLBACK HUD (If Node Desyncs)
  if (!telemetry) {
    return (
      <div className="min-h-screen bg-black text-red-500 font-mono flex flex-col items-center justify-center space-y-4 p-4 text-center">
        <div className="text-2xl font-bold tracking-widest">NODE DESYNC</div>
        <div className="text-xs text-neutral-400">Failed to retrieve TrustScore Matrix. Check Docker Daemon.</div>
      </div>
    );
  }

  return (
    <PioneerAuthGate>
      {/* 🛡️ STEP 3: Main Viewport Outer Shield (S23 Ultra 384px Safe) */}
      <div className="w-full max-w-full overflow-x-hidden space-y-4 p-2">
        
        {/* HEADER BLOCK */}
        <header className="border-b border-amber-900/60 pb-3 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h1 className="text-xl font-bold tracking-tight text-amber-500 uppercase">
              Logic Forge
            </h1>
            <span className="text-xs px-2 py-0.5 border border-amber-500/40 bg-amber-950/40 rounded text-amber-400">
              90% UPTIME SHIELD
            </span>
          </div>
          <div className="flex justify-between items-center text-xs text-neutral-400">
            <p>Auth: <span className="text-amber-400 font-mono">{session?.username || "Verified"}</span></p>
            <p className="bg-emerald-900/30 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-800/50">
              {telemetry.status}
            </p>
          </div>
        </header>

        {/* 🛡️ STEP 4: TS CORE ANCHOR & MATRIX */}
        <section className="p-3 border border-amber-900/80 bg-neutral-900/60 rounded-lg space-y-4">
          
          {/* Hero Row */}
          <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
            <div>
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest">TrustScore</p>
              <p className="text-4xl font-extrabold text-amber-500 drop-shadow-md">{telemetry.ts}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Tier Status</p>
              <p className="px-2 py-1 bg-amber-900/40 text-amber-400 text-xs font-bold rounded border border-amber-700/50">
                {telemetry.tier}
              </p>
            </div>
          </div>

          {/* Telemetry Bars */}
          <div className="space-y-3">
            {/* V_base */}
            <div>
              <div className="flex justify-between text-[10px] mb-1 text-neutral-300">
                <span>Identity (V_base)</span>
                <span>{telemetry.vBase} / 20</span>
              </div>
              <div className="h-1.5 w-full bg-neutral-800 rounded overflow-hidden">
                <div className="h-full bg-blue-500 w-full"></div>
              </div>
            </div>

            {/* U_shield */}
            <div>
              <div className="flex justify-between text-[10px] mb-1 text-neutral-300">
                <span>Uptime (U_shield)</span>
                <span>{telemetry.uShield} / 40</span>
              </div>
              <div className="h-1.5 w-full bg-neutral-800 rounded overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${(telemetry.uShield / 40) * 100}%` }}></div>
              </div>
            </div>

            {/* C_flow */}
            <div>
              <div className="flex justify-between text-[10px] mb-1 text-neutral-300">
                <span>Velocity (C_flow)</span>
                <span>{telemetry.cFlow} / 40</span>
              </div>
              <div className="h-1.5 w-full bg-neutral-800 rounded overflow-hidden">
                <div className="h-full bg-cyan-500" style={{ width: `${(telemetry.cFlow / 40) * 100}%` }}></div>
              </div>
            </div>

            {/* P_slash */}
            <div>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-red-400">Penalties (P_slash)</span>
                <span className="text-red-400">-{telemetry.pSlash}</span>
              </div>
              <div className="h-1.5 w-full bg-neutral-800 rounded overflow-hidden">
                <div className="h-full bg-red-500" style={{ width: `${telemetry.pSlash}%` }}></div>
              </div>
            </div>
          </div>
        </section>

        {/* 🛡️ STEP 4.5: PIONEER WALLET SECURITY & VAULT SHIELD */}
        {session?.uid && (
          <section className="mt-4">
            <PioneerVaultCard pioneerId={session.uid} />
          </section>
        )}

        {/* 🛡️ STEP 4.6: EPOCH YIELD TELEMETRY (30-Day Pi Distribution Engine) */}
        <EpochYieldTracker 
          stakeWeight={0.015} 
          epochDaysRemaining={14} 
          initialNetworkBufferPi={1420.50} 
        />

        {/* 🛡️ STEP 5: THE GOVERNANCE GATE (Voting Power) */}
        <section className="p-3 border border-amber-900/80 bg-neutral-900/80 rounded-lg flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-neutral-400 uppercase tracking-wide">Active Voting Power</span>
            <span className="text-lg font-bold text-amber-400">{telemetry.votingPower} VP</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="py-2 bg-amber-600 hover:bg-amber-500 text-neutral-900 text-xs font-bold rounded transition-colors uppercase tracking-wider">
              Vote Pool
            </button>
            <button className="py-2 bg-neutral-800 text-neutral-500 text-xs font-bold rounded cursor-not-allowed uppercase tracking-wider">
              Cooldown
            </button>
          </div>
        </section>

        {/* 🛡️ STEP 6: ISOLATED HORIZONTAL SCROLL FOR LOGS */}
        <section className="space-y-2 w-full max-w-full pt-2">
          <h2 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest px-1">
            Active Telemetry Stream
          </h2>
          <div className="block w-full max-w-full overflow-x-auto border border-amber-900/50 rounded-lg bg-neutral-900/40 p-2">
            <table className="w-full min-w-75 text-left text-[10px] font-mono">
              <thead>
                <tr className="border-b border-amber-900/40 text-neutral-400">
                  <th className="p-1.5">TIME</th>
                  <th className="p-1.5">SECTOR</th>
                  <th className="p-1.5">EVENT</th>
                  <th className="p-1.5 text-right">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 text-neutral-300">
                <tr>
                  <td className="p-1.5 text-neutral-500">{new Date().toLocaleTimeString('en-US', { hour12: false })}</td>
                  <td className="p-1.5">API_SYNC</td>
                  <td className="p-1.5 truncate max-w-25">TS Matrix Live</td>
                  <td className="p-1.5 text-right text-emerald-400">PASS</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </PioneerAuthGate>
  );
}