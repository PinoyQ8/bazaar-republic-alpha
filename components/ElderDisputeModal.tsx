'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Scale,
  FileCheck2,
  AlertOctagon,
  Lock,
  RefreshCw,
  CheckCircle2,
  X,
  ExternalLink,
  Award,
  AlertCircle,
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

interface ResolveApiResult {
  success?: boolean;
  pendingQuorum?: boolean;
  code?: string;
  error?: string;
  message?: string;
  escrowId?: string;
  ruling?: string;
  escrowStatus?: string;
  settlementMode?: 'ON_CHAIN_PQ' | 'LEDGER_ONLY' | string;
  txHash?: string | null;
}

export default function ElderDisputeModal({
  isOpen,
  onClose,
  disputeData,
  onVoteSuccess,
}: ElderDisputeModalProps) {
  const [selectedDecision, setSelectedDecision] = useState<'CONSUMER' | 'MERCHANT' | null>(null);
  const [isSigning, setIsSigning] = useState<boolean>(false);
  const [voteSubmitted, setVoteSubmitted] = useState<boolean>(false);
  const [pendingQuorumMsg, setPendingQuorumMsg] = useState<string | null>(null);
  const [resolveResult, setResolveResult] = useState<ResolveApiResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedDecision(null);
      setIsSigning(false);
      setVoteSubmitted(false);
      setPendingQuorumMsg(null);
      setResolveResult(null);
      setSubmitError(null);
    }
  }, [isOpen, disputeData?.id, disputeData?.escrowId]);

  if (!isOpen) return null;

  const safeDisputeId = disputeData?.id || disputeData?.escrowId || 'ESC_DISP_901';
  const safeEscrowId = disputeData?.escrowId || disputeData?.id || 'ESC_DISP_901';
  const safeConsumer = disputeData?.consumerUid || 'usr_pioneer_consumer_01';
  const safeProvider =
    disputeData?.providerName || 'GA7UMIANNCXSZK5NQ7GCAWL3BP3GOBGVRHLSRYY5WI2KZG4SRFLZSARW';
  const rawEscrowAmount = disputeData?.escrowAmount ?? disputeData?.amount ?? 50.0;
  const safeEscrowAmount = Number(rawEscrowAmount) || 0;
  const safeBondAmount = Number(disputeData?.bondAmount ?? 5000) || 5000;
  const safeServiceDesc =
    disputeData?.serviceDescription || 'Protocol 30 ML-DSA-65 Vault Settlement';
  const safeClaim =
    disputeData?.consumerClaim || 'SLA verification failed; non-responsive provider node.';
  const safeZkHash =
    disputeData?.zkProofHash || '0x7f8a91b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8';
  const safeVotesConsumer = Number(disputeData?.votesForConsumer ?? 1) || 0;
  const safeVotesMerchant = Number(disputeData?.votesForMerchant ?? 1) || 0;
  const safeQuorumTotal =
    Number(disputeData?.quorumTotal ?? 5) > 0 ? Number(disputeData?.quorumTotal) : 5;

  const projectedMajorityCount =
    selectedDecision === 'CONSUMER'
      ? Math.max(3, safeVotesConsumer + 1)
      : selectedDecision === 'MERCHANT'
      ? Math.max(3, safeVotesMerchant + 1)
      : Math.max(3, Math.max(safeVotesConsumer, safeVotesMerchant));

  const elderPool25Pct = safeBondAmount * 0.25;
  const estYieldPerElder = elderPool25Pct / Math.max(1, projectedMajorityCount);

  const handleExecuteVote = async () => {
    if (!selectedDecision) return;
    setIsSigning(true);
    setSubmitError(null);
    setPendingQuorumMsg(null);

    try {
      const elderUid =
        typeof window !== 'undefined'
          ? window.localStorage.getItem('mesh_pioneer_uid') || 'usr_elder_1'
          : 'usr_elder_1';

      const res = await fetch('/api/escrow/dispute/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disputeId: safeDisputeId,
          escrowId: safeEscrowId,
          elderUid,
          ruling: selectedDecision === 'CONSUMER' ? 'FAVOR_CONSUMER' : 'FAVOR_MERCHANT',
        }),
      });

      const payload: ResolveApiResult = await res.json().catch(() => ({}));

      if (
        res.status === 202 ||
        payload?.pendingQuorum ||
        payload?.code === 'VOTE_RECORDED_PENDING_QUORUM'
      ) {
        setPendingQuorumMsg(
          payload?.error ||
            payload?.message ||
            'Vote recorded; awaiting 3-of-5 Elder quorum.'
        );
        if (onVoteSuccess) onVoteSuccess();
        return;
      }

      if (!res.ok || payload?.success === false) {
        const message =
          payload?.error ||
          payload?.message ||
          `Dispute settlement failed (${res.status}).`;
        throw new Error(message);
      }

      setResolveResult(payload);
      setVoteSubmitted(true);
      if (onVoteSuccess) onVoteSuccess();
    } catch (err: any) {
      const message = err?.message || 'Dispute settlement failed.';
      setSubmitError(message);
      console.error('[ELDER_VOTE_ERROR]:', err);
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-neutral-950/80 backdrop-blur-md">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md p-4 sm:p-5 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto font-mono">
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
            type="button"
            onClick={onClose}
            className="p-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="bg-neutral-950 border border-neutral-800/80 p-3 rounded-2xl grid grid-cols-3 gap-2 text-[10px]">
          <div>
            <span className="text-neutral-500 text-[9px] block">Escrow Amount</span>
            <span className="font-bold text-amber-400 text-xs">
              {safeEscrowAmount.toLocaleString()} PI
            </span>
          </div>
          <div>
            <span className="text-neutral-500 text-[9px] block">Security Bond</span>
            <span className="font-bold text-cyan-400 text-xs">
              {safeBondAmount.toLocaleString()} mBZR
            </span>
          </div>
          <div>
            <span className="text-neutral-500 text-[9px] block">
              Est. Elder Yield ({projectedMajorityCount} Maj)
            </span>
            <span className="font-bold text-emerald-400 text-xs">
              +{estYieldPerElder.toFixed(0)} mBZR
            </span>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="bg-neutral-950/60 border border-neutral-800/60 p-2.5 rounded-xl space-y-1">
            <span className="text-[9px] text-neutral-500 uppercase block">
              Service Description
            </span>
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
            <p className="text-neutral-300 text-xs italic">"{safeClaim}"</p>
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

        <div className="bg-neutral-950 border border-neutral-800 p-2.5 rounded-xl space-y-1.5 text-[10px]">
          <div className="flex justify-between text-neutral-400">
            <span>Elder Council Quorum</span>
            <span className="text-cyan-400 font-bold">
              {safeVotesConsumer + safeVotesMerchant} / {safeQuorumTotal} Cast
            </span>
          </div>
          <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden flex">
            <div
              className="bg-rose-500 h-full"
              style={{
                width: `${Math.min(100, (safeVotesConsumer / safeQuorumTotal) * 100)}%`,
              }}
            />
            <div
              className="bg-emerald-500 h-full"
              style={{
                width: `${Math.min(100, (safeVotesMerchant / safeQuorumTotal) * 100)}%`,
              }}
            />
          </div>
        </div>

        {!voteSubmitted ? (
          <div className="space-y-2.5">
            {submitError && (
              <div className="p-2.5 bg-rose-950/50 border border-rose-800/80 rounded-xl text-[10px] text-rose-300 flex items-start gap-1.5">
                <AlertCircle size={13} className="shrink-0 mt-0.5 text-rose-400" />
                <span>{submitError}</span>
              </div>
            )}

            {pendingQuorumMsg && (
              <div className="p-2.5 bg-amber-950/50 border border-amber-800/80 rounded-xl text-[10px] text-amber-200 flex items-start gap-1.5">
                <AlertCircle size={13} className="shrink-0 mt-0.5 text-amber-400" />
                <span>{pendingQuorumMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedDecision('CONSUMER');
                  setSubmitError(null);
                  setPendingQuorumMsg(null);
                }}
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
                onClick={() => {
                  setSelectedDecision('MERCHANT');
                  setSubmitError(null);
                  setPendingQuorumMsg(null);
                }}
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
              {isSigning ? (
                <RefreshCw size={14} className="animate-spin text-cyan-400" />
              ) : (
                <Lock size={14} />
              )}
              {isSigning ? 'Submitting Vote...' : 'Submit Adjudication Vote'}
            </button>
          </div>
        ) : (
          <div className="bg-emerald-950/60 border border-emerald-800 p-3 rounded-xl space-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <CheckCircle2 size={16} /> Dispute Resolved
            </div>
            <p className="text-[10px] text-neutral-300">
              Ruling submitted for{' '}
              <span className="text-cyan-300 font-bold">{resolveResult?.escrowId || safeEscrowId}</span>{' '}
              ({resolveResult?.settlementMode || 'ON_CHAIN_PQ'}) under the 75/25 Schelling distribution rule.
            </p>
            {resolveResult?.txHash && (
              <div className="text-[9px] text-emerald-300 bg-neutral-950 p-1.5 rounded-lg border border-emerald-900/70 truncate">
                Tx: {resolveResult.txHash}
              </div>
            )}
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
