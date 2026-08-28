"use client";

import { useState } from "react";

interface GuardianModalProps {
  pioneerId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function GuardianModal({ pioneerId, isOpen, onClose, onSuccess }: GuardianModalProps) {
  const [signatures, setSignatures] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleSimulateSignature = () => {
    if (signatures < 3) {
      setSignatures((prev) => prev + 1);
    }
  };

  const handleSubmitConsensus = async () => {
    setIsVerifying(true);
    // Simulate MESH network delay for cryptographic verification
    setTimeout(() => {
      setIsVerifying(false);
      onSuccess();
      onClose();
      setSignatures(0); // Reset for future calls
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-neutral-950 border border-amber-600/50 rounded-xl p-5 w-full max-w-sm space-y-4 shadow-[0_0_15px_rgba(217,119,6,0.15)] font-mono">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
          <h2 className="text-amber-500 font-bold tracking-widest text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            3/5 GUARDIAN CONSENSUS
          </h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-red-400 font-bold text-sm">✕</button>
        </div>

        {/* Target Info */}
        <p className="text-[10px] text-neutral-400">
          Node <span className="text-amber-300">{pioneerId.substring(0, 12)}...</span> requires Multi-Sig consensus from the Elder Council to break the lock.
        </p>

        {/* Signature Counter */}
        <div className="flex justify-between items-center bg-black/60 p-3 rounded border border-neutral-800">
          <span className="text-[10px] text-neutral-500 uppercase">Signatures Collected</span>
          <span className={`font-bold text-sm ${signatures >= 3 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {signatures} / 5
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${signatures >= 3 ? 'bg-emerald-500' : 'bg-amber-500'}`}
            style={{ width: `${(signatures / 5) * 100}%` }}
          ></div>
        </div>

        {/* Action Matrix */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={handleSimulateSignature}
            disabled={signatures >= 5 || isVerifying}
            className="py-2 bg-neutral-900 border border-neutral-700 text-neutral-300 text-[10px] font-bold rounded hover:bg-neutral-800 disabled:opacity-50 transition-colors uppercase"
          >
            + Add Signature
          </button>
          
          <button
            onClick={handleSubmitConsensus}
            disabled={signatures < 3 || isVerifying}
            className="py-2 bg-emerald-950/40 border border-emerald-600/50 text-emerald-400 text-[10px] font-bold rounded hover:bg-emerald-900/60 disabled:opacity-30 disabled:border-neutral-800 disabled:text-neutral-600 transition-colors uppercase tracking-wider"
          >
            {isVerifying ? "Verifying..." : "Override"}
          </button>
        </div>
      </div>
    </div>
  );
}