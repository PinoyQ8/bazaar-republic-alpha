"use client";

import { useState, useEffect, useCallback } from "react";
import { StrKey } from "@stellar/stellar-sdk";
import { useAuth } from "@/context/AuthContext";
import { executeVaultMutation } from "@/app/utils/mesh-tx";
import { fetchLiveEscrows } from "@/app/utils/mesh-query";

interface VaultDashboardProps {
  consumerPubKey?: string | null;
}

interface EscrowState {
  id: string;
  provider: string;
  amount: string;
  status: "PENDING_ONCHAIN" | "LOCKED" | "RELEASED" | "REFUNDED" | "DISPUTED";
  timestamp: number;
}

function isValidStellarOrContractKey(value?: string | null): value is string {
  if (!value) return false;
  const trimmed = value.trim();
  return (
    StrKey.isValidEd25519PublicKey(trimmed) ||
    StrKey.isValidContract(trimmed)
  );
}

function formatSafeAmount(rawAmount: string): string {
  const num = Number(rawAmount);
  if (!Number.isFinite(num) || num <= 0) {
    return "0.00";
  }
  return String(rawAmount).trim();
}

export default function VaultDashboard({ consumerPubKey }: VaultDashboardProps) {
  const { pioneer } = useAuth();
  const [escrows, setEscrows] = useState<EscrowState[]>([]);
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [activeTx, setActiveTx] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  const normalizedKey = consumerPubKey?.trim() || "";
  const hasValidKey = isValidStellarOrContractKey(normalizedKey);
  const isAccountRestricted =
    pioneer.status === "FROZEN" || pioneer.status === "SUSPENDED";
  const isAnyTxInFlight = activeTx !== null;

  const refreshEscrows = useCallback(async () => {
    if (!hasValidKey) {
      setEscrows([]);
      setIsFetching(false);
      return;
    }

    setIsFetching(true);
    try {
      const liveEscrows = await fetchLiveEscrows(normalizedKey);
      setEscrows(liveEscrows as EscrowState[]);
    } catch (err: unknown) {
      console.error(
        "MESH Sync Error:",
        err instanceof Error ? err.message : err
      );
      setEscrows([]);
    } finally {
      setIsFetching(false);
    }
  }, [hasValidKey, normalizedKey]);

  // 1. Initial State Sync using the imported query utility
  useEffect(() => {
    let cancelled = false;

    const syncVaultState = async () => {
      if (!hasValidKey) {
        if (!cancelled) {
          setEscrows([]);
          setIsFetching(false);
        }
        return;
      }

      setIsFetching(true);
      try {
        const liveEscrows = await fetchLiveEscrows(normalizedKey);
        if (!cancelled) {
          setEscrows(liveEscrows as EscrowState[]);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          console.error(
            "MESH Sync Error:",
            err instanceof Error ? err.message : err
          );
          setEscrows([]);
        }
      } finally {
        if (!cancelled) {
          setIsFetching(false);
        }
      }
    };

    syncVaultState();

    return () => {
      cancelled = true;
    };
  }, [hasValidKey, normalizedKey]);

  const assertCanMutateEscrow = useCallback(
    (escrowId: string, actionName: "Release" | "Refund"): boolean => {
      if (isAnyTxInFlight) {
        setTxError(`${actionName} blocked: Another vault transaction is already in progress.`);
        return false;
      }
      if (isAccountRestricted) {
        setTxError(
          `${actionName} blocked: Pioneer account status is ${pioneer.status}.`
        );
        return false;
      }
      if (!hasValidKey) {
        setTxError(`${actionName} failed: Valid Stellar/Soroban wallet address required.`);
        return false;
      }
      const target = escrows.find((e) => e.id === escrowId);
      if (!target || target.status !== "LOCKED") {
        setTxError(
          `${actionName} blocked: Escrow ${escrowId} is not in LOCKED state.`
        );
        return false;
      }
      return true;
    },
    [isAnyTxInFlight, isAccountRestricted, pioneer.status, hasValidKey, escrows]
  );

  // 2. Escrow Release Logic (Consumer -> Provider)
  const handleRelease = useCallback(
    async (escrowId: string) => {
      if (!assertCanMutateEscrow(escrowId, "Release")) return;

      setActiveTx(escrowId);
      setTxError(null);
      try {
        console.log(`[MESH-TX] Initiating Escrow Release for ${escrowId}`);

        const txHash = await executeVaultMutation(
          "release",
          escrowId,
          normalizedKey
        );
        console.log(`[MESH-TX] Release Confirmed! Hash: ${txHash}`);

        await refreshEscrows();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setTxError(`Release failed: ${message}`);
      } finally {
        setActiveTx(null);
      }
    },
    [assertCanMutateEscrow, normalizedKey, refreshEscrows]
  );

  // 3. Escrow Refund Logic (Consumer Recovers Funds)
  const handleRefund = useCallback(
    async (escrowId: string) => {
      if (!assertCanMutateEscrow(escrowId, "Refund")) return;

      setActiveTx(escrowId);
      setTxError(null);
      try {
        console.log(`[MESH-TX] Initiating Escrow Refund for ${escrowId}`);

        const txHash = await executeVaultMutation(
          "refund",
          escrowId,
          normalizedKey
        );
        console.log(`[MESH-TX] Refund Confirmed! Hash: ${txHash}`);

        await refreshEscrows();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setTxError(`Refund failed: ${message}`);
      } finally {
        setActiveTx(null);
      }
    },
    [assertCanMutateEscrow, normalizedKey, refreshEscrows]
  );

  if (isFetching) {
    return (
      <div className="w-full p-6 border border-gray-800 bg-gray-900 rounded text-center animate-pulse">
        <p className="text-gray-400 font-mono text-sm">
          Synchronizing Vault State from Ledger...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {isAccountRestricted && (
        <div className="p-3 border border-amber-700 bg-amber-950/30 rounded text-amber-300 font-mono text-xs">
          Account status is {pioneer.status}. Escrow mutations are disabled.
        </div>
      )}

      {txError && (
        <div className="p-3 border border-red-800 bg-red-900/20 rounded text-red-400 font-mono text-sm">
          ⚠️ {txError}
        </div>
      )}

      {!hasValidKey ? (
        <div className="p-6 border border-gray-800 bg-gray-900 rounded text-center">
          <p className="text-gray-500 font-mono text-xs">
            Bind a valid G... or C... wallet address to inspect live ledger escrows.
          </p>
        </div>
      ) : escrows.length === 0 ? (
        <div className="p-6 border border-gray-800 bg-gray-900 rounded text-center">
          <p className="text-gray-500 font-mono">
            No active escrows found for this node.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {escrows.map((escrow) => {
            const isRowBusy = activeTx === escrow.id;
            const actionsDisabled = isAnyTxInFlight || isAccountRestricted;

            return (
              <div
                key={escrow.id}
                className="p-4 border border-gray-800 bg-black rounded flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors hover:border-gray-700"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-gray-300 font-bold">
                      {escrow.id}
                    </span>
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
                    Provider: {escrow.provider} | Amount:{" "}
                    <span className="text-gray-300">
                      {formatSafeAmount(escrow.amount)}
                    </span>
                  </p>
                </div>

                {escrow.status === "LOCKED" && (
                  <div className="flex gap-2 w-full md:w-auto">
                    <button
                      type="button"
                      onClick={() => handleRelease(escrow.id)}
                      disabled={actionsDisabled}
                      className={`flex-1 md:flex-none px-4 py-2 font-mono text-sm rounded border transition-colors ${
                        actionsDisabled
                          ? "border-gray-700 text-gray-600 bg-gray-900 cursor-not-allowed"
                          : "border-green-800 text-green-400 hover:bg-green-900/30 hover:text-green-300"
                      }`}
                    >
                      {isRowBusy ? "Processing..." : "Release"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRefund(escrow.id)}
                      disabled={actionsDisabled}
                      className={`flex-1 md:flex-none px-4 py-2 font-mono text-sm rounded border transition-colors ${
                        actionsDisabled
                          ? "border-gray-700 text-gray-600 bg-gray-900 cursor-not-allowed"
                          : "border-red-800 text-red-400 hover:bg-red-900/30 hover:text-red-300"
                      }`}
                    >
                      {isRowBusy ? "Processing..." : "Refund"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}