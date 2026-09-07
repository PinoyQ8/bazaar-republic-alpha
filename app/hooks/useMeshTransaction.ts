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
    // 1. SSR & SDK Mount Guard
    if (typeof window === "undefined" || !window.Pi) {
      console.error("[MESH FRACTURE] Pi SDK execution layer unavailable.");
      return;
    }

    const pi = window.Pi;
    setIsProcessing(true);

    try {
      // 2. Mandatory SDK Runtime Initialization
      await pi.init({
        version: "2.0",
        sandbox: process.env.NODE_ENV !== "production",
      });

      // 3. Authentication Handshake with A2U Scopes
      const authResponse = await pi.authenticate(
        ["username", "payments", "wallet_address"],
        (incompletePayment: any) => {
          console.warn("[SECURITY ALERT] Incomplete payment artifact:", incompletePayment);
        }
      );

      console.log(`[MESH-SYNC] Auth approved for Pioneer: ${authResponse.user.username}`);
      if (authResponse.user.wallet_address) {
        console.log(`[MESH-SYNC] Wallet address locked: ${authResponse.user.wallet_address}`);
      }

      const clientToken = process.env.NEXT_PUBLIC_MESH_APP_CLIENT_TOKEN || "";
      const authHeader = `Bearer ${clientToken}`;

      // 4. Dispatch Payment Handshake
      pi.createPayment(
        {
          amount,
          memo: `Bazaar Republic Node Escrow - Secure Lock for Node ID: ${nodeId.split("-")[0]}`,
          metadata: { nodeId, targetPioneer: pioneerUsername },
          identifier: `ESCROW_${nodeId}_${Date.now()}`,
        },
        {
          onReadyForServerApproval: async (paymentId: string) => {
            console.log(`[MESH-SYNC] Payment registered. ID: ${paymentId}`);

            const res = await fetch("/api/proxy", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-target-sector": "treasury",
                Authorization: authHeader,
              },
              body: JSON.stringify({ paymentId, step: "approve" }),
            });

            if (!res.ok) throw new Error("Treasury rejected approval.");
          },

          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            console.log(`[MESH-SYNC] Anchoring ledger settlement. Payment: ${paymentId}, TxID: ${txid}`);

            const res = await fetch("/api/proxy", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-target-sector": "vault",
                Authorization: authHeader,
              },
              body: JSON.stringify({ paymentId, txid, step: "complete" }),
            });

            if (res.ok) {
              setTxSignature(txid || paymentId);
              console.log("[MESH ALIGNMENT] Node ledger sync locked.");
            } else {
              throw new Error("Vault rejected completion.");
            }
            setIsProcessing(false);
          },

          onCancel: (paymentId: string) => {
            console.warn(`[SECURITY ALERT] Transaction aborted: ${paymentId}`);
            setIsProcessing(false);
          },

          onError: (error: Error, payment?: any) => {
            console.error("[MESH FRACTURE] Escrow failure:", error.message, payment);
            setIsProcessing(false);
          },
        }
      );
    } catch (err: any) {
      console.error("[MESH FRACTURE] Execution sequence dropped:", err.message);
      setIsProcessing(false);
    }
  };

  return { initiateEscrowTx, isProcessing, txSignature };
}