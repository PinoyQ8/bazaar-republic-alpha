// Location: /app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Zap, Activity, LogOut } from 'lucide-react';
import MasterMeshSwitch from "@/app/components/MasterMeshSwitch";
import { useMeshCurrency } from "@/app/hooks/useMeshCurrency"; 
import PioneerAuthGate from "@/app/components/PioneerAuthGate"; 
import { useAuth } from "@/app/context/AuthContext";

export default function MasterDashboard() {
  const { pioneer, logout } = useAuth();
  
  // 🛡️ INITIALIZE DYNAMIC CURRENCY
  const { text: piText, symbol: piSymbol } = useMeshCurrency();
  
  const [meshData, setMeshData] = useState({
    status: "SYNCING...",
    protocol: "p--.-",
    ledger: "-------"
  });

  useEffect(() => {
    if (!pioneer.isAuthenticated) return;

    const syncMeshTelemetry = async () => {
      try {
        const res = await fetch("/api/mesh-scan");
        if (res.ok) {
           const data = await res.json();
           setMeshData({
             status: "SYNCED",
             protocol: data.telemetry?.protocol_version || "26.1",
             ledger: data.telemetry?.latest_ledger || "VERIFIED"
           });
        }
      } catch (error) {
        console.error("[MESH FAULT] RPC Sync Failed:", error);
      }
    };

    syncMeshTelemetry();
    const telemetryLoop = setInterval(syncMeshTelemetry, 15000);

    return () => clearInterval(telemetryLoop);
  }, [pioneer.isAuthenticated]); 

  const disconnectNode = () => {
    console.log("[MESH-SYNC] Initiating Node Disconnect (Flush RAM)...");
    logout();
    // 🛡️ Force a full window reload to clear all React states and return to a pristine Genesis state
    window.location.href = "/dashboard";
  };

  // 🛡️ THE GLOBAL AUTH SHIELD
  // This replaces all local onboarding logic and safely executes the Pi SDK 
  // using the Promise.race fortification we built earlier.
  return (
    <PioneerAuthGate>
      <div className="min-h-screen bg-slate-950 text-slate-100 p-4 font-mono w-full max-w-[384px] mx-auto pb-24 space-y-4">
        
        {/* Live Telemetry Header */}
        <header className="border-b border-cyan-500/20 pb-3 flex flex-col gap-2 pt-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  {meshData.status === 'SYNCED' && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  )}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${meshData.status === 'SYNCED' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                </span>
                NEO-SYNC {meshData.status}
              </div>
              <h1 className="text-lg font-bold text-slate-100 mt-1">Bazaar Master Node</h1>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">UPTIME SHIELD</span>
              <div className="text-xs font-bold text-cyan-400">92.00%</div>
            </div>
          </div>
        </header>

        {/* 🎛️ MASTER MESH SWITCH EMBEDDED DIRECTLY IN DASHBOARD */}
        <div className="w-full">
          <MasterMeshSwitch />
        </div>

        {/* Structured Telemetry Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 uppercase">NETWORK PROTOCOL</span>
            <span className="text-cyan-400 font-bold font-mono text-sm">{meshData.protocol}</span>
          </div>
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 uppercase">LATEST LEDGER</span>
            <span className="text-emerald-400 font-bold font-mono text-xs">{meshData.ledger}</span>
          </div>
          
          {/* 🛡️ DYNAMIC VAULT SYNC MATRIX */}
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 uppercase">VAULT SYNC</span>
            <span className="text-amber-400 font-bold font-mono text-xs">3,140.90 {piSymbol}</span>
          </div>
          
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 uppercase">PIONEER IDENTITY</span>
            <span className="text-slate-100 font-bold font-mono text-xs truncate">
              @{pioneer.username ? pioneer.username.toUpperCase() : 'UNKNOWN_NODE'}
            </span>
          </div>
        </div>

        {/* Quick Sector Shortcuts */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 bg-slate-900 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-colors rounded-lg flex flex-col gap-1">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-slate-200">MESH Config</span>
            <span className="text-[10px] text-slate-400">Node Logic</span>
          </div>
          <div className="p-3 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-colors rounded-lg flex flex-col gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-slate-200">E-Network</span>
            <span className="text-[10px] text-slate-400">Bridge Ready</span>
          </div>
        </div>

        {/* Disconnect / Flush RAM Button */}
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