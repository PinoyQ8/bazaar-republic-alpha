// Location: app/academy/module-01/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import PioneerAuthGate from '@/app/components/PioneerAuthGate';
import PiPaymentForge from '@/app/components/PiPaymentForge';
import { 
  Shield, 
  ArrowLeft, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  Coins, 
  Terminal, 
  Award,
  Sparkles
} from 'lucide-react';

export default function Module01Page() {
  const { pioneer, login } = useAuth();
  const router = useRouter();
  const [isStaked, setIsStaked] = useState(false);
  const [stakeTxid, setStakeTxid] = useState<string | null>(null);

  const handleStakeSuccess = (txid: string) => {
    setStakeTxid(txid);
    setIsStaked(true);

    // Update Pioneer session state to reflect NOVICE node tier upgrade
    login({
      uid: pioneer.uid,
      username: pioneer.username,
      status: 'ACTIVE',
      tier: 'NOVICE',
    });
  };

  return (
    <PioneerAuthGate>
      <main className="w-full max-w-[384px] mx-auto min-h-screen bg-slate-950 text-slate-100 p-4 font-mono flex flex-col justify-between py-6">
        
        {/* TOP BAR */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <Link
              href="/academy"
              className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Academy Hub
            </Link>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 font-bold">
              PHASE 01 • MESH-101
            </span>
          </div>

          {/* MODULE HEADER */}
          <div className="border border-slate-800 bg-slate-900/60 p-4 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
              <Shield className="w-4 h-4 text-emerald-400" /> Genesis Identity & Passkeys
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Anchor your mobile node identity to the MESH Ledger and lock your initial testnet stake to activate decentralized relay permissions.
            </p>
          </div>

          {/* TELEMETRY READOUT */}
          <div className="p-3 bg-slate-900/40 border border-slate-800/80 rounded-xl space-y-1.5 text-[10px]">
            <div className="flex justify-between items-center text-slate-400">
              <span>NODE TELEMETRY:</span>
              <span className="text-emerald-400 font-bold">ONLINE</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Pioneer Node:</span>
              <span className="text-amber-400 font-bold">@{pioneer?.username || 'Pioneer'}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Assigned Tier:</span>
              <span className="text-cyan-400 font-bold">[{pioneer?.tier || 'CITIZEN'}]</span>
            </div>
          </div>

          {/* STAKE INTERACTION BLOCK */}
          <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-bold uppercase text-amber-400 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5" /> Node Activation Stake
              </span>
              {isStaked ? (
                <span className="text-[9px] px-1.5 py-0.5 bg-emerald-950 border border-emerald-500/40 text-emerald-400 rounded font-bold flex items-center gap-1">
                  <Unlock className="w-3 h-3" /> VERIFIED
                </span>
              ) : (
                <span className="text-[9px] px-1.5 py-0.5 bg-rose-950/60 border border-rose-800/40 text-rose-400 rounded font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> REQUIRED
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Lock 1 Test-Pi collateral via native Pi SDK to complete Genesis Ledger attestation.
            </p>

            {!isStaked ? (
              <PiPaymentForge
                amount={1}
                memo="MESH Genesis Node Stake - Module 01"
                metadata={{ module: 'MESH-101', tier: 'NOVICE' }}
                onSuccess={handleStakeSuccess}
              />
            ) : (
              <div className="p-3 bg-emerald-950/30 border border-emerald-800/60 rounded-lg space-y-1 text-[10px]">
                <p className="text-emerald-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Cryptographic Collateral Anchored
                </p>
                <p className="text-slate-400 break-all font-mono">
                  TXID: {stakeTxid}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM ACTION */}
        <div className="pt-4 border-t border-slate-800/80">
          <button
            onClick={() => router.push('/academy')}
            disabled={!isStaked}
            className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-900 disabled:text-slate-600 disabled:border disabled:border-slate-800 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-lg"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isStaked ? 'Complete Module & Return' : 'Awaiting Stake Verification'}</span>
          </button>
        </div>

      </main>
    </PioneerAuthGate>
  );
}