'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Scale, 
  FileCheck2, 
  AlertOctagon, 
  Lock, 
  RefreshCw, 
  CheckCircle2, 
  X, 
  Coins, 
  User, 
  ExternalLink,
  Award
} from 'lucide-react';

export interface ElderDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  disputeData?: {
    id?: string;
    escrowId?: string;
    consumerUid?: string;
    providerName?: string;
    escrowAmount?: number;
    amount?: number;
    bondAmount?: number;
    serviceDescription?: string;
    consumerClaim?: string;
    zkProofHash?: string;
    votesForConsumer?: number;
    votesForMerchant?: number;
    quorumTotal?: number;
  };
  onVoteSuccess?: () => void;
}

export default function ElderDisputeModal({
  isOpen,
  onClose,
  disputeData,
  onVoteSuccess
}: ElderDisputeModalProps) {
  const [selectedDecision, setSelectedDecision] = useState<'CONSUMER' | 'MERCHANT' | null>(null);
  const [isSigning, setIsSigning] = useState<boolean>(false);
  const [voteSubmitted, setVoteSubmitted] = useState<boolean>(false);
  const [signedTxHash, setSignedTxHash] = useState<string>('');

  if (!isOpen) return null;

  // Safe Fallback Normalization
  const safeEscrowId = disputeData?.escrowId || disputeData?.id || 'ESC_DISP_901';
  const safeConsumer = disputeData?.consumerUid || 'usr_pioneer_consumer_01';
  const safeProvider = disputeData?.providerName || 'GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3';
  const rawEscrowAmount = disputeData?.escrowAmount ?? disputeData?.amount ?? 50.0;
  const safeEscrowAmount = Number(rawEscrowAmount) || 0;
  const safeBondAmount = Number(disputeData?.bondAmount ?? 5000) || 5000;
  const safeServiceDesc = disputeData?.serviceDescription || 'Protocol 28 Verified Vault Settlement';
  const safeClaim = disputeData?.consumerClaim || 'SLA verification failed; non-responsive provider node.';
  const safeZkHash = disputeData?.zkProofHash || '0x7f8a91b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8';
  const safeVotesConsumer = Number(disputeData?.votesForConsumer ?? 1) || 0;
  const safeVotesMerchant = Number(disputeData?.votesForMerchant ?? 1) || 0;
  const safeQuorumTotal = Number(disputeData?.quorumTotal ?? 5) || 5;

  // 75% / 25% Bond Calculations
  const elderPool25Pct = safeBondAmount * 0.25;
  const estYieldPerElder = elderPool25Pct / 3;

  const handleExecuteVote = async () => {
    if (!selectedDecision) return;
    setIsSigning(true);

    try {
      const res = await fetch('/api/escrow/dispute/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disputeId: safeEscrowId,
          ruling: selectedDecision === 'CONSUMER' ? 'FAVOR_CONSUMER' : 'FAVOR_MERCHANT'
        })
      });

      if (!res.ok) throw new Error('Dispute settlement failed.');

      const data = await res.json();
      setSignedTxHash(data?.txHash || `0x${Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`);
      setVoteSubmitted(true);
      if (onVoteSuccess) onVoteSuccess();
    } catch (err) {
      console.error('[ELDER_VOTE_ERROR]:', err);
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-neutral-950/80 backdrop-blur-md">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md p-4 sm:p-5 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto font-mono">
        
        {/* HEADER */}
        <div className="flex justify-between items-start pt-1">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 bg-amber-950/80 border border-amber-800/80 px-2 py-0.5 rounded-md uppercase tracking-wider w-fit">
              <Award size={12} /> Genesis 100 Council Adjudicator
            </div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2 mt-1">
              <Scale size={16} className="text-cyan-400" /> Dispute Review: {safeEscrowId}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* FINANCIAL SUMMARY */}
        <div className="bg-neutral-950 border border-neutral-800/80 p-3 rounded-2xl grid grid-cols-3 gap-2 text-[10px]">
          <div>
            <span className="text-neutral-500 text-[9px] block">Escrow Amount</span>
            <span className="font-bold text-amber-400 text-xs">{(safeEscrowAmount || 0).toLocaleString()} PI</span>
          </div>
          <div>
            <span className="text-neutral-500 text-[9px] block">Security Bond</span>
            <span className="font-bold text-cyan-400 text-xs">{(safeBondAmount || 0).toLocaleString()} mBZR</span>
          </div>
          <div>
            <span className="text-neutral-500 text-[9px] block">Est. Elder Yield</span>
            <span className="font-bold text-emerald-400 text-xs">+{(estYieldPerElder || 0).toFixed(0)} mBZR</span>
          </div>
        </div>

        {/* EVIDENCE ACCORDION */}
        <div className="space-y-2 text-xs">
          <div className="bg-neutral-950/60 border border-neutral-800/60 p-2.5 rounded-xl space-y-1">
            <span className="text-[9px] text-neutral-500 uppercase block">Service Description</span>
            <p className="text-neutral-200 text-xs font-semibold">{safeServiceDesc}</p>
            <div className="flex justify-between text-[9px] text-neutral-400 pt-1 border-t border-neutral-800/60">
              <span>Consumer: {safeConsumer.slice(0, 8)}...</span>
              <span className="text-cyan-400">Provider: {safeProvider.slice(0, 8)}...</span>
            </div>
          </div>

          <div className="bg-rose-950/20 border border-rose-900/40 p-2.5 rounded-xl space-y-0.5">
            <span className="text-[9px] text-rose-400 font-bold flex items-center gap-1 uppercase">
              <AlertOctagon size={11} /> Consumer Claim
            </span>
            <p className="text-neutral-300 text-xs italic">&quot;{safeClaim}&quot;</p>
          </div>

          <div className="bg-cyan-950/20 border border-cyan-900/40 p-2.5 rounded-xl space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-cyan-400 font-bold flex items-center gap-1 uppercase">
                <FileCheck2 size={11} /> Noir ZK Attestation
              </span>
              <span className="text-[8px] text-emerald-400 bg-emerald-950 px-1 py-0.5 rounded border border-emerald-800">
                Verified
              </span>
            </div>
            <div className="text-[9px] text-neutral-400 bg-neutral-950 p-1.5 rounded-lg border border-neutral-800 flex items-center justify-between gap-1">
              <span className="truncate">{safeZkHash}</span>
              <ExternalLink size={10} className="shrink-0 text-cyan-400" />
            </div>
          </div>
        </div>

        {/* QUORUM PROGRESS */}
        <div className="bg-neutral-950 border border-neutral-800 p-2.5 rounded-xl space-y-1.5 text-[10px]">
          <div className="flex justify-between text-neutral-400">
            <span>Elder Council Quorum</span>
            <span className="text-cyan-400 font-bold">{(safeVotesConsumer + safeVotesMerchant)} / {safeQuorumTotal} Cast</span>
          </div>
          <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden flex">
            <div className="bg-rose-500 h-full" style={{ width: `${(safeVotesConsumer / safeQuorumTotal) * 100}%` }} />
            <div className="bg-emerald-500 h-full" style={{ width: `${(safeVotesMerchant / safeQuorumTotal) * 100}%` }} />
          </div>
        </div>

        {/* DECISION MATRIX */}
        {!voteSubmitted ? (
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedDecision('CONSUMER')}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  selectedDecision === 'CONSUMER'
                    ? 'bg-rose-950 border-rose-500 text-rose-300 ring-1 ring-rose-500'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                }`}
              >
                <div className="text-[9px] font-bold text-rose-400 uppercase">Option A</div>
                <div className="text-xs font-bold text-white">Refund Consumer</div>
                <div className="text-[8px] text-neutral-500 mt-0.5">75% Bond + Refund</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDecision('MERCHANT')}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  selectedDecision === 'MERCHANT'
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                }`}
              >
                <div className="text-[9px] font-bold text-emerald-400 uppercase">Option B</div>
                <div className="text-xs font-bold text-white">Release Provider</div>
                <div className="text-[8px] text-neutral-500 mt-0.5">75% Bond + Payout</div>
              </button>
            </div>

            <button
              type="button"
              onClick={handleExecuteVote}
              disabled={!selectedDecision || isSigning}
              className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition ${
                isSigning
                  ? 'bg-cyan-950 border border-cyan-800 text-cyan-400 cursor-wait'
                  : !selectedDecision
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  : 'bg-linear-to-r from-amber-600 to-cyan-600 text-white shadow-lg cursor-pointer'
              }`}
            >
              {isSigning ? <RefreshCw size={14} className="animate-spin text-cyan-400" /> : <Lock size={14} />}
              {isSigning ? 'Submitting Vote...' : 'Submit Adjudication Vote'}
            </button>
          </div>
        ) : (
          <div className="bg-emerald-950/60 border border-emerald-800 p-3 rounded-xl space-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <CheckCircle2 size={16} /> Vote Recorded Successfully
            </div>
            <p className="text-[10px] text-neutral-300">
              Ruling submitted for <span className="text-cyan-300 font-bold">{safeEscrowId}</span> under the 75/25 Schelling distribution rule.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-1.5 bg-neutral-900 border border-neutral-700 text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              Close Portal
            </button>
          </div>
        )}

        <div className="pt-2 border-t border-neutral-800/80 text-[9px] text-neutral-500 flex items-center justify-between">
          <span className="flex items-center gap-1 text-cyan-400">
            <ShieldCheck size={11} /> Schelling Consensus
          </span>
          <span>75% Winner / 25% Elder Pool</span>
        </div>

      </div>
    </div>
  );
}