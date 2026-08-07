// Location: app/components/MasterMeshSwitch.tsx
"use client";

import React, { useState, useEffect } from "react";
import { getMasterMeshConfig, DeploymentMode, NetworkMode } from "@/app/utils/meshConfig";
import { Server, Cpu, RefreshCw, ShieldCheck } from "lucide-react";

export default function MasterMeshSwitch() {
  const [config, setConfig] = useState(getMasterMeshConfig());
  const [isSwapping, setIsSwapping] = useState(false);

  useEffect(() => {
    setConfig(getMasterMeshConfig());
  }, []);

  const handleSwitch = (targetDeployment?: DeploymentMode, targetNetwork?: NetworkMode) => {
    setIsSwapping(true);

    if (targetDeployment) {
      localStorage.setItem("mesh_deployment_mode", targetDeployment);
    }
    if (targetNetwork) {
      localStorage.setItem("mesh_network_mode", targetNetwork);
    }

    setTimeout(() => {
      setIsSwapping(false);
      window.location.href = "/?v=FORCE_SYNC";
    }, 500);
  };

  return (
    <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-lg font-mono text-slate-100 shadow-2xl max-w-md w-full">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
        <span className="text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-blue-400" /> Master MESH Control Grid
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