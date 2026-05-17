"use client"; // 🛡️ CRITICAL: Client-Side Boundary

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function AssetBridgeTerminal() {
  const { pioneer } = useAuth();
  const [bridgeState, setBridgeState] = useState<"IDLE" | "AWAITING_SDK" | "VERIFYING" | "SYNCED" | "FAILED">("IDLE");
  const [logs, setLogs] = useState<string[]>([]);

  // 🛡️ THE MICRO-TX IGNITION & SELF-HEALING PROTOCOL
  const initiateAssetBridge = async () => {
    // 🛠️ RECOVERY OVERRIDE: Clear out a failed state and clean up the logs instantly
    if (bridgeState === "FAILED") {
      setBridgeState("IDLE");
      setLogs(prev => [...prev, "[MESH] Terminal buffer manual override executed. Ready for fresh uplink request."]);
      return;
    }

    if (bridgeState !== "IDLE") return;
    
    setBridgeState("AWAITING_SDK");
    setLogs(prev => [...prev, "[MESH] Requesting Pi Testnet Micro-TX (0.01 Pi)..."]);

    try {
      // ⚠️ PCT COMPLIANCE: Official Pi SDK Payment Trigger
      if (!window.Pi) throw new Error("Pi SDK offline.");

      window.Pi.createPayment({
        amount: 0.01, // Micro-TX to bypass liquidity limits
        memo: "Bazaar Republic: mBZR Genesis Airdrop",
        metadata: { tier: pioneer?.tier || "GENESIS" },
      }, {
        onReadyForServerApproval: async (paymentId: string) => {
          setLogs(prev => [...prev, `[PCT_SYNC] Payment ${paymentId} pending Adjudicator approval...`]);
          await fetch('/api/payments/approve', {
            method: 'POST',
            body: JSON.stringify({ paymentId })
          });
        },
        onReadyForServerConfirmation: async (paymentId: string) => {
          setBridgeState("VERIFYING");
          setLogs(prev => [...prev, `[LEDGER] Payment ${paymentId} anchored. Unlocking Vault...`]);
          
          const response = await fetch('/api/api/payments/complete', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ paymentId, pioneerUid: pioneer?.uid }) // Syncs directly with schema structure
});
          
          if (response.ok) {
            setBridgeState("SYNCED");
            setLogs(prev => [
              ...prev, 
              "[SOROBAN] 10,000 mBZR Minted and Allocated.",
              "[SUCCESS] Asset Bridge synchronized."
            ]);
            localStorage.setItem("MESH_MBZR_BALANCE", "10000");
          }
        },
        onCancelled: (paymentId: string) => {
          setBridgeState("FAILED");
          setLogs(prev => [...prev, "[WARNING] Pioneer aborted the Micro-TX."]);
        },
        onError: (error: Error, payment?: any) => {
          setBridgeState("FAILED");
          setLogs(prev => [...prev, `[FATAL] PCT Node Error: ${error.message}`]);
        },
      });

    } catch (error) {
      setBridgeState("FAILED");
      setLogs(prev => [...prev, "[FATAL] Bridge severed. Adjudicator halt."]);
    }
  };

  // 🛡️ RECALIBRATED UI STATE EXTRACTORS (Prevents TS Compiler State Drift)
  const getButtonClass = () => {
    if (bridgeState === "IDLE") {
      return "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]";
    }
    if (bridgeState === "FAILED") {
      // High-visibility amber layout warning for recovery execution paths
      return "bg-amber-950/40 border border-amber-600/50 text-amber-400 hover:bg-amber-900 transition-all";
    }
    if (bridgeState === "SYNCED") {
      return "bg-emerald-900/40 text-emerald-500 border border-emerald-500/50 cursor-not-allowed";
    }
    return "bg-slate-800 text-slate-500 cursor-wait";
  };

  const getButtonText = () => {
    if (bridgeState === "IDLE") return "Authorize Pi Testnet Micro-TX";
    if (bridgeState === "FAILED") return "⚠️ Tx Failed // Click to Force-Reset Buffer";
    if (bridgeState === "SYNCED") return "Liquidity Unlocked";
    return "Communicating with Pi CDN...";
  };

  // ✅ RENDER ENGINE
  return (
    <div className="p-4 border border-blue-900/50 bg-blue-950/10 rounded-xl space-y-4 font-mono w-full max-w-2xl">
      <div className="flex justify-between items-center border-b border-blue-900/30 pb-2">
        <h3 className="text-sm font-bold text-white uppercase tracking-widest">Bazaar Asset Bridge</h3>
        <span className="text-[9px] px-2 py-0.5 bg-blue-900/40 text-blue-400 font-bold rounded-sm uppercase tracking-wide border border-blue-700/50">
          PCT Compliant
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-[10px]">
        <div className="space-y-1">
          <p className="text-slate-500 uppercase tracking-widest">Required Ignition</p>
          <p className="text-xl font-bold text-white">0.01 <span className="text-emerald-500 text-xs">Test-Pi</span></p>
        </div>
        <div className="space-y-1">
          <p className="text-slate-500 uppercase tracking-widest">Soroban Allocation</p>
          <p className="text-xl font-bold text-white">10,000 <span className="text-cyan-400 text-xs">mBZR</span></p>
        </div>
      </div>

      <p className="text-[10px] text-slate-400 leading-relaxed border-l-2 border-slate-700 pl-3">
        The Republic utilizes the 0.01 Test-Pi gateway strictly to anchor your node to the Pi Core Team ecosystem ledger. Upon SDK verification, the Adjudicator releases internal mBZR for DAO simulation protocols.
      </p>

      {/* TERMINAL UI */}
      <div className="bg-black border border-slate-800 p-3 rounded-lg text-[9px] h-28 overflow-y-auto flex flex-col justify-end gap-1 relative">
        <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-blue-500 to-transparent opacity-20"></div>
        {logs.length === 0 ? (
          <span className="text-slate-600 animate-pulse">&gt; Awaiting Micro-TX Authorization...</span>
        ) : (
          logs.map((log, index) => (
            <span key={index} className={
              log.includes("[SUCCESS]") ? "text-emerald-400 font-bold" : 
              log.includes("[PCT_SYNC]") || log.includes("[SOROBAN]") ? "text-cyan-400" : 
              log.includes("[FATAL]") || log.includes("[WARNING]") || log.includes("[MESH]") ? "text-amber-400" :
              "text-slate-400"
            }>
              &gt; {log}
            </span>
          ))
        )}
      </div>

      {/* SECURE COMMAND BUTTON */}
      <button 
        onClick={initiateAssetBridge}
        disabled={bridgeState === "AWAITING_SDK" || bridgeState === "VERIFYING" || bridgeState === "SYNCED"}
        className={`w-full py-3 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${getButtonClass()}`}
      >
        {getButtonText()}
      </button>
    </div>
  );
}