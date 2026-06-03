"use client";

import { useState } from "react";

interface EscrowPayload {
  pioneerUsername: string;
  amount: number;
  nodeId: string;
}

export function useMeshTransaction() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  const initiateEscrowTx = async ({ pioneerUsername, amount, nodeId }: EscrowPayload) => {
    if (typeof window === "undefined" || !window.Pi) {
      console.error("[MESH FRACTURE] Pi SDK execution layer unavailable.");
      return;
    }

    setIsProcessing(true);

    try {
      console.log(`[MESH-SYNC] Requesting auth tokens for node link...`);
      
      const authResponse = await (window.Pi.authenticate as any)(
        ["username", "payments"],
        (incompletePayment: any) => {
          console.warn("[SECURITY ALERT] Incomplete payment artifact recovered:", incompletePayment);
        }
      );

      console.log(`[MESH-SYNC] Auth approved for Pioneer: ${authResponse.user.username}`);

      // 🛡️ CONFORMING TO GLOBAL.D.TS: Splitting parameters into 2 distinct arguments
      window.Pi.createPayment(
        // Argument 1: paymentData
        {
          amount: amount,
          memo: `Bazaar Republic Node Escrow - Secure Lock for Node ID: ${nodeId.split('-')[0]}`,
          metadata: { nodeId, targetPioneer: pioneerUsername },
        },
        // Argument 2: callbacks matching global.d.ts naming exactly
        {
          onReadyForServerApproval: async (paymentId: string) => {
            console.log(`[MESH-SYNC] Payment registered. ID: ${paymentId}`);
            
            const res = await fetch("/api/proxy", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-target-sector": "treasury",
                "Authorization": process.env.NEXT_PUBLIC_CLIENT_TOKEN || "" 
              },
              body: JSON.stringify({ paymentId, step: "approve" })
            });
            
            if (!res.ok) throw new Error("Treasury sector rejected transaction approval.");
            console.log("[MESH-SYNC] Server-side approval secured.");
          },
          onReadyForServerConfirmation: async (paymentId: string) => {
            console.log(`[MESH-SYNC] Transaction confirmed on ledger. ID: ${paymentId}`);
            
            const res = await fetch("/api/proxy", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-target-sector": "treasury",
    "Authorization": process.env.NEXT_PUBLIC_MESH_APP_CLIENT_TOKEN || "" // Synced Prefix
  },
  body: JSON.stringify({ paymentId, step: "approve" })
});

            if (res.ok) {
              setTxSignature(paymentId);
              console.log(`[MESH ALIGNMENT] Node ledger sync locked. Transaction Complete.`);
            }
            setIsProcessing(false);
          },
          onCancelled: (paymentId: string) => {
            console.warn(`[SECURITY ALERT] Transaction aborted by Pioneer. ID: ${paymentId}`);
            setIsProcessing(false);
          },
          onError: (error: Error, payment?: any) => {
            console.error(`[MESH FRACTURE] Escrow failure:`, error.message);
            setIsProcessing(false);
          }
        }
      );

    } catch (err: any) {
      console.error("[MESH FRACTURE] Execution sequence dropped:", err.message);
      setIsProcessing(false);
    }
  };

  return { initiateEscrowTx, isProcessing, txSignature };
}