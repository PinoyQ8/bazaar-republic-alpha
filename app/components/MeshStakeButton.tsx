"use client";

import React, { useState } from "react";

export default function MeshStakeButton({ pioneerId }: { pioneerId: string }) {
  const [status, setStatus] = useState("AWAITING STAKE COMMAND");
  const [isProcessing, setIsProcessing] = useState(false);

  const executeStake = async () => {
    // 🛡️ Guard and narrow Pi SDK from window
    if (typeof window === "undefined" || !window.Pi) {
      setStatus("Pi SDK Not Detected. Launch in Pi Browser.");
      return;
    }

    const pi = window.Pi;
    setIsProcessing(true);
    setStatus("Initiating MESH Handshake...");

    try {
      // 1. Mandatory SDK initialization before payment invocation
      await pi.init({
        version: "2.0",
        sandbox: process.env.NODE_ENV !== "production",
      });

      // 2. createPayment invoked with two distinct parameter blocks
      pi.createPayment(
        {
          amount: 1, // Hard-coded for Alpha Testing (1 Test-Pi)
          memo: "Project Bazaar DAO Stake",
          metadata: { nodeId: pioneerId },
        },
        {
          // =========================================================
          // 1. APPROVAL HANDSHAKE (Routes to 'treasury' sector)
          // =========================================================
          onReadyForServerApproval: async (paymentId: string) => {
            setStatus("Authenticating Proxy Shield...");

            try {
              const response = await fetch("/api/proxy", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${process.env.NEXT_PUBLIC_MESH_APP_CLIENT_TOKEN}`,
                  "x-target-sector": "treasury",
                },
                body: JSON.stringify({ paymentId, step: "approve" }),
              });

              if (!response.ok) throw new Error("Proxy rejected approval");
              setStatus("Server Approved. Awaiting Pioneer Wallet...");
            } catch (error) {
              console.error("[MESH FRACTURE - APPROVAL]", error);
              setStatus("Approval Failed.");
              setIsProcessing(false);
            }
          },

          // =========================================================
          // 2. COMPLETION HANDSHAKE (Routes to 'vault' sector)
          // =========================================================
          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            setStatus("Locking Stake in Vault...");

            try {
              const response = await fetch("/api/proxy", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${process.env.NEXT_PUBLIC_MESH_APP_CLIENT_TOKEN}`,
                  "x-target-sector": "vault",
                },
                body: JSON.stringify({ paymentId, txid, step: "complete" }),
              });

              if (!response.ok) throw new Error("Proxy rejected completion");
              setStatus("Stake Locked. Node Secured.");
              setIsProcessing(false);
            } catch (error) {
              console.error("[MESH FRACTURE - COMPLETION]", error);
              setStatus("Completion Failed.");
              setIsProcessing(false);
            }
          },

          onCancel: (paymentId: string) => {
            console.warn("[PI SDK] Cancelled:", paymentId);
            setStatus("Transaction Cancelled by Pioneer.");
            setIsProcessing(false);
          },

          onError: (error: Error, payment?: any) => {
            console.error("[PI SDK ERROR]", error, payment);
            setStatus("Blockchain Error Occurred.");
            setIsProcessing(false);
          },
        }
      );
    } catch (error: any) {
      console.error("[MESH FRACTURE - EXECUTION]", error);
      setStatus("Execution Failed.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="mt-6 border border-zinc-800 bg-zinc-950 p-4 rounded text-center">
      <p className="text-xs text-zinc-500 mb-4 tracking-widest uppercase">{status}</p>
      <button
        onClick={executeStake}
        disabled={isProcessing}
        className={`w-full py-3 font-bold tracking-widest uppercase transition-colors ${
          isProcessing
            ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            : "bg-emerald-600 text-black hover:bg-emerald-500"
        }`}
      >
        {isProcessing ? "Processing..." : "Lock DAO Stake"}
      </button>
    </div>
  );
}