// Location: app/staking/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useVault } from '@/hooks/useVault';
import { Shield, Lock, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

export default function StakingPage() {
  const { escrow, isLoading, error, txHash, fetchVault, releaseFunds } = useVault();
  const [targetEscrowId, setTargetEscrowId] = useState('MBZR_ESCROW_CANARY_01');

  useEffect(() => {
    if (targetEscrowId) {
      fetchVault(targetEscrowId);
    }
  }, [targetEscrowId, fetchVault]);

  const handleRelease = async () => {
    try {
      await releaseFunds(targetEscrowId, escrow?.consumer || 'GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3');
    } catch (err) {
      console.error('Release failed:', err);
    }
  };

  return (
    <main className="w-full max-w-2xl mx-auto min-h-dvh bg-slate-950 text-slate-100 p-6 font-mono">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-6">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-500" />
          <h1 className="text-sm font-bold tracking-widest uppercase">Protocol 28 Staking & Escrow Vault</h1>
        </div>
        <span className="text-[10px] px-2.5 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded">
          Active Node
        </span>
      </div>

      {/* Escrow Lookup Matrix */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 mb-6 space-y-3">
        <label className="text-[10px] text-neutral-400 uppercase tracking-wider block">Target Escrow Identifier</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={targetEscrowId}
            onChange={(e) => setTargetEscrowId(e.target.value)}
            className="flex-1 bg-neutral-950 border border-neutral-700 text-white px-3 py-2 rounded-xl text-xs outline-none focus:border-amber-500"
          />
          <button
            onClick={() => fetchVault(targetEscrowId)}
            disabled={isLoading}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs uppercase rounded-xl transition"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Query'}
          </button>
        </div>
      </div>

      {/* Telemetry Display */}
      {error && (
        <div className="p-3 mb-4 bg-rose-950/30 border border-rose-900 rounded-xl text-rose-400 text-xs">
          ⚠️ {error}
        </div>
      )}

      {escrow ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
              <span className="text-[10px] text-neutral-500 block">Status</span>
              <span className="text-emerald-400 font-bold">{escrow.status}</span>
            </div>
            <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
              <span className="text-[10px] text-neutral-500 block">Locked Amount</span>
              <span className="text-amber-400 font-bold">{escrow.amount} Stroops</span>
            </div>
            <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 col-span-2">
              <span className="text-[10px] text-neutral-500 block">Consumer Address</span>
              <span className="text-zinc-300 text-[11px] truncate block font-sans">{escrow.consumer}</span>
            </div>
          </div>

          <button
            onClick={handleRelease}
            disabled={isLoading || escrow.status !== 'Locked'}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>Execute Escrow Release</span>
          </button>

          {txHash && (
            <div className="p-2.5 bg-emerald-950/20 border border-emerald-900 rounded-xl text-[10px] text-emerald-300 break-all">
              ✅ Settled Hash: {txHash}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-neutral-500 text-xs">
          {isLoading ? 'Querying ledger state...' : 'No active escrow record found in cache.'}
        </div>
      )}
    </main>
  );
}