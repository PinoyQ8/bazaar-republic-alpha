// Location: /app/dashboard/components/GuardianModal.tsx
"use client";

import { useState } from "react";

interface GuardianModalProps {
  pioneerId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// 🛡️ Mock Guardian Node Placeholders for Pre-Live Testing
const MOCK_GUARDIANS = [
  { id: "node_alpha_x570", name: "X570 Workstation Node", role: "Primary Anchor" },
  { id: "node_beta_nitro", name: "Acer Nitro Mobile Node", role: "Secondary Relay" },
  { id: "node_gamma_s23", name: "S23 Ultra Edge Node", role: "Mobile Guardian" },
  { id: "node_delta_local", name: "Testnet Validator Alpha", role: "Consensus Watcher" },
  { id: "node_epsilon_test", name: "Testnet Validator Beta", role: "Consensus Watcher" },
];

export default function GuardianModal({ pioneerId, isOpen, onClose, onSuccess }: GuardianModalProps) {
  const [selectedGuardians, setSelectedGuardians] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("Awaiting 3 of 5 guardian sign-offs...");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleGuardian = (id: string) => {
    if (selectedGuardians.includes(id)) {
      setSelectedGuardians(selectedGuardians.filter(g => g !== id));
    } else {
      if (selectedGuardians.length < 5) {
        setSelectedGuardians([...selectedGuardians, id]);
      }
    }
  };

  const handleConsensusSubmit = async () => {
    if (selectedGuardians.length < 3) {
      setFeedback("Error: Minimum threshold of 3 guardians required for consensus.");
      return;
    }

    setIsSubmitting(true);
    setFeedback("Transmitting multi-sig consensus to MESH...");

    try {
      const res = await fetch("/api/mesh/vault/secure-withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pioneerId,
          action: "GUARDIAN_VETO", // Or unlock action depending on flow
          txId: "mock_tx_consensus_override",
          unlockSigs: selectedGuardians,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setFeedback("Consensus reached! Vault quarantine lifted.");
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setFeedback(data.message || "Consensus rejected by MESH firewall.");
      }
    } catch {
      setFeedback("Network fault during multi-sig broadcast.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const thresholdMet = selectedGuardians.length >= 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono">
      <div className="w-full max-w-md bg-neutral-950 border border-amber-900/80 rounded-lg p-5 space-y-4 shadow-2xl">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-amber-900/40 pb-3">
          <div>
            <h3 className="text-sm font-bold text-amber-500 uppercase tracking-widest">3/5 Security Circle</h3>
            <p className="text-[10px] text-neutral-400">Multi-Sig Consensus Overrides & Quarantine Lifts</p>
          </div>
          <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
            thresholdMet ? "bg-emerald-950/40 border-emerald-700 text-emerald-400" : "bg-yellow-950/40 border-yellow-700 text-yellow-400"
          }`}>
            {selectedGuardians.length} / 3 Required
          </span>
        </div>

        {/* Guardian Selection List */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {MOCK_GUARDIANS.map((guardian) => {
            const isSelected = selectedGuardians.includes(guardian.id);
            return (
              <div
                key={guardian.id}
                onClick={() => toggleGuardian(guardian.id)}
                className={`p-2.5 rounded border text-xs cursor-pointer transition-all flex justify-between items-center ${
                  isSelected 
                    ? "bg-amber-950/30 border-amber-600 text-amber-300" 
                    : "bg-neutral-900/40 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                }`}
              >
                <div>
                  <p className="font-bold text-white">{guardian.name}</p>
                  <p className="text-[10px] text-neutral-500">{guardian.id} • {guardian.role}</p>
                </div>
                <div className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                  isSelected ? "bg-amber-600 border-amber-500 text-black font-bold" : "border-neutral-700"
                }`}>
                  {isSelected ? "✓" : ""}
                </div>
              </div>
            );
          })}
        </div>

        {/* Status Terminal */}
        <div className="p-2 bg-black/60 border border-neutral-800 rounded text-[10px] text-neutral-400">
          <span className="text-amber-500 font-bold">STATUS:</span> {feedback}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={onClose}
            className="py-2 bg-neutral-900 border border-neutral-700 text-neutral-300 text-xs font-bold rounded hover:bg-neutral-800 transition-colors"
          >
            ABORT
          </button>
          <button
            disabled={!thresholdMet || isSubmitting}
            onClick={handleConsensusSubmit}
            className="py-2 bg-amber-600 hover:bg-amber-500 text-neutral-950 text-xs font-bold rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "SIGNING..." : "EXECUTE CONSENSUS"}
          </button>
        </div>

      </div>
    </div>
  );
}