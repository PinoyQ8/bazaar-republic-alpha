// Location: app/security-circle/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import SecurityCircle from "@/app/components/SecurityCircle";
import { Shield, ArrowLeft, Activity, Fingerprint } from "lucide-react";

export default function SecurityCirclePage() {
  const { pioneer } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-mono">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-emerald-400 uppercase tracking-widest animate-pulse flex items-center gap-2">
          <Fingerprint className="w-4 h-4" /> Syncing Security Circle Telemetry...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-mono">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* HEADER BAR */}
        <header className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Link
              href="/dashboard"
              className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 mb-2 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Command Deck</span>
            </Link>
            <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-2">
              <Shield className="w-4 h-4" /> BAZAAR REPUBLIC // ZERO-TRUST DEFENSE
            </div>
            <h1 className="text-2xl font-bold text-slate-100 mt-1">Pioneer Security Circle</h1>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-slate-400">Node UID:</span>
            <span className="text-slate-200 font-bold">{pioneer?.uid || "ANONYMOUS"}</span>
          </div>
        </header>

        {/* SECURITY INFO OVERVIEW */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
            <span className="text-slate-500 uppercase text-[10px]">Quorum Standard</span>
            <div className="text-lg font-bold text-emerald-400">3/5 Multi-Sig</div>
            <p className="text-[10px] text-slate-400">Required for emergency key recovery</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
            <span className="text-slate-500 uppercase text-[10px]">Consensus Defense</span>
            <div className="text-lg font-bold text-cyan-400">Byzantine Fault Proof</div>
            <p className="text-[10px] text-slate-400">Immune to single node compromise</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
            <span className="text-slate-500 uppercase text-[10px]">Mesh Anchor State</span>
            <div className="text-lg font-bold text-amber-400">Layer-2 Active</div>
            <p className="text-[10px] text-slate-400">Synced to MongoDB &amp; Soroban</p>
          </div>
        </div>

        {/* PRIMARY SECURITY CIRCLE COMPONENT */}
        <div className="w-full">
          <SecurityCircle />
        </div>
      </div>
    </main>
  );
}