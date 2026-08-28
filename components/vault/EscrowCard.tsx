// Location: components/vault/EscrowCard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useBazaarVault } from '@/hooks/useBazaarVault';
import { EscrowStatus } from '@/types/bazaar-vault';
import { RefreshCw, Search, ShieldCheck } from 'lucide-react';

interface EscrowCardProps {
  initialEscrowId?: string;
  defaultTokenContract?: string;
}

export function EscrowCard({
  initialEscrowId = 'ESC_9159',
  defaultTokenContract = process.env.NEXT_PUBLIC_BAZAAR_VAULT_CONTRACT_ID || 'CCLEEATNMEUZGVSYL4NSZYADVCAPU2EFCJNCNV77KVOUDFO3CGM3SKKL',
}: EscrowCardProps) {
  const [escrowId, setEscrowId] = useState(initialEscrowId);
  const [verifying, setVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<string | null>(null);

  const { escrow, loading, error, txHash, fetchVault, releaseFunds, disputeEscrow, refundFunds } = useBazaarVault();

  useEffect(() => {
    if (initialEscrowId) {
      setEscrowId(initialEscrowId);
    }
  }, [initialEscrowId]);

  useEffect(() => {
    if (escrowId && escrowId.trim() !== '') {
      fetchVault(escrowId);
    }
  }, [escrowId, fetchVault]);

  const formatAddress = (addr?: string) => (addr ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : 'N/A');
  
  const formatAmount = (val?: bigint | string | number) => {
    if (val === undefined || val === null) return '0.00';
    const num = Number(val);
    return num >= 100_000 ? (num / 10_000_000).toFixed(2) : num.toFixed(2);
  };

  const hasExpiry = escrow?.expires_at !== undefined && escrow.expires_at !== null && Number(escrow.expires_at) > 0;
  const isExpired = hasExpiry ? Date.now() / 1000 > Number(escrow!.expires_at) : false;

  const getStatusBadge = (status?: EscrowStatus) => {
    switch (status) {
      case 'Locked':
        return isExpired 
          ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
      case 'Released':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
      case 'Refunded':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/30';
      case 'Disputed':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse';
      default:
        return 'bg-zinc-800 text-zinc-400 border border-zinc-700';
    }
  };

  const handleVerifyAndSettle = async () => {
    if (!escrow) return;
    setVerifying(true);
    setVerifyStatus('Generating E-Network proof verification...');

    try {
      const mockProof = {
        escrowId,
        tokenContract: defaultTokenContract,
        proofHash: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
        providerSignature: 'SIG_BZR_VERIFIED_NODE_77',
        consumerAddress: escrow.consumer,
        protocolNonce: Date.now(),
      };

      const res = await fetch('/api/mesh/verify-settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockProof),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Server returned non-JSON response (${res.status}): ${text.slice(0, 60)}`);
      }

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Verification settlement failed');

      setVerifyStatus(`Settled on-chain: ${data.txHash ? data.txHash.slice(0, 10) : 'SUCCESS'}...`);
      await fetchVault(escrowId);
    } catch (err: any) {
      setVerifyStatus(`Error: ${err.message}`);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="w-full max-w-[384px] mx-auto rounded-2xl bg-zinc-950 border border-zinc-800/80 p-3.5 font-mono text-xs text-zinc-200 shadow-2xl space-y-3.5 box-border overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2.5">
        <div className="flex items-center space-x-2">
          <div className={`h-2 w-2 rounded-full ${escrow?.status === 'Disputed' ? 'bg-rose-500' : 'bg-emerald-500'} animate-pulse`} />
          <span className="font-semibold text-zinc-100 uppercase tracking-wider text-[11px]">
            BAZAAR-REPUBLIC // ESCROW VAULT
          </span>
        </div>
        <span className="text-[10px] text-zinc-500">Protocol 28</span>
      </div>

      {/* 🛡️ S23 VIEWPORT CONSTRAINED QUERY BAR */}
      <form onSubmit={(e) => { e.preventDefault(); fetchVault(escrowId); }} className="flex items-center gap-1.5 w-full">
        <div className="relative flex-1 min-w-0">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={escrowId}
            onChange={(e) => setEscrowId(e.target.value)}
            placeholder="Escrow ID (e.g. ESC_9159)"
            className="w-full min-w-0 bg-zinc-900 border border-zinc-800 rounded-lg pl-7 pr-2 py-2 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/60 transition"
          />
        </div>
        <button
          type="submit"
          disabled={loading || verifying}
          className="shrink-0 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg flex items-center justify-center gap-1 transition cursor-pointer disabled:opacity-50 whitespace-nowrap shadow-md shadow-amber-500/10"
        >
          {loading ? <RefreshCw size={12} className="animate-spin" /> : <span>SYNC</span>}
        </button>
      </form>

      {/* Feedback Alert */}
      {error && (
        <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-[11px] break-all leading-tight">
          {error}
        </div>
      )}

      {verifyStatus && (
        <div className="p-2 rounded bg-amber-950/30 border border-amber-800/40 text-amber-300 text-[10px] break-all">
          [E-NETWORK]: {verifyStatus}
        </div>
      )}

      {txHash && (
        <div className="p-2 rounded bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-[10px] break-all">
          [BZR-NODE-TX]: {txHash}
        </div>
      )}

      {/* Escrow Record Content */}
      {escrow ? (
        <div className="space-y-3 bg-zinc-900/50 rounded-xl p-3 border border-zinc-800/40">
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">STATUS</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadge(escrow.status)}`}>
              {escrow.status} {isExpired && escrow.status === 'Locked' ? '(EXPIRED)' : ''}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-zinc-500">LOCKED AMOUNT</span>
            <span className="text-sm font-bold text-amber-400">
              {formatAmount(escrow.amount)} <span className="text-[10px] text-zinc-400">PI</span>
            </span>
          </div>

          <div className="flex justify-between items-center text-[11px]">
            <span className="text-zinc-500">CONSUMER</span>
            <span className="text-zinc-300" title={escrow.consumer}>{formatAddress(escrow.consumer)}</span>
          </div>

          <div className="flex justify-between items-center text-[11px]">
            <span className="text-zinc-500">PROVIDER</span>
            <span className="text-zinc-300" title={escrow.provider}>{formatAddress(escrow.provider)}</span>
          </div>

          <div className="flex justify-between items-center text-[11px]">
            <span className="text-zinc-500">TIMELOCK</span>
            <span className={isExpired ? "text-orange-400 font-semibold" : "text-zinc-400"}>
              {hasExpiry 
                ? new Date(Number(escrow.expires_at) * 1000).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                : 'Protocol Default (48h)'}
            </span>
          </div>

          {/* Action Triggers */}
          {escrow.status === 'Locked' && (
            <div className="space-y-2 pt-2 border-t border-zinc-800/60">
              {!isExpired && (
                <button
                  onClick={handleVerifyAndSettle}
                  disabled={loading || verifying}
                  className="w-full py-2.5 bg-linear-to-r from-amber-600/30 to-amber-500/20 hover:from-amber-600/40 hover:to-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg font-semibold transition disabled:opacity-50 text-[11px] cursor-pointer disabled:cursor-not-allowed"
                >
                  {verifying ? 'VERIFYING PROOF...' : '⚡ VERIFY & AUTO-SETTLE'}
                </button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => disputeEscrow(escrowId)}
                  disabled={loading || verifying}
                  className="w-full py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-lg font-semibold transition disabled:opacity-50 text-[11px] cursor-pointer disabled:cursor-not-allowed"
                >
                  RAISE DISPUTE
                </button>

                <button
                  onClick={() => refundFunds(escrowId)}
                  disabled={loading || verifying || !isExpired}
                  className={`w-full py-2 border rounded-lg font-semibold transition text-[11px] ${
                    isExpired 
                      ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border-blue-500/30 cursor-pointer' 
                      : 'bg-zinc-800/50 text-zinc-600 border-zinc-800 cursor-not-allowed'
                  }`}
                >
                  CLAWBACK
                </button>
              </div>
            </div>
          )}

          {escrow.status === 'Disputed' && (
            <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/40 text-center">
              <span className="text-[11px] text-rose-300 font-semibold uppercase tracking-wider block">
                Escrow In DAO Arbitration
              </span>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">
                Settlement & Clawbacks frozen pending 5-Elder VRF adjudication.
              </span>
            </div>
          )}
        </div>
      ) : (
        !loading && (
          <div className="text-center py-5 text-zinc-600 text-[11px]">
            No active escrow record found. Enter an ID to synchronize.
          </div>
        )
      )}

      {(loading || verifying) && (
        <div className="text-center text-amber-400 text-[11px] animate-pulse">
          Processing MESH Cryptographic Pipeline...
        </div>
      )}
    </div>
  );
}