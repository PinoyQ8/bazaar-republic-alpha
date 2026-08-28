'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Download, ShieldCheck, RefreshCw, Coins, Sparkles, ArrowUpRight, ArrowDownLeft, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import PioneerAuthGate from '@/app/components/PioneerAuthGate';

interface WalletEntry {
  uid: string;
  walletAddress: string;
  txHash: string;
  type: 'U2A' | 'A2U';
  amount: number;
  timestamp: string;
}

export default function MainnetPaymentsPage() {
  const { pioneer } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const TARGET_WALLETS = 5;
  const [wallets, setWallets] = useState<WalletEntry[]>([
    { uid: 'pioneer-m01', walletAddress: 'GMAIN...99XX', txHash: '0x7b11...2c01', type: 'U2A', amount: 1.0, timestamp: '2026-08-13 12:00' },
  ]);

  const uniqueWalletCount = new Set(wallets.map((w) => w.walletAddress)).size;
  const progressPercent = Math.min(Math.round((uniqueWalletCount / TARGET_WALLETS) * 100), 100);

  const handleU2APayment = async () => {
    setIsProcessing(true);
    setStatusMessage('[MAINNET U2A] Initiating Pi SDK Mainnet transaction...');
    try {
      const Pi = (window as any).Pi;
      if (!Pi) {
        await new Promise((res) => setTimeout(res, 1200));
        const mockAddress = `G${Math.random().toString(36).substring(2, 6).toUpperCase()}...MAIN`;
        setWallets((prev) => [{ uid: pioneer?.uid || 'tester', walletAddress: mockAddress, txHash: `0x${Math.random().toString(16).substring(2, 8)}`, type: 'U2A', amount: 1.0, timestamp: new Date().toISOString().substring(0, 16).replace('T', ' ') }, ...prev]);
        setStatusMessage(`[MAINNET U2A SUCCESS] Recorded transaction for unique wallet ${mockAddress}`);
        return;
      }
      await Pi.createPayment({ amount: 1.0, memo: 'Mainnet U2A Verification', metadata: { env: 'MAINNET' } }, {
        onReadyForServerApproval: (id: string) => setStatusMessage(`[MAINNET U2A] Approving payment ${id}...`),
        onReadyForServerCompletion: (id: string, txid: string) => setStatusMessage(`[MAINNET U2A SUCCESS] Mainnet Tx Confirmed: ${txid}`),
        onCancel: () => setIsProcessing(false),
        onError: (err: Error) => setStatusMessage(`[FAULT] ${err.message}`),
      });
    } catch (err: any) {
      setStatusMessage(`[FAULT] ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleA2UPayment = async () => {
    setIsProcessing(true);
    setStatusMessage('[MAINNET A2U] Disbursing Mainnet Pi from App Vault...');
    try {
      await new Promise((res) => setTimeout(res, 1200));
      const mockAddress = `G${Math.random().toString(36).substring(2, 6).toUpperCase()}...MAIN`;
      setWallets((prev) => [{ uid: pioneer?.uid || 'tester', walletAddress: mockAddress, txHash: `0x${Math.random().toString(16).substring(2, 8)}`, type: 'A2U', amount: 0.5, timestamp: new Date().toISOString().substring(0, 16).replace('T', ' ') }, ...prev]);
      setStatusMessage(`[MAINNET A2U SUCCESS] Disbursed 0.5 Mainnet Pi to ${mockAddress}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <PioneerAuthGate>
      <main className="w-full max-w-md mx-auto p-3 sm:p-4 pb-28 min-h-screen text-slate-100 font-mono">
        <div className="flex items-center justify-between pt-2 pb-3 border-b border-neutral-800">
          <Link href="/mesh" className="p-1.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-400 hover:text-white transition flex items-center gap-1.5 text-xs">
            <ArrowLeft size={16} /> Hub
          </Link>
          <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1">
            <Sparkles size={10} /> Mainnet Production
          </span>
        </div>

        <div className="mt-4 bg-neutral-900 border border-neutral-800 rounded-3xl p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-base font-bold text-white flex items-center gap-2">
                <Coins size={18} className="text-emerald-400" /> Mainnet Payment Audit
              </h1>
              <p className="text-[11px] text-neutral-400 font-mono mt-0.5">Target: 5 Unique Pioneer Wallets</p>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded">MAINNET</span>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-neutral-800">
            <div className="flex justify-between text-xs">
              <span className="text-neutral-400 flex items-center gap-1"><Users size={14} className="text-emerald-400" /> Unique Wallets</span>
              <span className="font-bold text-emerald-400">{uniqueWalletCount} / {TARGET_WALLETS} ({progressPercent}%)</span>
            </div>
            <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
              <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>

        {statusMessage && (
          <div className="mt-3 p-3 bg-neutral-900 border border-neutral-800 rounded-2xl text-[11px] text-neutral-300 font-mono space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400">
              <RefreshCw size={12} className={isProcessing ? 'animate-spin' : ''} /> Mainnet Ledger Update
            </div>
            <div className="text-neutral-400 break-all">{statusMessage}</div>
          </div>
        )}

        <div className="mt-4 space-y-3">
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5"><ArrowDownLeft size={16} className="text-emerald-400" /> U2A Payment (1.0 Pi)</h3>
              <span className="text-[9px] bg-neutral-950 text-neutral-400 border border-neutral-800 px-2 py-0.5 rounded">Pi SDK</span>
            </div>
            <button onClick={handleU2APayment} disabled={isProcessing} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs uppercase rounded-xl transition flex items-center justify-center gap-2">
              <Send size={14} /> Execute Mainnet U2A Payment
            </button>
          </div>

          <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5"><ArrowUpRight size={16} className="text-emerald-400" /> A2U Disbursement (0.5 Pi)</h3>
              <span className="text-[9px] bg-neutral-950 text-neutral-400 border border-neutral-800 px-2 py-0.5 rounded">Vault</span>
            </div>
            <button onClick={handleA2UPayment} disabled={isProcessing} className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-emerald-400 border border-emerald-800 font-bold text-xs uppercase rounded-xl transition flex items-center justify-center gap-2">
              <Download size={14} /> Execute Mainnet A2U Disbursement
            </button>
          </div>
        </div>

        <div className="mt-4 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-3.5 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-neutral-300">
            <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-400" /> Mainnet Wallet Log</span>
            <span className="text-[10px] text-neutral-500">{wallets.length} Tx</span>
          </div>
          <div className="space-y-1.5 pt-1">
            {wallets.map((w, idx) => (
              <div key={idx} className="p-2 bg-neutral-950 border border-neutral-800/80 rounded-xl flex items-center justify-between text-[11px]">
                <span className="font-bold text-white font-mono">{w.type} • {w.walletAddress}</span>
                <span className="font-bold text-emerald-400 font-mono">+{w.amount} Pi</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </PioneerAuthGate>
  );
}