// Location: components/ElderDisputeModal.tsx
'use client';

import React, { useState } from 'react';
import { Scale, CheckCircle2, AlertCircle, Loader2, ShieldCheck, X } from 'lucide-react';

export interface DisputeDataPayload {
  id: string;
  escrowId: string;
  consumerUid: string;
  providerName: string;
  escrowAmount: number;
  bondAmount: number;
  serviceDescription: string;
  consumerClaim: string;
  zkProofHash: string;
  votesForConsumer: number;
  votesForMerchant: number;
  quorumTotal: number;
}

export interface ElderDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  disputeData: DisputeDataPayload | null;
  onVoteSuccess?: () => void;
}

export default function ElderDisputeModal({
  isOpen,
  onClose,
  disputeData,
  onVoteSuccess,
}: ElderDisputeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voteSuccessMsg, setVoteSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !disputeData) return null;

  const handleCastRuling = async (ruling: 'FAVOR_CONSUMER' | 'FAVOR_PROVIDER') => {
    setIsSubmitting(true);
    setError(null);
    setVoteSuccessMsg(null);

    try {
      const elderUid =
        typeof window !== 'undefined'
          ? localStorage.getItem('mesh_pioneer_uid') || 'local_elder_node'
          : 'local_elder_node';

      const res = await fetch('/api/escrow/dispute/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disputeId: disputeData.id,
          ruling,
          elderUid,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit VRF adjudication vote.');

      setVoteSuccessMsg(
        ruling === 'FAVOR_CONSUMER'
          ? 'Vote recorded: Favor Buyer (Refund)'
          : 'Vote recorded: Favor Merchant (Release)'
      );

      if (onVoteSuccess) onVoteSuccess();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Adjudication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono">
      <div className="w-full max-w-[384px] bg-neutral-950 border border-neutral-800 rounded-2xl p-4 flex flex-col gap-3 shadow-2xl text-neutral-100">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-neutral-800 pb-2.5">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs uppercase">
            <Scale className="w-4 h-4" /> 5-Elder VRF Panel
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-neutral-500 hover:text-neutral-300 transition p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dispute Details */}
        <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-xs space-y-2">
          <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
            <span>Dispute ID:</span>
            <span className="text-neutral-200 font-bold truncate max-w-45">{disputeData.id}</span>
          </div>

          <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
            <span>Locked Escrow:</span>
            <span className="text-amber-400 font-bold">{disputeData.escrowAmount.toLocaleString()} PI</span>
          </div>

          <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
            <span>Security Bond:</span>
            <span className="text-purple-400 font-bold">{disputeData.bondAmount.toLocaleString()} mBZR</span>
          </div>

          <div className="pt-2 border-t border-neutral-800/80">
            <span className="text-[9px] text-neutral-500 uppercase block mb-0.5">Service Reference</span>
            <p className="text-[11px] text-neutral-200 leading-snug">{disputeData.serviceDescription}</p>
          </div>

          <div className="pt-1.5 border-t border-neutral-800/80">
            <span className="text-[9px] text-rose-400 uppercase block mb-0.5">Consumer Claim</span>
            <p className="text-[11px] text-neutral-300 leading-relaxed">{disputeData.consumerClaim}</p>
          </div>

          <div className="pt-1.5 border-t border-neutral-800/80 flex justify-between items-center text-[9px] font-mono text-neutral-400">
            <span>ZK Proof Hash:</span>
            <span className="text-cyan-400 truncate max-w-37.5">{disputeData.zkProofHash}</span>
          </div>
        </div>

        {/* Quorum Metric */}
        <div className="p-2.5 bg-indigo-950/30 border border-indigo-900/60 rounded-xl flex justify-between items-center text-[10px] font-mono">
          <span className="text-neutral-400">Current Votes Cast:</span>
          <span className="text-indigo-300 font-bold">
            {disputeData.votesForConsumer + disputeData.votesForMerchant} / {disputeData.quorumTotal} Elders
          </span>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="p-2 bg-rose-950/40 border border-rose-800 rounded-lg text-[10px] text-rose-300 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {voteSuccessMsg && (
          <div className="p-2 bg-emerald-950/40 border border-emerald-800 rounded-lg text-[10px] text-emerald-300 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{voteSuccessMsg}</span>
          </div>
        )}

        {/* Ruling Actions */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleCastRuling('FAVOR_CONSUMER')}
            disabled={isSubmitting}
            className="py-2.5 px-2 bg-rose-950/80 border border-rose-800 hover:bg-rose-900 text-rose-300 font-bold text-[10px] uppercase rounded-xl transition flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Refund Buyer
          </button>

          <button
            type="button"
            onClick={() => handleCastRuling('FAVOR_PROVIDER')}
            disabled={isSubmitting}
            className="py-2.5 px-2 bg-cyan-950/80 border border-cyan-800 hover:bg-cyan-900 text-cyan-300 font-bold text-[10px] uppercase rounded-xl transition flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Release Merchant
          </button>
        </div>

      </div>
    </div>
  );
}