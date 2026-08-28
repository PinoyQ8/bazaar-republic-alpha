// Location: components/EscrowLockPanel.tsx
'use client';

import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react';

interface EscrowLockPanelProps {
  consumerUid: string;
  onLockSuccess?: () => void;
}

export default function EscrowLockPanel({ consumerUid, onLockSuccess }: EscrowLockPanelProps) {
  const [providerAddress, setProviderAddress] = useState('');
  const [piAmount, setPiAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLocking, setIsLocking] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const handleCreateEscrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerAddress || !piAmount || parseFloat(piAmount) <= 0) {
      setFeedback({ type: 'error', msg: 'Please provide a valid provider address and Pi amount.' });
      return;
    }

    setIsLocking(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/escrow/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consumerUid,
          providerAddress: providerAddress.trim(),
          piAmount: parseFloat(piAmount),
          description: description.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to lock escrow funds.');

      setFeedback({ type: 'success', msg: `Vault Locked! Escrow ID: ${data.escrowId?.slice(-6) || 'ACTIVE'}` });
      setProviderAddress('');
      setPiAmount('');
      setDescription('');
      if (onLockSuccess) onLockSuccess();
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err.message || 'Escrow initialization failed.' });
    } finally {
      setIsLocking(false);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 font-mono text-slate-100">
      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
        <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-cyan-400" /> New Merchant Escrow
        </span>
        <span className="text-[10px] text-cyan-400 font-bold">48h Timelock Guard</span>
      </div>

      <form onSubmit={handleCreateEscrow} className="flex flex-col gap-2.5">
        <div>
          <label className="text-[9px] text-slate-400 uppercase">Provider Wallet / UID</label>
          <input
            type="text"
            value={providerAddress}
            onChange={(e) => setProviderAddress(e.target.value)}
            placeholder="G... or usr_pioneer_..."
            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <label className="text-[9px] text-slate-400 uppercase">Collateral Amount (Pi)</label>
          <input
            type="number"
            step="0.0000001"
            value={piAmount}
            onChange={(e) => setPiAmount(e.target.value)}
            placeholder="e.g. 50.0"
            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <label className="text-[9px] text-slate-400 uppercase">Deliverable Brief / Scope</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. UI/UX Asset Pack or Server Relay Provision"
            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <button
          type="submit"
          disabled={isLocking}
          className="w-full mt-1 py-2.5 bg-linear-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-lg uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-[0.98]"
        >
          {isLocking ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Anchoring Vault...</>
          ) : (
            <><span>Initialize & Lock Escrow</span> <ArrowRight className="w-3.5 h-3.5" /></>
          )}
        </button>
      </form>

      {feedback && (
        <div
          className={`p-2.5 rounded-lg border text-[10px] flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          )}
          <span className="truncate">{feedback.msg}</span>
        </div>
      )}
    </div>
  );
}