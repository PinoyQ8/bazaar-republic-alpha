"use client";

import React, { useState } from "react";
import EvidenceHasher from "@/components/council/EvidenceHasher";

interface DisputeModalProps {
  escrowId: string;
  onClose: () => void;
  onDisputeSuccess: () => void;
}

export default function DisputeSubmissionModal({ escrowId, onClose, onDisputeSuccess }: DisputeModalProps) {
  const [evidenceHash, setEvidenceHash] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const handleSubmitDispute = async () => {
    setIsSubmitting(true);
    setResultMessage(null);

    try {
      const res = await fetch("/api/escrow/dispute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          escrowId,
          reason,
          evidenceHash: evidenceHash || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Dispute submission failed");

      if (data.arbitrationTier === "Tier 1 (Deterministic)") {
        setResultMessage(`✓ Instant Auto-Settlement (Tier 1): ${data.resolutionCode}`);
      } else {
        setResultMessage(`✓ Queued for Elder Council Quorum (Tier 2). Dispute ID: ${data.disputeId}`);
      }

      setTimeout(() => {
        onDisputeSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      setResultMessage(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-md w-full p-4 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="font-bold text-sm text-slate-100">Initiate Arbitration Dispute</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">✕</button>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Target Escrow: <span className="text-cyan-400">{escrowId}</span>
        </div>

        <textarea
          placeholder="Reason for dispute..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
        />

        <EvidenceHasher onHashGenerated={(hash) => setEvidenceHash(hash)} />

        {resultMessage && (
          <div className={`p-2 rounded text-xs font-mono ${resultMessage.startsWith("Error") ? "bg-rose-950/60 text-rose-300 border border-rose-800" : "bg-emerald-950/60 text-emerald-300 border border-emerald-800"}`}>
            {resultMessage}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-300 py-2 rounded-lg text-xs transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitDispute}
            disabled={isSubmitting || !reason}
            className="flex-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-xs transition shadow-lg shadow-cyan-950"
          >
            {isSubmitting ? "Broadcasting..." : "Submit to Mesh"}
          </button>
        </div>
      </div>
    </div>
  );
}
