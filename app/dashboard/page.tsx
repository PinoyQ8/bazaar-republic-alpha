// Location: app/dashboard/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useNodeHeartbeat } from "@/hooks/useNodeHeartbeat";
import { Shield, Server, ArrowRight, RefreshCw } from "lucide-react";

interface MeshHealthResponse {
  status?: string;
  node?: {
    id?: string;
    role?: string;
    uptimeSeconds?: number;
  };
  meshLedger?: {
    dbStatus?: string;
    dbLatencyMs?: number;
    activeLocks?: number;
    pendingDisputes?: number;
    settledContracts?: number;
  };
}

export default function DashboardPage() {
  const heartbeat = useNodeHeartbeat({
    nodeId: "Node-001-X570-Taichi",
    role: "PRIMARY_VALIDATOR",
    protocolVersion: "28",
    uptimeShield: 92.4,
    intervalMs: 60000,
  });

  const [healthData, setHealthData] = useState<MeshHealthResponse | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/mesh/health", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setHealthData(data);
      }
    } catch (err) {
      console.error("[DASHBOARD_MESH_HEALTH_FAULT]:", err);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const effectiveShield = heartbeat.uptimeShield;
  const shieldHealthy = effectiveShield >= 92.0;

  return (
    <div className="w-full max-w-[384px] mx-auto p-4 space-y-4 font-mono text-slate-100">
      {/* Header */}
      <header className="border-b border-zinc-800 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`h-2.5 w-2.5 rounded-full animate-pulse ${
              heartbeat.warning ? "bg-amber-400" : "bg-emerald-500"
            }`}
          />
          <span className="font-bold text-xs tracking-wider uppercase text-zinc-100">
            BAZAAR REPUBLIC // L2
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            heartbeat.triggerPulse();
            fetchHealth();
          }}
          className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw size={11} className={heartbeat.isPulsing ? "animate-spin" : ""} />
          Node-001
        </button>
      </header>

      {/* Validator Telemetry & 92.0% Shield Indicator */}
      <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-zinc-400 font-semibold uppercase flex items-center gap-1.5">
            <Server size={13} className="text-amber-400" />
            Validator Telemetry
          </span>
          <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
            {heartbeat.nodeStatus || healthData?.status || "ONLINE"}
          </span>
        </div>

        {/* Dedicated 92.0% Shield Indicator Banner */}
        <div className="rounded-lg bg-zinc-950/90 border border-zinc-800 p-2.5 flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase tracking-wider text-zinc-400 block">
              92.0% Shield Indicator
            </span>
            <span
              className={`text-xs font-bold ${
                shieldHealthy ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {shieldHealthy ? "SHIELD LOCKED (≥92.0%)" : "BELOW 92.0% TARGET"}
            </span>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
              shieldHealthy
                ? "text-emerald-300 bg-emerald-950/60 border-emerald-700/50"
                : "text-amber-300 bg-amber-950/60 border-amber-700/50"
            }`}
          >
            92.0% Target
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="bg-zinc-950/70 p-2 rounded-lg border border-zinc-800/80">
            <span className="text-zinc-500 block text-[10px]">UPTIME SHIELD</span>
            <span
              className={`text-sm font-bold ${
                shieldHealthy ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {effectiveShield.toFixed(1)}%
            </span>
            <span className="text-[9px] text-zinc-500 block">
              90.0% SLA Floor • 60s Ping
            </span>
          </div>

          <div className="bg-zinc-950/70 p-2 rounded-lg border border-zinc-800/80">
            <span className="text-zinc-500 block text-[10px]">DB LATENCY</span>
            <span className="text-sm font-bold text-cyan-400">
              {healthData?.meshLedger?.dbLatencyMs !== undefined
                ? `${healthData.meshLedger.dbLatencyMs}ms`
                : "<200ms"}
            </span>
            <span className="text-[9px] text-zinc-500 block">
              {healthData?.meshLedger?.dbStatus || "MongoDB bzr-db"}
            </span>
          </div>
        </div>

        {heartbeat.warning && (
          <div className="text-[10px] text-amber-300 bg-amber-950/50 border border-amber-800/70 rounded-lg p-2">
            {heartbeat.warning}
          </div>
        )}
      </div>

      {/* Quick Sector Navigation */}
      <nav className="grid grid-cols-2 gap-2 text-xs">
        <Link
          href="/governance"
          className="p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800 hover:border-cyan-500/50 flex items-center justify-between"
        >
          <span className="flex items-center gap-1.5 text-cyan-300 font-semibold">
            <Shield size={13} /> Governance
          </span>
          <ArrowRight size={13} className="text-zinc-500" />
        </Link>

        <Link
          href="/mesh/node"
          className="p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800 hover:border-emerald-500/50 flex items-center justify-between"
        >
          <span className="text-emerald-300 font-semibold">DePIN Node</span>
          <ArrowRight size={13} className="text-zinc-500" />
        </Link>
      </nav>
    </div>
  );
}