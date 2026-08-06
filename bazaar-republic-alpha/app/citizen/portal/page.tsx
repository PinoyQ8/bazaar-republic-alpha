// Location: /app/citizen/portal/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  Terminal, 
  Droplets, 
  ShieldAlert, 
  Activity, 
  ChevronRight, 
  Lock, 
  CheckCircle2 
} from "lucide-react";

interface TelemetryData {
  protocol_version: string;
  latest_ledger: number;
  node_status: string;
}

export default function CitizenSandboxPortal() {
  const { pioneer } = useAuth();
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [claimState, setClaimState] = useState<"idle" | "processing" | "success">("idle");

  useEffect(() => {
    // 🛡️ READ-ONLY TELEMETRY: Fetch Soroban RPC without Prisma Vault hooks
    const fetchSandboxTelemetry = async () => {
      try {
        const res = await fetch("/api/mesh-scan");
        if (res.ok) {
          const data = await res.json();
          setTelemetry(data.telemetry);
        }
      } catch (err) {
        console.error("[SANDBOX-FAULT] Telemetry fetch failed.", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSandboxTelemetry();
  }, []);

  const handleMockFaucetClaim = () => {
    setClaimState("processing");
    // 🛡️ Simulate Soroban RPC latency (2 seconds)
    setTimeout(() => {
      setClaimState("success");
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-cyan-500 font-mono flex flex-col items-center justify-center space-y-4">
        <Activity className="w-8 h-8 animate-spin" />
        <div className="text-xs text-slate-400 uppercase tracking-widest">Initializing Sandbox...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 font-mono pb-24">
      {/* 🛡️ VIEWPORT LOCK: S23 Ultra Matrix */}
      <div className="w-full max-w-sm mx-auto p-4 space-y-6">
        
        {/* HEADER BLOCK */}
        <header className="border-b border-cyan-900/50 pb-4 mt-2">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold tracking-tight text-cyan-400 uppercase flex items-center gap-2">
              <Terminal className="w-5 h-5" />
              Sandbox Portal
            </h1>
            <span className="text-[10px] px-2 py-0.5 border border-cyan-500/40 bg-cyan-950/40 rounded text-cyan-400 tracking-wider uppercase">
              Read-Only
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Candidate ID: <span className="text-slate-200">{pioneer?.uid || "GUEST_CITIZEN"}</span>
          </p>
        </header>

        {/* ⚠️ ISOLATION WARNING */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-start gap-3 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
          <ShieldAlert className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-slate-400 leading-relaxed uppercase tracking-wide">
            <strong>E-Network Isolation Active.</strong> You are operating in the Candidate Sandbox. Actions here do not affect your Pioneer TrustScore ($TS).
          </p>
        </div>

        {/* 🌐 LIVE HORIZON TELEMETRY (Read-Only) */}
        <section className="p-3 border border-cyan-900/50 bg-slate-900/60 rounded-lg space-y-3">
          <h2 className="text-[10px] text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">
            Soroban RPC Uplink
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-slate-500 uppercase">Protocol</p>
              <p className="text-sm font-bold text-cyan-400">v{telemetry?.protocol_version || "OFFLINE"}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase">Sequence</p>
              <p className="text-sm font-bold text-emerald-400">
                {telemetry?.latest_ledger ? telemetry.latest_ledger.toLocaleString() : "---"}
              </p>
            </div>
          </div>
        </section>

        {/* 🚰 MOCK FAUCET INTERFACE */}
        <section className="p-4 border border-cyan-900/50 bg-slate-900/60 rounded-lg space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <Droplets className="w-4 h-4 text-blue-400" />
            <h2 className="text-[10px] font-bold text-slate-200 uppercase tracking-widest">
              Testnet Fuel Claim
            </h2>
          </div>
          
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Verify your wallet binding by executing a simulated Soroban smart contract call to the testnet faucet.
          </p>

          <button
            onClick={handleMockFaucetClaim}
            disabled={claimState !== "idle"}
            className={`w-full py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
              claimState === "idle"
                ? "bg-cyan-950/50 border-cyan-800 text-cyan-400 hover:bg-cyan-900"
                : claimState === "processing"
                ? "bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed"
                : "bg-emerald-950/50 border-emerald-800 text-emerald-400 cursor-not-allowed"
            }`}
          >
            {claimState === "idle" && "Execute Mock Claim"}
            {claimState === "processing" && "Injecting Test Fuel..."}
            {claimState === "success" && "+5.00 Fuel Secured"}
          </button>
        </section>

        {/* 🛣️ PROGRESSION GATE */}
        <section className="space-y-3">
          <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">
            Citizenship Pathway
          </h2>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-3 relative before:absolute before:inset-y-4 before:left-5.25 before:w-0.5 before:bg-slate-800">
            
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-6 h-6 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              </div>
              <p className="text-[10px] text-slate-300 uppercase tracking-wide">Module 01 Cleared</p>
            </div>

            <div className="flex items-center gap-3 relative z-10">
              <div className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center shrink-0">
                <Activity className="w-3 h-3 text-cyan-500" />
              </div>
              <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wide">Sandbox Verification</p>
            </div>

            <div className="flex items-center gap-3 relative z-10">
              <div className="w-6 h-6 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                <Lock className="w-3 h-3 text-slate-600" />
              </div>
              <div className="flex flex-col">
                <p className="text-[10px] text-slate-600 uppercase tracking-wide">Pioneer Genesis</p>
                <p className="text-[9px] text-slate-700">Requires DAO Quorum Approval</p>
              </div>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}