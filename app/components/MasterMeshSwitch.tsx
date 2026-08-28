// Location: app/components/MasterMeshSwitch.tsx
"use client";

import React, { useState, useEffect } from "react";
import { getMasterMeshConfig, DeploymentMode, NetworkMode } from "@/app/utils/meshConfig";
import { Server, Cpu, RefreshCw, ShieldCheck, Lock } from "lucide-react";
import { setNetworkMode } from "@/app/utils/mesh-contracts";

export default function MasterMeshSwitch() {
  const [config, setConfig] = useState(getMasterMeshConfig());
  const [isSwapping, setIsSwapping] = useState(false);
  const [hasClearance, setHasClearance] = useState(false);

  useEffect(() => {
    setConfig(getMasterMeshConfig());
    
    // 🛡️ SECURITY ADJUDICATION: Verify active Pioneer session clearance
    const pioneerActive = localStorage.getItem("mesh_pioneer_active");
    const pioneerId = localStorage.getItem("mesh_pioneer_id");

    if (pioneerActive === "true" && pioneerId) {
      setHasClearance(true);
    }
  }, []);

  const handleSwitch = async (targetDeployment?: DeploymentMode, targetNetwork?: NetworkMode) => {
    if (!hasClearance) return;
    
    setIsSwapping(true);

    const activeDeployment = targetDeployment || config.deployment;
    const activeNetwork = targetNetwork || config.network;

    if (targetDeployment) {
      localStorage.setItem("mesh_deployment_mode", targetDeployment);
    }
    
    if (targetNetwork) {
      // 🛡️ MESH SYNC: Persist & dispatch event across all mounted React hooks
      setNetworkMode(targetNetwork);
    }

    // 🛡️ TUNNEL DISPATCH: Trigger live RPC verification payload to X570 Local Agent
    try {
      await fetch("/api/tunnel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetHost: activeDeployment === "SOLOHOST" ? "solohost" : "pi_testnet",
          endpoint: "/health",
          method: "GET",
          payload: { 
            switchedDeployment: activeDeployment, 
            switchedNetwork: activeNetwork,
            timestamp: Date.now() 
          }
        }),
      });
    } catch (err) {
      console.warn("[TUNNEL SWITCH FAULT] Could not dispatch tunnel ping:", err);
    }

    setTimeout(() => {
      setIsSwapping(false);
      // 🛡️ PRESERVE ROUTE: Soft refresh on active route with salted cache-buster
      const currentPath = window.location.pathname;
      window.location.href = `${currentPath}?v=FORCE_SYNC`;
    }, 600);
  };

  // 🔒 LOCKDOWN VIEW: Deny access if security clearance is absent
  if (!hasClearance) {
    return (
      <div className="p-4 bg-slate-950 border border-red-900/50 rounded-lg font-mono text-slate-400 shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between border-b border-red-900/30 pb-2">
          <span className="text-[10px] text-red-400 uppercase tracking-widest flex items-center gap-1.5 font-bold">
            <Lock className="w-4 h-4 text-red-500 animate-pulse" /> SECURITY LOCKDOWN: LEVEL-1 REQUIRED
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
          Access to the Master MESH Control Grid is restricted. Authenticate your Pioneer identity via the Genesis Gate to acquire node clearance.
        </p>
      </div>
    );
  }

  // 🔓 AUTHORIZED VIEW: Fully operational control grid
  return (
    <div className="p-4 bg-slate-900/90 border border-blue-900/50 rounded-lg font-mono text-slate-100 shadow-2xl max-w-md w-full">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
        <span className="text-[10px] text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> CLEARANCE GRANTED: MASTER OPERATOR
        </span>
        {isSwapping && <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />}
      </div>

      {/* DIMENSION 1: HOSTING ENVIRONMENT */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[9px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Server className="w-3 h-3 text-blue-400" /> Infrastructure Host
          </span>
          <span className="text-[9px] text-blue-400 font-bold">{config.deployment}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleSwitch("SOLOHOST", undefined)}
            disabled={isSwapping || config.deployment === "SOLOHOST"}
            className={`py-2 text-[10px] font-bold uppercase rounded border transition-all ${
              config.deployment === "SOLOHOST"
                ? "bg-blue-950/50 border-blue-600 text-blue-400 shadow-[0_0_10px_rgba(37,99,235,0.2)]"
                : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300"
            }`}
          >
            SoloHost (X570/Docker)
          </button>
          <button
            onClick={() => handleSwitch("VERCEL", undefined)}
            disabled={isSwapping || config.deployment === "VERCEL"}
            className={`py-2 text-[10px] font-bold uppercase rounded border transition-all ${
              config.deployment === "VERCEL"
                ? "bg-blue-950/50 border-blue-600 text-blue-400 shadow-[0_0_10px_rgba(37,99,235,0.2)]"
                : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300"
            }`}
          >
            Vercel Edge Cloud
          </button>
        </div>
      </div>

      {/* DIMENSION 2: BLOCKCHAIN LEDGER */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[9px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Cpu className="w-3 h-3 text-amber-400" /> Pi Ledger Protocol
          </span>
          <span className="text-[9px] text-amber-400 font-bold">{config.network}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleSwitch(undefined, "TESTNET")}
            disabled={isSwapping || config.network === "TESTNET"}
            className={`py-2 text-[10px] font-bold uppercase rounded border transition-all ${
              config.network === "TESTNET"
                ? "bg-amber-950/50 border-amber-600 text-amber-400 shadow-[0_0_10px_rgba(217,119,6,0.2)]"
                : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300"
            }`}
          >
            Pi Testnet
          </button>
          <button
            onClick={() => handleSwitch(undefined, "MAINNET")}
            disabled={isSwapping || config.network === "MAINNET"}
            className={`py-2 text-[10px] font-bold uppercase rounded border transition-all ${
              config.network === "MAINNET"
                ? "bg-emerald-950/50 border-emerald-600 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300"
            }`}
          >
            Pi Mainnet Core
          </button>
        </div>
      </div>
    </div>
  );
}