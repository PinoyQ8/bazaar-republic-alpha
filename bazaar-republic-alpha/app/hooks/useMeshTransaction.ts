"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

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
      // 🛡️ AUTHENTICATION HANDSHAKE
      const authResponse = await window.Pi.authenticate(["username", "payments"], (incompletePayment: any) => {
        console.warn("[SECURITY ALERT] Incomplete payment artifact:", incompletePayment);
      });

      console.log(`[MESH-SYNC] Auth approved: ${authResponse.user.username}`);

      // 🛡️ PI SDK PAYLOAD: Strictly compliant with Global.d.ts
      await window.Pi.createPayment(
        {
          amount: amount,
          memo: `Bazaar Republic Node Escrow - Secure Lock for Node ID: ${nodeId.split('-')[0]}`,
          metadata: { nodeId, targetPioneer: pioneerUsername },
          // 🛡️ REQUIRED: Injecting unique identifier to satisfy PiPayment interface
          identifier: `ESCROW_${nodeId}_${Date.now()}`
        },
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
            
            if (!res.ok) throw new Error("Treasury rejected approval.");
          },
          onReadyForServerConfirmation: async (paymentId: string) => {
            console.log(`[MESH-SYNC] Transaction confirmed on ledger. ID: ${paymentId}`);
            
            // 🛠️ LOGIC FIX: Changed step to 'complete' for confirmation phase
            const res = await fetch("/api/proxy", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-target-sector": "treasury",
                "Authorization": process.env.NEXT_PUBLIC_MESH_APP_CLIENT_TOKEN || ""
              },
              body: JSON.stringify({ paymentId, step: "complete" })
            });
            
            if (res.ok) {
              setTxSignature(paymentId);
              console.log("[MESH ALIGNMENT] Node ledger sync locked.");
            }
            setIsProcessing(false);
          },
          onCancelled: (paymentId: string) => {
            console.warn(`[SECURITY ALERT] Transaction aborted: ${paymentId}`);
            setIsProcessing(false);
          },
          onError: (error: Error) => {
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