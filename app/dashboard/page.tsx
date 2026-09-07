// Location: /app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  LogOut, 
  Layers, 
  Activity, 
  Cpu, 
  Lock, 
  Server, 
  ArrowRight 
} from "lucide-react";

import { useAuth } from "@/app/context/AuthContext";
import PioneerAuthGate from "@/app/components/PioneerAuthGate";
import EpochYieldTracker from "@/app/components/EpochYieldTracker";
import PioneerVaultCard from "@/app/dashboard/components/PioneerVaultCard";
import MasterMeshSwitch from "@/app/components/MasterMeshSwitch";
import NodeServicesHUD from "./components/NodeServicesHUD";
import { useNodeHeartbeat } from "@/app/hooks/useNodeHeartbeat";
import { useBazaarTier } from "@/app/hooks/useBazaarTier";

interface TelemetryData {
  ts: number;
  tier: string;
  vBase: number;
  uShield: number;
  cFlow: number;
  status: string;
  protocol_version: string;
}

export default function MasterDashboard() {
  const router = useRouter();
  const { pioneer, logout } = useAuth();
  
  // Anchored Freighter Identity
  const activeNodeId = pioneer?.uid || "GDNL2PDN23QNUNWDTPVVYDHSGQTPPALHUIW7GOEGQNSSR4QVW2FDB2RZ";

  // 1. Telemetry Heartbeat Loop (Aligned with HeartbeatParams)
  useNodeHeartbeat({
    pioneerId: activeNodeId,
    walletAddress: activeNodeId,
    intervalMs: 60000,
    uptimeShield: 100,
  } as any);

  const { tier: onChainTier, loading: tierLoading } = useBazaarTier(pioneer?.uid);
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [healthData, setHealthData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"telemetry" | "sectors" | "sandbox">("telemetry");

  // 2. Telemetry & Mesh Health Sync Loops
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch("/api/mesh/health");
        if (res.ok) setHealthData(await res.json());
      } catch (err) {
        console.error("Health sync failure:", err);
      }
    };

    const fetchTelemetry = async () => {
      try {
        const [scanRes, vaultRes] = await Promise.all([
          fetch("/api/mesh-scan"),
          fetch(`/api/mesh/pioneer-vault?pioneerId=${activeNodeId}`),
        ]);

        if (scanRes.ok && vaultRes.ok) {
          const scanData = await scanRes.json();
          const vaultData = await vaultRes.json();

          setTelemetry({
            ts: vaultData.vault?.trust_score || 100,
            tier: `Tier ${onChainTier || 1} (Founder)`,
            vBase: 20,
            uShield: 40,
            cFlow: vaultData.vault?.activeFuel || 15,
            status: scanData.telemetry?.node_status || "ACTIVE",
            protocol_version: scanData.telemetry?.protocol_version || "28",
          });
        }
      } catch (err) {
        console.error("Telemetry sync failure:", err);
      }
    };

    fetchHealth();
    fetchTelemetry();

    const healthInterval = setInterval(fetchHealth, 15000);
    const telemetryInterval = setInterval(fetchTelemetry, 15000);

    return () => {
      clearInterval(healthInterval);
      clearInterval(telemetryInterval);
    };
  }, [activeNodeId, onChainTier]);

  return (
    <PioneerAuthGate>
      <div className="min-h-screen bg-slate-950 text-slate-100 p-4 font-mono w-full max-w-[384px] mx-auto pb-24 space-y-4">
        
        {/* Header */}
        <header className="border-b border-cyan-500/20 pb-3 flex justify-between items-center">
          <div>
            <div className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              NEO-SYNC {telemetry?.status || "ACTIVE"}
            </div>
            <h1 className="text-base font-bold text-slate-100 mt-0.5">Bazaar Master Node</h1>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-slate-500 block uppercase">NODE</span>
            <span className="text-[10px] text-cyan-400 font-bold truncate max-w-22.5 block">
              {activeNodeId.slice(0, 6)}...{activeNodeId.slice(-4)}
            </span>
          </div>
        </header>

        {/* Validator Telemetry Banner */}
        <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-400 font-semibold uppercase flex items-center gap-1.5">
              <Server size={13} className="text-amber-400" />
              Validator Telemetry
            </span>
            <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
              {healthData?.status || "ONLINE"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-zinc-950/70 p-2 rounded-lg border border-zinc-800/80">
              <span className="text-zinc-500 block text-[9px]">UPTIME METRIC</span>
              <span className="text-sm font-bold text-emerald-400">100.0%</span>
              <span className="text-[9px] text-zinc-500 block">Shield Verified</span>
            </div>

            <div className="bg-zinc-950/70 p-2 rounded-lg border border-zinc-800/80">
              <span className="text-zinc-500 block text-[9px]">DB LATENCY</span>
              <span className="text-sm font-bold text-cyan-400">
                {healthData?.meshLedger?.dbLatencyMs !== undefined 
                  ? `${healthData.meshLedger.dbLatencyMs}ms` 
                  : "<200ms"}
              </span>
              <span className="text-[9px] text-zinc-500 block">bzr-db rs0</span>
            </div>
          </div>
        </div>

        {/* Escrow State Machine */}
        <div className="rounded-xl bg-zinc-900/40 border border-zinc-800/70 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-300 font-semibold uppercase flex items-center gap-1.5">
              <Lock size={12} className="text-amber-400" />
              Escrow State Machine
            </span>
            <button
              type="button"
              onClick={() => router.push("/mesh/escrow")}
              className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold transition"
            >
              <span>CONSOLE</span>
              <ArrowRight size={11} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
            <div className="bg-zinc-950 p-1.5 rounded border border-zinc-800/60">
              <span className="text-zinc-500 block text-[9px]">ACTIVE</span>
              <span className="text-xs font-bold text-amber-400">
                {healthData?.meshLedger?.activeLocks ?? 2}
              </span>
            </div>
            <div className="bg-zinc-950 p-1.5 rounded border border-zinc-800/60">
              <span className="text-zinc-500 block text-[9px]">DISPUTES</span>
              <span className="text-xs font-bold text-rose-400">
                {healthData?.meshLedger?.pendingDisputes ?? 0}
              </span>
            </div>
            <div className="bg-zinc-950 p-1.5 rounded border border-zinc-800/60">
              <span className="text-zinc-500 block text-[9px]">SETTLED</span>
              <span className="text-xs font-bold text-emerald-400">
                {healthData?.meshLedger?.settledContracts ?? 10}
              </span>
            </div>
          </div>
        </div>

        {/* Master Consensus Controls */}
        <MasterMeshSwitch />

        {/* Co-Hosted Ingress Switchboard */}
        <NodeServicesHUD />

        {/* Viewport Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[10px] font-bold">
          <button
            onClick={() => setActiveTab("telemetry")}
            className={`py-1.5 rounded text-center transition flex items-center justify-center gap-1 uppercase ${
              activeTab === "telemetry" ? "bg-cyan-600 text-slate-950 font-extrabold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Activity className="w-3 h-3" /> Metrics
          </button>
          <button
            onClick={() => setActiveTab("sectors")}
            className={`py-1.5 rounded text-center transition flex items-center justify-center gap-1 uppercase ${
              activeTab === "sectors" ? "bg-cyan-600 text-slate-950 font-extrabold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-3 h-3" /> Sectors
          </button>
          <button
            onClick={() => setActiveTab("sandbox")}
            className={`py-1.5 rounded text-center transition flex items-center justify-center gap-1 uppercase ${
              activeTab === "sandbox" ? "bg-cyan-600 text-slate-950 font-extrabold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Cpu className="w-3 h-3" /> Sandbox
          </button>
        </div>

        {/* Tab Views */}
        {activeTab === "telemetry" && (
          <section className="space-y-3">
            {telemetry && (
              <div className="p-3 border border-cyan-900/80 bg-slate-900/60 rounded-lg space-y-2">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase tracking-widest">TrustScore</p>
                    <p className="text-2xl font-extrabold text-cyan-400">{telemetry.ts}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-1">RBAC Status</p>
                    <p className="px-2 py-0.5 bg-cyan-900/40 text-cyan-400 text-[11px] font-bold rounded border border-cyan-700/50">
                      {tierLoading ? "SYNCING..." : telemetry.tier}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <EpochYieldTracker stakeWeight={0.015} epochDaysRemaining={14} initialNetworkBufferPi={1420.5} />
          </section>
        )}

        {activeTab === "sectors" && (
          <section className="space-y-2">
            <Link href="/consumer" className="block p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg hover:border-cyan-900 transition">
              <div className="text-xs font-bold flex justify-between text-slate-200">
                <span>Consumer Escrow Portal</span>
                <span className="text-cyan-400">→</span>
              </div>
            </Link>
            <Link href="/provider" className="block p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg hover:border-cyan-900 transition">
              <div className="text-xs font-bold flex justify-between text-slate-200">
                <span>Service Provider Dashboard</span>
                <span className="text-cyan-400">→</span>
              </div>
            </Link>
          </section>
        )}

        {activeTab === "sandbox" && (
          <PioneerVaultCard pioneerId={activeNodeId} />
        )}

        {/* Disconnect */}
        <button
          onClick={() => { logout(); router.push("/dashboard"); }}
          className="w-full mt-2 py-2.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition"
        >
          <LogOut className="w-3.5 h-3.5" /> DISCONNECT NODE
        </button>

      </div>
    </PioneerAuthGate>
  );
}