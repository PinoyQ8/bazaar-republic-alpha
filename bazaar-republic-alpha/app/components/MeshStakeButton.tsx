"use client";

import React, { useState } from "react";

export default function MeshStakeButton({ pioneerId }: { pioneerId: string }) {
  const [status, setStatus] = useState("AWAITING STAKE COMMAND");
  const [isProcessing, setIsProcessing] = useState(false);

  const executeStake = () => {
    // 🛡️ Ensure Pi SDK is loaded in the browser environment
    if (typeof window !== "undefined" && window.Pi) {
      setIsProcessing(true);
      setStatus("Initiating MESH Handshake...");
      
      window.Pi.createPayment({
        amount: 1, // Hard-coded for Alpha Testing (1 Test-Pi)
        memo: "Project Bazaar DAO Stake",
        metadata: { nodeId: pioneerId }, 

        callbacks: {
          // =========================================================
          // 1. APPROVAL HANDSHAKE (Routes to 'treasury' sector)
          // =========================================================
          onReadyForServerApproval: async (paymentId: string) => {
            setStatus("Authenticating Proxy Shield...");
            
            try {
              const response = await fetch('/api/proxy', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  // 🛡️ The crucial token injection to bypass 403
                  'Authorization': `Bearer ${process.env.NEXT_PUBLIC_MESH_APP_CLIENT_TOKEN}`,
                  // 🛡️ The crucial routing header to bypass UNKNOWN_SECTOR
                  'x-target-sector': 'treasury' 
                },
                body: JSON.stringify({ paymentId, step: 'approve' })
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
              const response = await fetch('/api/proxy', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${process.env.NEXT_PUBLIC_MESH_APP_CLIENT_TOKEN}`,
                  'x-target-sector': 'vault' 
                },
                body: JSON.stringify({ paymentId, txid, step: 'complete' })
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
            setStatus("Transaction Cancelled by Pioneer.");
            setIsProcessing(false);
          },
          onError: (error: any, payment: any) => {
            console.error("[PI SDK ERROR]", error);
            setStatus("Blockchain Error Occurred.");
            setIsProcessing(false);
          },
        },
      });
    } else {
      setStatus("Pi SDK Not Detected. Launch in Pi Browser.");
    }
  };

  return (
    <div className="mt-6 border border-zinc-800 bg-zinc-950 p-4 rounded text-center">
      <p className="text-xs text-zinc-500 mb-4 tracking-widest uppercase">{status}</p>
      <button 
        onClick={executeStake} 
        disabled={isProcessing}
        className={`w-full py-3 font-bold tracking-widest uppercase transition-colors ${
          isProcessing ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" : "bg-emerald-600 text-black hover:bg-emerald-500"
        }`}
      >
        {isProcessing ? "Processing..." : "Lock DAO Stake"}
      </button>
    </div>
  );
}