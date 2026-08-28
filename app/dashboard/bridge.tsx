"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function AssetBridgeTerminal() {
  const { pioneer } = useAuth();
  const [bridgeState, setBridgeState] = useState<"IDLE" | "AWAITING_SDK" | "VERIFYING" | "SYNCED" | "FAILED">("IDLE");
  const [logs, setLogs] = useState<string[]>([]);

  const initiateAssetBridge = async () => {
    if (bridgeState === "FAILED") {
      setBridgeState("IDLE");
      setLogs(prev => [...prev, "[MESH] Buffer manual override executed."]);
      return;
    }
    if (bridgeState !== "IDLE") return;
    
    setBridgeState("AWAITING_SDK");
    setLogs(prev => [...prev, "[MESH] Requesting Pi Testnet Micro-TX..."]);

    try {
      if (!window.Pi) throw new Error("Pi SDK offline.");

      await window.Pi.createPayment({
        amount: 0.01,
        memo: "Bazaar Republic: mBZR Genesis Airdrop",
        metadata: { tier: pioneer?.tier || "GENESIS" },
        identifier: `BRIDGE_${Date.now()}_${pioneer?.uid || 'GUEST'}`
      }, {
        onReadyForServerApproval: async (paymentId: string) => {
          setLogs(prev => [...prev, `[PCT_SYNC] ${paymentId} pending...`]);
          await fetch('/api/payments/approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId })
          });
        },
        onReadyForServerConfirmation: async (paymentId: string) => {
          setBridgeState("VERIFYING");
          setLogs(prev => [...prev, `[LEDGER] ${paymentId} anchored.`]);
          
          const response = await fetch('/api/payments/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId, pioneerUid: pioneer?.uid }) 
          });
          
          if (response.ok) {
            setBridgeState("SYNCED");
            setLogs(prev => [...prev, "[SUCCESS] Asset Bridge synchronized."]);
          }
        },
        onCancelled: () => {
          setBridgeState("FAILED");
          setLogs(prev => [...prev, "[WARNING] Aborted."]);
        },
        onError: (error: Error) => {
          setBridgeState("FAILED");
          setLogs(prev => [...prev, `[FATAL] ${error.message}`]);
        },
      });
    } catch (error) {
      setBridgeState("FAILED");
      setLogs(prev => [...prev, "[FATAL] Bridge severed."]);
    }
  };

  const getButtonClass = () => {
    if (bridgeState === "IDLE") return "bg-blue-600 hover:bg-blue-500 text-white";
    if (bridgeState === "FAILED") return "bg-amber-900 text-amber-400 border border-amber-600";
    if (bridgeState === "SYNCED") return "bg-emerald-900 text-emerald-500";
    return "bg-slate-800 text-slate-500";
  };

  return (
    <div className="p-4 border border-blue-900/50 bg-blue-950/10 rounded-xl font-mono">
      <button 
        onClick={initiateAssetBridge}
        disabled={bridgeState !== "IDLE" && bridgeState !== "FAILED"}
        className={`w-full py-3 rounded ${getButtonClass()}`}
      >
        {bridgeState === "IDLE" ? "Authorize Micro-TX" : bridgeState}
      </button>
      <div className="mt-4 text-[10px] text-slate-400">
        {logs.map((l, i) => <p key={i}>&gt; {l}</p>)}
      </div>
    </div>
  );
}