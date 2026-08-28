"use client";

import { useState, useEffect } from "react";
import { executeVaultMutation } from "@/app/utils/mesh-tx";
import { fetchLiveEscrows } from "@/app/utils/mesh-query"; // ✅ Imported once

interface VaultDashboardProps {
  consumerPubKey: string;
}

interface EscrowState {
  id: string;
  provider: string;
  amount: string;
  status: "LOCKED" | "RELEASED" | "REFUNDED";
  timestamp: number;
}

export default function VaultDashboard({ consumerPubKey }: VaultDashboardProps) {
  const [escrows, setEscrows] = useState<EscrowState[]>([]);
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [activeTx, setActiveTx] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  // 1. Initial State Sync using the imported query utility
  useEffect(() => {
    const syncVaultState = async () => {
      setIsFetching(true);
      try {
        const liveEscrows = await fetchLiveEscrows(consumerPubKey);
        setEscrows(liveEscrows);
      } catch (err: any) {
        console.error("MESH Sync Error:", err);
      } finally {
        setIsFetching(false);
      }
    };

    if (consumerPubKey) {
      syncVaultState();
    }
  }, [consumerPubKey]);

  // 2. Escrow Release Logic (Consumer -> Provider)
  const handleRelease = async (escrowId: string) => {
    setActiveTx(escrowId);
    setTxError(null);
    try {
      console.log(`[MESH-TX] Initiating Escrow Release for ${escrowId}`);
      
      const txHash = await executeVaultMutation("release", escrowId, consumerPubKey);
      console.log(`[MESH-TX] Release Confirmed! Hash: ${txHash}`);
      
      setEscrows((prev) =>
        prev.map((esc) =>
          esc.id === escrowId ? { ...esc, status: "RELEASED" } : esc
        )
      );
    } catch (err: any) {
      setTxError(`Release failed: ${err.message}`);
    } finally {
      setActiveTx(null);
    }
  };

  // 3. Escrow Refund Logic (Consumer Recovers Funds)
  const handleRefund = async (escrowId: string) => {
    setActiveTx(escrowId);
    setTxError(null);
    try {
      console.log(`[MESH-TX] Initiating Escrow Refund for ${escrowId}`);
      
      const txHash = await executeVaultMutation("refund", escrowId, consumerPubKey);
      console.log(`[MESH-TX] Refund Confirmed! Hash: ${txHash}`);

      setEscrows((prev) =>
        prev.map((esc) =>
          esc.id === escrowId ? { ...esc, status: "REFUNDED" } : esc
        )
      );
    } catch (err: any) {
      setTxError(`Refund failed: ${err.message}`);
    } finally {
      setActiveTx(null);
    }
  };

  if (isFetching) {
    return (
      <div className="w-full p-6 border border-gray-800 bg-gray-900 rounded text-center animate-pulse">
        <p className="text-gray-400 font-mono text-sm">Synchronizing Vault State from Ledger...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {txError && (
        <div className="p-3 border border-red-800 bg-red-900/20 rounded text-red-400 font-mono text-sm">
          ⚠️ {txError}
        </div>
      )}

      {escrows.length === 0 ? (
        <div className="p-6 border border-gray-800 bg-gray-900 rounded text-center">
          <p className="text-gray-500 font-mono">No active escrows found for this node.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {escrows.map((escrow) => (
            <div
              key={escrow.id}
              className="p-4 border border-gray-800 bg-black rounded flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors hover:border-gray-700"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-gray-300 font-bold">{escrow.id}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-mono ${
                      escrow.status === "LOCKED"
                        ? "bg-yellow-900/30 text-yellow-500 border border-yellow-800"
                        : escrow.status === "RELEASED"
                        ? "bg-green-900/30 text-green-500 border border-green-800"
                        : "bg-red-900/30 text-red-500 border border-red-800"
                    }`}
                  >
                    {escrow.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 font-mono">
                  Provider: {escrow.provider} | Amount: <span className="text-gray-300">{escrow.amount}</span>
                </p>
              </div>

              {escrow.status === "LOCKED" && (
                <div className="flex gap-2 w-full md:w-auto">
                  <button
                    onClick={() => handleRelease(escrow.id)}
                    disabled={activeTx === escrow.id}
                    className={`flex-1 md:flex-none px-4 py-2 font-mono text-sm rounded border transition-colors ${
                      activeTx === escrow.id
                        ? "border-gray-700 text-gray-600 bg-gray-900 cursor-not-allowed"
                        : "border-green-800 text-green-400 hover:bg-green-900/30 hover:text-green-300"
                    }`}
                  >
                    {activeTx === escrow.id ? "Processing..." : "Release"}
                  </button>
                  <button
                    onClick={() => handleRefund(escrow.id)}
                    disabled={activeTx === escrow.id}
                    className={`flex-1 md:flex-none px-4 py-2 font-mono text-sm rounded border transition-colors ${
                      activeTx === escrow.id
                        ? "border-gray-700 text-gray-600 bg-gray-900 cursor-not-allowed"
                        : "border-red-800 text-red-400 hover:bg-red-900/30 hover:text-red-300"
                    }`}
                  >
                    {activeTx === escrow.id ? "Processing..." : "Refund"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}