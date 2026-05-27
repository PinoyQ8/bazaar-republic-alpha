"use client";

import { useState } from "react";
import { unlockPremiumTier, commitModuleSignature } from "../actions/academyActions";

export default function AcademyHUD({ pioneerId, currentTier, initialFuel }: { pioneerId: string, currentTier: string, initialFuel: number }) {
  const [tier, setTier] = useState(currentTier);
  const [fuel, setFuel] = useState(initialFuel);
  const [terminalLog, setTerminalLog] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 🛡️ THE PAYMENT LOOP INTERFACE
  async function handleUpgrade() {
    setIsProcessing(true);
    setTerminalLog("Processing Node Upgrade...");
    
    const response = await unlockPremiumTier(pioneerId);
    
    if (response.success) {
      setTier("Pioneer+");
      setFuel((prev) => prev - 50.00); // Optimistic UI update
    }
    setTerminalLog(response.message);
    setIsProcessing(false);
  }

  // 🛡️ THE CLAIM LOOP INTERFACE (TS18048 PATCHED)
  async function handleModuleComplete(moduleId: string) {
    setIsProcessing(true);
    setTerminalLog(`Validating Module: ${moduleId}...`);

    const response = await commitModuleSignature(pioneerId, moduleId);

    // 🛡️ TS18048 SEAL: Guaranteed Numeric Resolution
    if (response.success) {
      setFuel((prev) => prev + (response.yieldAwarded ?? 0)); 
    }
    
    setTerminalLog(response.message);
    setIsProcessing(false);
  }

  return (
    <div className="space-y-6 font-mono">
      {/* 📊 TELEMETRY HEADER */}
      <div className="flex justify-between items-center p-4 border border-zinc-800 bg-black rounded-md">
        <div>
          <p className="text-zinc-500 text-xs tracking-widest">ACTIVE NODE</p>
          <p className="text-zinc-300 font-bold">{pioneerId}</p>
        </div>
        <div className="text-right">
          <p className="text-zinc-500 text-xs tracking-widest">MESH FUEL</p>
          <p className="text-emerald-400 font-bold">{fuel.toFixed(2)}</p>
        </div>
      </div>

      {/* 🚀 TIER UPGRADE GATE */}
      {tier === "Standard" ? (
        <div className="p-4 border border-zinc-700 bg-zinc-900 rounded-md">
          <h3 className="text-zinc-300 font-bold mb-2">PIONEER+ ARCHITECTURE</h3>
          <p className="text-zinc-500 text-sm mb-4">Unlock advanced MESH security modules. Cost: 50.00 Fuel.</p>
          <button 
            onClick={handleUpgrade}
            disabled={isProcessing || fuel < 50}
            className="w-full bg-zinc-800 hover:bg-emerald-900 text-zinc-300 hover:text-emerald-400 transition-colors p-2 rounded disabled:opacity-50"
          >
            {fuel < 50 ? "Insufficient Fuel" : "Initiate Tier Upgrade"}
          </button>
        </div>
      ) : (
        <div className="p-2 border border-emerald-900 bg-emerald-950/20 text-emerald-400 text-center rounded-md text-sm">
          PIONEER+ CLEARANCE ACTIVE
        </div>
      )}

      {/* 📚 MODULE EXECUTION */}
      <div className="p-4 border border-zinc-800 bg-black rounded-md">
        <h3 className="text-zinc-300 font-bold mb-4">DAO GOVERNANCE: SECTOR 1</h3>
        <button 
          onClick={() => handleModuleComplete("MOD_GOV_01")}
          disabled={isProcessing}
          className="w-full border border-zinc-700 text-zinc-300 p-2 rounded hover:border-emerald-500 hover:text-emerald-400 transition-colors"
        >
          Sign Module & Claim Yield
        </button>
      </div>

      {/* 🛡️ DYNAMIC RESPONSE TERMINAL */}
      {terminalLog && (
        <div className={`text-xs p-3 border rounded ${terminalLog.includes("SUCCESS") || terminalLog.includes("CLEARED") ? "bg-emerald-950/30 border-emerald-900 text-emerald-400" : "bg-zinc-950 border-red-900 text-red-400"}`}>
          {terminalLog}
        </div>
      )}
    </div>
  );
}