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
  Clock, 
  ExternalLink,
  Award
} from 'lucide-react';

interface ElderDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  disputeData?: {
    id: string;
    escrowId: string;
    consumerUid: string;
    providerName: string;
    escrowAmount: number; // in PI
    bondAmount: number; // in mBZR
    serviceDescription: string;
    consumerClaim: string;
    zkProofHash: string;
    votesForConsumer: number;
    votesForMerchant: number;
    quorumTotal: number;
  };
  onVoteSuccess?: () => void;
}

export default function ElderDisputeModal({
  isOpen,
  onClose,
  disputeData = {
    id: "dsp_9082_alpha",
    escrowId: "ESC-9082-ALPHA",
    consumerUid: "pioneer_kw_88",
    providerName: "MeshTech Solutions",
    escrowAmount: 50.0,
    bondAmount: 5000, // mBZR
    serviceDescription: "E-Network Node Configuration & Relayer Setup",
    consumerClaim: "Node latency exceeds 450ms SLA; ZK relayer failed peer discovery.",
    zkProofHash: "0x7f8a91b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8",
    votesForConsumer: 1,
    votesForMerchant: 1,
    quorumTotal: 5
  },
  onVoteSuccess
}: ElderDisputeModalProps) {
  const [selectedDecision, setSelectedDecision] = useState<'CONSUMER' | 'MERCHANT' | null>(null);
  const [isSigning, setIsSigning] = useState<boolean>(false);
  const [voteSubmitted, setVoteSubmitted] = useState<boolean>(false);
  const [signedTxHash, setSignedTxHash] = useState<string>('');

  if (!isOpen) return null;

  // 75% / 25% Bond Calculations
  const elderPool25Pct = disputeData.bondAmount * 0.25;
  const estYieldPerElder = elderPool25Pct / 3; // Estimated yield assuming 3/5 majority

  const handleExecuteVote = async () => {
    if (!selectedDecision) return;

    setIsSigning(true);
    try {
      // 1. Simulate Passkey WebAuthn Hardware Signing Handshake
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 2. Submit Vote Payload to API (/api/escrow/dispute/resolve or vote route)
      const mockHash = '0x' + Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      setSignedTxHash(mockHash);
      setVoteSubmitted(true);
      if (onVoteSuccess) onVoteSuccess();
    } catch (err) {
      console.error('[ELDER VOTE ERROR]:', err);
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-neutral-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md p-4 sm:p-5 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* MODAL HEADER */}
        <div className="flex justify-between items-start pt-1">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-amber-400 bg-amber-950/80 border border-amber-800/80 px-2 py-0.5 rounded-md uppercase tracking-wider w-fit">
              <Award size={12} /> Genesis 100 Council Adjudicator
            </div>
            <h2 className="text-base font-bold text-white flex items-center gap-2 mt-1">
              <Scale size={18} className="text-cyan-400" /> Dispute Review: {disputeData.escrowId}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-400 hover:text-white transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* FINANCIAL SUMMARY CARD */}
        <div className="bg-neutral-950 border border-neutral-800/80 p-3 rounded-2xl grid grid-cols-3 gap-2 font-mono text-[11px]">
          <div>
            <span className="text-neutral-500 text-[9px] block">Vault Value</span>
            <span className="font-bold text-amber-400">{disputeData.escrowAmount.toFixed(1)} PI</span>
          </div>
          <div>
            <span className="text-neutral-500 text-[9px] block">Challenger Bond</span>
            <span className="font-bold text-cyan-400">{disputeData.bondAmount.toLocaleString()} mBZR</span>
          </div>
          <div>
            <span className="text-neutral-500 text-[9px] block">Est. Elder Yield</span>
            <span className="font-bold text-emerald-400">+{estYieldPerElder.toFixed(0)} mBZR</span>
          </div>
        </div>

        {/* EVIDENCE & CLAIMS CONTAINER */}
        <div className="space-y-2.5 font-mono text-xs">
          {/* SERVICE DETAILS */}
          <div className="bg-neutral-950/60 border border-neutral-800/60 p-3 rounded-xl space-y-1">
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Service Contract</span>
            <p className="text-neutral-200 font-sans text-xs font-semibold">{disputeData.serviceDescription}</p>
            <div className="flex justify-between text-[10px] text-neutral-400 pt-1 border-t border-neutral-800">
              <span className="flex items-center gap-1"><User size={10} /> Consumer: {disputeData.consumerUid}</span>
              <span className="text-cyan-400">Merchant: {disputeData.providerName}</span>
            </div>
          </div>

          {/* CONSUMER CLAIM */}
          <div className="bg-rose-950/20 border border-rose-900/40 p-3 rounded-xl space-y-1">
            <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1 uppercase">
              <AlertOctagon size={12} /> Consumer Claim Statement
            </span>
            <p className="text-neutral-300 font-sans text-xs italic">"{disputeData.consumerClaim}"</p>
          </div>

          {/* NOIR ZK ATTESTATION PROOF */}
          <div className="bg-cyan-950/20 border border-cyan-900/40 p-3 rounded-xl space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-cyan-400 font-bold flex items-center gap-1 uppercase">
                <FileCheck2 size={12} /> Merchant ZK Proof Attestation
              </span>
              <span className="text-[9px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                Verified On-Chain
              </span>
            </div>
            <div className="text-[10px] text-neutral-400 break-all bg-neutral-950 p-2 rounded-lg border border-neutral-800 font-mono flex items-center justify-between gap-1">
              <span className="truncate">{disputeData.zkProofHash}</span>
              <ExternalLink size={12} className="shrink-0 text-cyan-400" />
            </div>
          </div>
        </div>

        {/* QUORUM & VOTING STATUS */}
        <div className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl space-y-2 font-mono text-[11px]">
          <div className="flex justify-between items-center text-neutral-400">
            <span>Elder Council Quorum</span>
            <span className="text-cyan-400 font-bold">
              {disputeData.votesForConsumer + disputeData.votesForMerchant} / {disputeData.quorumTotal} Cast
            </span>
          </div>
          <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden flex">
            <div 
              className="bg-rose-500 h-full transition-all" 
              style={{ width: `${(disputeData.votesForConsumer / disputeData.quorumTotal) * 100}%` }}
              title="Consumer Votes"
            />
            <div 
              className="bg-emerald-500 h-full transition-all" 
              style={{ width: `${(disputeData.votesForMerchant / disputeData.quorumTotal) * 100}%` }}
              title="Merchant Votes"
            />
          </div>
          <div className="flex justify-between text-[10px] text-neutral-500">
            <span className="text-rose-400">Refund Consumer ({disputeData.votesForConsumer})</span>
            <span className="text-emerald-400">Release Merchant ({disputeData.votesForMerchant})</span>
          </div>
        </div>

        {/* DECISION SELECTION BUTTONS */}
        {!voteSubmitted ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSelectedDecision('CONSUMER')}
                className={`p-3 rounded-2xl border text-left font-mono transition-all ${
                  selectedDecision === 'CONSUMER'
                    ? 'bg-rose-950 border-rose-500 text-rose-300 ring-2 ring-rose-500/50'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="text-[10px] uppercase font-bold text-rose-400">Option A</div>
                <div className="text-xs font-bold text-white mt-0.5">Refund Consumer</div>
                <div className="text-[9px] text-neutral-500 mt-1">Rule: SLA Breach Confirmed</div>
              </button>

              <button
                onClick={() => setSelectedDecision('MERCHANT')}
                className={`p-3 rounded-2xl border text-left font-mono transition-all ${
                  selectedDecision === 'MERCHANT'
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/50'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="text-[10px] uppercase font-bold text-emerald-400">Option B</div>
                <div className="text-xs font-bold text-white mt-0.5">Release Merchant</div>
                <div className="text-[9px] text-neutral-500 mt-1">Rule: ZK Proof Validated</div>
              </button>
            </div>

            {/* VOTE EXECUTION BUTTON */}
            <button
              onClick={handleExecuteVote}
              disabled={!selectedDecision || isSigning}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 ${
                isSigning
                  ? 'bg-cyan-950 border border-cyan-800 text-cyan-400 cursor-wait'
                  : !selectedDecision
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  : 'bg-linear-to-r from-amber-600 to-cyan-600 hover:from-amber-500 hover:to-cyan-500 text-white shadow-cyan-950/50'
              }`}
            >
              {isSigning ? (
                <>
                  <RefreshCw size={16} className="animate-spin text-cyan-400" />
                  Authenticating Knox Passkey...
                </>
              ) : (
                <>
                  <Lock size={16} />
                  Submit Passkey Adjudication Vote
                </>
              )}
            </button>
          </div>
        ) : (
          /* VOTE CONFIRMATION CARD */
          <div className="bg-emerald-950/60 border border-emerald-800 p-4 rounded-2xl space-y-2 font-mono text-xs animate-in fade-in">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 size={18} /> Elder Vote Signed & Cast!
            </div>
            <p className="text-[11px] text-neutral-300 font-sans">
              Your decision has been cryptographically attached to Council Dispute <span className="font-mono text-cyan-300">{disputeData.escrowId}</span>.
            </p>
            <div className="text-[10px] text-neutral-400 break-all bg-neutral-950 p-2 rounded-lg border border-neutral-800">
              Tx Hash: <span className="text-emerald-300">{signedTxHash}</span>
            </div>
            <div className="text-[10px] text-amber-400/90 pt-1 flex items-center gap-1">
              <Coins size={12} /> Eligible for 25% Elder Pool split upon majority settlement.
            </div>
            <button
              onClick={onClose}
              className="w-full mt-2 py-2 bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition"
            >
              Return to Escrow Hub
            </button>
          </div>
        )}

        {/* GAME-THEORETIC RULE FOOTER */}
        <div className="pt-2 border-t border-neutral-800/80 text-[10px] font-mono text-neutral-500 flex items-center justify-between">
          <span className="flex items-center gap-1 text-cyan-400/80">
            <ShieldCheck size={12} /> Schelling Point Protocol
          </span>
          <span>75% Winner / 25% Non-Bias Elder</span>
        </div>

      </div>
    </div>
  );
}