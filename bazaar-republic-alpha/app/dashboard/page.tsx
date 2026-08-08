"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, Zap, LogOut, Wallet, Sliders, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import PioneerAuthGate from "@/app/components/PioneerAuthGate";
import EpochYieldTracker from '@/app/components/EpochYieldTracker';
import PioneerVaultCard from "@/app/dashboard/components/PioneerVaultCard";
import MasterMeshSwitch from "@/app/components/MasterMeshSwitch";
import { useMeshCurrency } from "@/app/hooks/useMeshCurrency";

interface TelemetryData {
  ts: number;
  tier: string;
  vBase: number;
  uShield: number;
  cFlow: number;
  pSlash: number;
  votingPower: number;
  status: string;
  latest_ledger: number;
  protocol_version: string;
  vaultBalance: number;
}

export default function MasterDashboard() {
  const { pioneer, logout } = useAuth();
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  
  // 🛡️ MINTING & PENALTY SIMULATION STATES
  const [stakeAmount, setStakeAmount] = useState<number>(100);
  const [simulationStatus, setSimulationStatus] = useState<string>("IDLE");
  const [penaltyWarning, setPenaltyWarning] = useState<boolean>(false);
  
  // 🛡️ INITIALIZE DYNAMIC CURRENCY
  const { text: piText, symbol: piSymbol } = useMeshCurrency();

  useEffect(() => {
    // Wait until Pioneer is actually authenticated by the AuthGate before syncing telemetry
    if (!pioneer.isAuthenticated) return;

    const fetchLiveTelemetry = async () => {
      try {
        const scanRes = await fetch("/api/mesh-scan");
        const vaultRes = await fetch(`/api/mesh/pioneer-vault?pioneerId=${pioneer.uid}`);

        if (scanRes.ok && vaultRes.ok) {
          const scanData = await scanRes.json();
          const vaultData = await vaultRes.json();

          setTelemetry({
            ts: vaultData.vault?.trust_score || 50,
            tier: vaultData.vault?.node_tier || vaultData.node_tier || "Genesis",
            vBase: 20,
            uShield: 35,
            cFlow: vaultData.vault?.activeFuel || vaultData.activeFuel || 15,
            pSlash: 0,
            votingPower: (vaultData.vault?.trust_score || 50) * 1.5,
            status: scanData.telemetry?.node_status || "SYNCED",
            latest_ledger: scanData.telemetry?.latest_ledger || 0,
            protocol_version: scanData.telemetry?.protocol_version || "26.1",
            vaultBalance: vaultData.vault?.balance || 3141.59,
          });
        }
      } catch (error) {
        console.error("[MESH FAULT] RPC Sync Failed:", error);
      }
    };

    fetchLiveTelemetry();
    const telemetryLoop = setInterval(fetchLiveTelemetry, 15000);
    return () => clearInterval(telemetryLoop);
  }, [pioneer.isAuthenticated, pioneer.uid]);

  const disconnectNode = () => {
    console.log("[MESH-SYNC] Initiating Node Disconnect (Flush RAM)...");
    logout();
    window.location.href = "/dashboard";
  };

  const handleSimulateMint = () => {
    setSimulationStatus("MINTING...");
    setTimeout(() => {
      setSimulationStatus("SUCCESS");
    }, 1200);
  };

  return (
    <PioneerAuthGate>
      <div className="w-full max-w-sm mx-auto overflow-x-hidden space-y-4 p-2 bg-slate-950 min-h-screen font-mono pb-24">
        
        {/* HEADER BLOCK */}
        <header className="border-b border-cyan-500/20 pb-3 flex flex-col gap-2 pt-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <div className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  {telemetry?.status === 'SYNCED' && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  )}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${telemetry?.status === 'SYNCED' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                </span>
                NEO-SYNC {telemetry?.status || "SYNCING..."}
              </div>
              <h1 className="text-lg font-bold text-slate-100 mt-1">Logic Forge</h1>
            </div>
            <div className="text-right">
              <span className="text-[10px] px-2 py-0.5 border border-cyan-500/40 bg-cyan-950/40 rounded text-cyan-400">
                v{telemetry?.protocol_version || "26.1"} SHIELD
              </span>
            </div>
          </div>
          {/* IDENTIFY USER VISIBILITY */}
          <div className="text-[11px] text-slate-400 flex items-center justify-between bg-slate-900/80 px-3 py-1.5 rounded border border-slate-800">
            <span>PIONEER ID:</span>
            <span className="text-cyan-400 font-bold">@{pioneer?.username ? pioneer.username.toUpperCase() : 'PIONEER_NODE'}</span>
          </div>
        </header>

        {/* 🎛️ INJECTED MASTER MESH SWITCH */}
        <div className="w-full py-1">
          <MasterMeshSwitch />
        </div>

        {/* 🛡️ PERSONAL VAULT BALANCE & CARD */}
        {pioneer?.uid && (
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider px-1">
              <Wallet className="w-4 h-4" /> Personal Vault Sector
            </div>
            <PioneerVaultCard pioneerId={pioneer.uid} />
          </section>
        )}

        {/* 🛡️ MINTING & WITHDRAWAL PENALTY SIMULATOR */}
        <section className="p-3 border border-amber-500/30 bg-slate-900/60 rounded-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4" /> Economic Mint Simulator
            </span>
            <span className="text-[10px] bg-amber-950/60 text-amber-300 px-2 py-0.5 rounded border border-amber-800/50">
              SANDBOX
            </span>
          </div>
          
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Target Stake Allocation:</span>
              <span className="text-cyan-400 font-bold">{stakeAmount} {piSymbol}</span>
            </div>
            <input 
              type="range" 
              min="10" 
              max="1000" 
              step="10"
              value={stakeAmount}
              onChange={(e) => {
                setStakeAmount(Number(e.target.value));
                setPenaltyWarning(Number(e.target.value) > 500);
              }}
              className="w-full accent-cyan-500 bg-slate-800 rounded-lg cursor-pointer h-2"
            />
            
            {penaltyWarning && (
              <div className="p-2 bg-red-950/30 border border-red-900/50 rounded flex items-start gap-2 text-[10px] text-red-300">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span><strong>High Allocation Warning:</strong> Early withdrawal before the 30-day epoch snapshot will trigger a strict 15% slashing penalty.</span>
              </div>
            )}

            <button
              onClick={handleSimulateMint}
              disabled={simulationStatus === "MINTING..."}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs transition-colors uppercase tracking-wider flex items-center justify-center gap-2"
            >
              {simulationStatus === "MINTING..." ? "Simulating Soroban Mint..." : simulationStatus === "SUCCESS" ? "Mint Simulation Active" : "Simulate Stake Mint"}
            </button>
            {simulationStatus === "SUCCESS" && (
              <div className="text-[10px] text-emerald-400 text-center flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Node weight successfully anchored to mock ledger.
              </div>
            )}
          </div>
        </section>

        {/* 🛡️ TS CORE ANCHOR & MATRIX */}
        {telemetry && (
          <section className="p-3 border border-cyan-900/80 bg-slate-900/60 rounded-lg space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">TrustScore</p>
                <p className="text-4xl font-extrabold text-cyan-400 drop-shadow-md">{telemetry.ts}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Tier Status</p>
                <p className="px-2 py-1 bg-cyan-900/40 text-cyan-400 text-xs font-bold rounded border border-cyan-700/50">
                  {telemetry.tier}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[10px] mb-1 text-slate-300">
                  <span>Identity (V_base)</span>
                  <span>{telemetry.vBase} / 20</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${(telemetry.vBase / 20) * 100}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] mb-1 text-slate-300">
                  <span>Uptime (U_shield)</span>
                  <span>{telemetry.uShield} / 40</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${(telemetry.uShield / 40) * 100}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] mb-1 text-slate-300">
                  <span>Velocity (C_flow)</span>
                  <span>{telemetry.cFlow} Fuel</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded overflow-hidden">
                  <div className="h-full bg-cyan-500" style={{ width: `${Math.min((telemetry.cFlow / 100) * 100, 100)}%` }}></div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 🛡️ EPOCH YIELD TELEMETRY */}
        <EpochYieldTracker 
          stakeWeight={0.015} 
          epochDaysRemaining={14} 
          initialNetworkBufferPi={1420.50} 
        />

        {/* 🛡️ THE GOVERNANCE VOTING SIMULATION GATE */}
        {telemetry && (
          <section className="p-3 border border-cyan-900/80 bg-slate-900/80 rounded-lg flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400 uppercase tracking-wide">Active Governance Voting Power</span>
              <span className="text-lg font-bold text-cyan-400">{telemetry.votingPower} VP</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Simulate DAO consensus casting for active node proposals using your live TrustScore weight.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Link 
                href="/dashboard/proposals" 
                className="py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold rounded transition-colors uppercase tracking-wider text-center"
              >
                Vote Pool
              </Link>
              <button 
                disabled 
                className="py-2 bg-slate-800 text-slate-500 text-xs font-bold rounded cursor-not-allowed uppercase tracking-wider"
              >
                Cooldown Active
              </button>
            </div>
          </section>
        )}

        {/* Disconnect Button */}
        <button
          onClick={disconnectNode}
          className="w-full mt-2 py-3 border border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
        >
          <LogOut className="w-4 h-4" /> DISCONNECT NODE
        </button>

      </div>
    </PioneerAuthGate>
  );
}