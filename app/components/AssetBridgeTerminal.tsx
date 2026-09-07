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
      setLogs(prev => [...prev, "[MESH] Terminal buffer manual override executed."]);
      return;
    }
    if (bridgeState !== "IDLE") return;
    
    setBridgeState("AWAITING_SDK");
    setLogs(prev => [...prev, "[MESH] Requesting Pi Testnet Micro-TX (0.01 Pi)..."]);

    try {
      if (typeof window === "undefined" || !window.Pi) {
        throw new Error("Pi SDK offline.");
      }

      const pi = window.Pi;

      await pi.init({
        version: "2.0",
        sandbox: process.env.NODE_ENV !== "production",
      });

      // 🛡️ ADJUDICATOR: Unified SDK Handshake
      pi.createPayment(
        {
          amount: 0.01,
          memo: "Bazaar Republic: mBZR Genesis Airdrop",
          metadata: { tier: pioneer?.tier || "GENESIS" },
          identifier: `BRIDGE_${Date.now()}_${pioneer?.uid || 'GUEST'}`,
        },
        {
          onReadyForServerApproval: async (paymentId: string) => {
            setLogs(prev => [...prev, `[PCT_SYNC] Payment ${paymentId} pending approval...`]);
            const res = await fetch('/api/payments/approve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentId }),
            });
            if (!res.ok) throw new Error("Approval Gate Rejected");
          },
          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            setBridgeState("VERIFYING");
            setLogs(prev => [...prev, `[LEDGER] Payment ${paymentId} anchored. TXID: ${txid}`]);
            
            const response = await fetch('/api/payments/complete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentId, txid, pioneerUid: pioneer?.uid }),
            });
            
            if (response.ok) {
              setBridgeState("SYNCED");
              setLogs(prev => [...prev, "[SOROBAN] 10,000 mBZR Minted.", "[SUCCESS] Bridge synchronized."]);
              localStorage.setItem("MESH_MBZR_BALANCE", "10000");
            } else {
              throw new Error("API_REJECTION");
            }
          },
          onCancel: (paymentId: string) => {
            setBridgeState("FAILED");
            setLogs(prev => [...prev, `[WARNING] Pioneer aborted Micro-TX: ${paymentId}`]);
          },
          onError: (error: Error) => {
            setBridgeState("FAILED");
            setLogs(prev => [...prev, `[FATAL] PCT Node Error: ${error.message}`]);
          },
        }
      );
    } catch (error: any) {
      setBridgeState("FAILED");
      setLogs(prev => [...prev, `[FATAL] Bridge severed: ${error?.message || error}`]);
    }
  };

  return (
    <div className="p-4 border border-blue-900/50 bg-blue-950/10 rounded-xl space-y-4 font-mono w-full max-w-2xl">
      {/* UI logic same as provided */}
    </div>
  );
}