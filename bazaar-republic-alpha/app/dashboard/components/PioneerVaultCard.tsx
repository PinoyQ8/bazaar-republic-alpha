// Location: /app/dashboard/components/PioneerVaultCard.tsx
"use client";

import { useState, useEffect } from "react";
import GuardianModal from "./GuardianModal";

export default function PioneerVaultCard({ pioneerId }: { pioneerId: string }) {
  const [vaultState, setVaultState] = useState("Loading...");
  const [lockTimestamp, setLockTimestamp] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("Syncing with MESH...");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGuardianModalOpen, setIsGuardianModalOpen] = useState(false);

  // Fetch initial vault status
  useEffect(() => {
    if (!pioneerId) return;

    fetch(`/api/mesh/pioneer-vault?pioneerId=${pioneerId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success" && data.vault) {
          setVaultState(data.vault.vaultState);
          setLockTimestamp(data.vault.lockTimestamp);
          setFeedback("Shield online & synchronized.");
        } else {
          setFeedback("Failed to pull vault state.");
        }
      })
      .catch(() => setFeedback("Telemetry link failed."));
  }, [pioneerId]);

  // Handle state transitions (PendingLock, Locked, Active)
  const handleAction = async (targetState: string) => {
    setIsProcessing(true);
    setFeedback(`Executing ${targetState} protocol...`);

    try {
      const res = await fetch("/api/mesh/pioneer-vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pioneerId, targetState }),
      });
      
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setVaultState(data.vault.vaultState);
        setLockTimestamp(data.vault.lockTimestamp);
        setFeedback(data.message);
      } else {
        setFeedback(data.message || "Operation rejected by MESH.");
      }
    } catch {
      setFeedback("Connection error during cryptographic handshake.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-3 border border-amber-900/80 bg-neutral-900/60 rounded-lg space-y-3 font-mono text-amber-400">
      <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
        <span className="text-[10px] text-neutral-500 uppercase tracking-widest">Wallet Security Shield</span>
        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded border ${
          vaultState === "Active" 
            ? "bg-emerald-950/40 border-emerald-700/50 text-emerald-400" 
            : vaultState === "PendingLock" 
            ? "bg-yellow-950/40 border-yellow-700/50 text-yellow-400 animate-pulse" 
            : "bg-red-950/40 border-red-700/50 text-red-400"
        }`}>
          {vaultState}
        </span>
      </div>

      {lockTimestamp && (
        <div className="text-[10px] text-neutral-400 flex justify-between bg-black/40 p-1.5 rounded border border-neutral-800">
          <span>Timestamp:</span>
          <span className="text-amber-300 font-mono">{new Date(lockTimestamp * 1000).toLocaleTimeString()}</span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <button
          disabled={isProcessing}
          onClick={() => handleAction("PendingLock")}
          className="py-2 bg-yellow-950/60 border border-yellow-700/60 text-yellow-300 text-[10px] font-bold rounded hover:bg-yellow-900 transition-colors disabled:opacity-50"
        >
          60s BUFFER
        </button>
        <button
          disabled={isProcessing}
          onClick={() => handleAction("Locked")}
          className="py-2 bg-red-950/60 border border-red-700/60 text-red-300 text-[10px] font-bold rounded hover:bg-red-900 transition-colors disabled:opacity-50"
        >
          LOCK
        </button>
        <button
          disabled={isProcessing}
          onClick={() => handleAction("Active")}
          className="py-2 bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 text-[10px] font-bold rounded hover:bg-emerald-900 transition-colors disabled:opacity-50"
        >
          RESTORE
        </button>
      </div>

      {/* Guardian Multi-Sig Consensus Trigger */}
      <button
        onClick={() => setIsGuardianModalOpen(true)}
        className="w-full py-2 bg-amber-950/40 border border-amber-600/60 text-amber-300 text-[10px] font-bold rounded hover:bg-amber-900/60 transition-colors uppercase tracking-wider"
      >
        Open 3/5 Guardian Circle
      </button>

      <div className="p-2 bg-black/60 border border-neutral-800 rounded text-[10px] text-neutral-400 truncate">
        <span className="text-amber-500 font-bold">STATUS:</span> {feedback}
      </div>

      {/* Guardian Multi-Sig Modal */}
      <GuardianModal
        pioneerId={pioneerId}
        isOpen={isGuardianModalOpen}
        onClose={() => setIsGuardianModalOpen(false)}
        onSuccess={() => {
          setVaultState("Active");
          setFeedback("Consensus verified. Vault restored.");
        }}
      />
    </div>
  );
}