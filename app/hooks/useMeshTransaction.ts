"use client";

import { useState } from "react";

interface EscrowPayload {
  pioneerUsername: string;
  amount: number;
  nodeId: string;
}

export interface MeshSessionSnapshot {
  uid: string;
  username: string;
  walletAddress: string | null;
  accessToken: string;
}

export function useMeshTransaction() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [session, setSession] = useState<MeshSessionSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ensurePiInitialized = () => {
    const w = window as any;
    if (!w.Pi) return false;
    if (!w.__PI_INITIALIZED__) {
      try {
        const isPiBrowser = /PiBrowser/i.test(navigator.userAgent);
        w.Pi.init({ version: "2.0", sandbox: !isPiBrowser });
        w.__PI_INITIALIZED__ = true;
      } catch {
        w.__PI_INITIALIZED__ = true;
      }
    }
    return true;
  };

  const completePaymentOnServer = async (paymentId: string, txid: string, uid?: string) => {
    const token =
      process.env.NEXT_PUBLIC_MESH_APP_CLIENT_TOKEN ||
      process.env.NEXT_PUBLIC_CLIENT_TOKEN ||
      "";

    const res = await fetch("/api/proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-target-sector": "treasury",
        Authorization: token,
      },
      body: JSON.stringify({ paymentId, txid, uid, step: "complete" }),
    });

    if (!res.ok) {
      throw new Error(`Treasury rejected completion (${res.status}).`);
    }
    return res;
  };

  const initiateEscrowTx = async ({ pioneerUsername, amount, nodeId }: EscrowPayload) => {
    if (typeof window === "undefined" || !ensurePiInitialized()) {
      const msg = "Pi SDK execution layer unavailable. Open inside Pi Browser.";
      setError(msg);
      console.error("[MESH FRACTURE]", msg);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const authResponse = await (window as any).Pi.authenticate(
        ["username", "payments", "wallet_address"],
        async (incompletePayment: any) => {
          console.warn("[SECURITY ALERT] Incomplete payment artifact:", incompletePayment);
          const incId = incompletePayment?.identifier;
          const incTxid = incompletePayment?.transaction?.txid;
          if (incId && incTxid) {
            await completePaymentOnServer(incId, incTxid).catch((err) =>
              console.warn("[MESH-SYNC] Incomplete payment recovery failed:", err)
            );
          }
        }
      );

      const snapshot: MeshSessionSnapshot = {
        uid: authResponse.user.uid,
        username: authResponse.user.username,
        walletAddress: authResponse.user.wallet_address ?? null,
        accessToken: authResponse.accessToken,
      };
      setSession(snapshot);

      console.log(`[MESH-SYNC] Auth approved for Pioneer: ${snapshot.username} (${snapshot.uid})`);
      if (snapshot.walletAddress) {
        console.log(`[MESH-SYNC] Wallet address locked: ${snapshot.walletAddress}`);
      }

      const token =
        process.env.NEXT_PUBLIC_MESH_APP_CLIENT_TOKEN ||
        process.env.NEXT_PUBLIC_CLIENT_TOKEN ||
        "";

      await (window as any).Pi.createPayment(
        {
          amount,
          memo: `Bazaar Republic Node Escrow - Secure Lock for Node ID: ${nodeId.split("-")[0]}`,
          metadata: {
            escrowRef: `ESCROW_${nodeId}_${Date.now()}`,
            nodeId,
            targetPioneer: pioneerUsername,
            pioneerUid: snapshot.uid,
            walletAddress: snapshot.walletAddress,
          },
        },
        {
          onReadyForServerApproval: async (paymentId: string) => {
            console.log(`[MESH-SYNC] Payment registered. ID: ${paymentId}`);
            try {
              const res = await fetch("/api/proxy", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-target-sector": "treasury",
                  Authorization: token,
                },
                body: JSON.stringify({ paymentId, uid: snapshot.uid, step: "approve" }),
              });

              if (!res.ok) throw new Error(`Treasury rejected approval (${res.status}).`);
            } catch (err: any) {
              setError(err?.message || "Approval failed.");
              setIsProcessing(false);
            }
          },

          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            console.log(`[MESH-SYNC] Transaction confirmed on ledger. ID: ${paymentId}, TXID: ${txid}`);
            try {
              await completePaymentOnServer(paymentId, txid, snapshot.uid);
              setTxSignature(txid);
              console.log("[MESH ALIGNMENT] Node ledger sync locked.");
            } catch (err: any) {
              setError(err?.message || "Completion failed.");
            } finally {
              setIsProcessing(false);
            }
          },

          onCancel: (paymentId: string) => {
            console.warn(`[SECURITY ALERT] Transaction aborted: ${paymentId}`);
            setIsProcessing(false);
          },

          onError: (err: Error) => {
            console.error("[MESH FRACTURE] Escrow failure:", err.message);
            setError(err.message);
            setIsProcessing(false);
          },
        }
      );
    } catch (err: any) {
      console.error("[MESH FRACTURE] Execution sequence dropped:", err?.message || err);
      setError(err?.message || "Execution sequence dropped.");
      setIsProcessing(false);
    }
  };

  return { initiateEscrowTx, isProcessing, txSignature, session, error };
}