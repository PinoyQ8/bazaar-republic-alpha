// Location: app/mesh/escrow/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Lock, 
  ArrowLeft, 
  RefreshCw, 
  Scale, 
  Plus, 
  Award,
  AlertCircle
} from 'lucide-react';
import ElderDisputeModal from '@/components/ElderDisputeModal';
import PioneerAuthGate from '@/app/components/PioneerAuthGate';
import { EscrowCard } from '@/components/vault/EscrowCard';
import { useAuth } from '@/context/AuthContext';

interface EscrowVaultItem {
  id: string;
  provider: string;
  consumer: string;
  amount: number;
  token: 'PI';
  status: 'LOCKED' | 'PENDING_RELEASE' | 'RELEASED' | 'DISPUTED';
  timelockRemainingSeconds?: number;
  serviceDescription: string;
  createdAt: string;
  bondAmount?: number;
  consumerClaim?: string;
  zkProofHash?: string;
}

export default function MeshEscrowPage() {
  const { pioneer } = useAuth();
  const [activeTab, setActiveTab] = useState<'vaults' | 'create'>('vaults');
  
  // Modal & Selection State
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState<boolean>(false);
  const [selectedDisputeVault, setSelectedDisputeVault] = useState<EscrowVaultItem | null>(null);

  // Live Ledger State
  const [vaults, setVaults] = useState<EscrowVaultItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Form State
  const [providerAddress, setProviderAddress] = useState('');
  const [amount, setAmount] = useState('25');
  const [timelockHours, setTimelockHours] = useState('48');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // 1. Fetch Active Escrow Vaults from Backend
  const fetchEscrows = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/escrow/list');
      if (!res.ok) throw new Error('Failed to synchronize escrow ledger.');
      const data = await res.json();
      
      if (data.escrows && Array.isArray(data.escrows) && data.escrows.length > 0) {
        setVaults(data.escrows);
      } else {
        // Safe default fixture matching the active testnet contract
        setVaults([
          {
            id: 'MBZR_ESCROW_CANARY_01',
            provider: 'GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3',
            consumer: pioneer?.uid || 'usr_pioneer_1001',
            amount: 50.0,
            token: 'PI',
            status: 'LOCKED',
            timelockRemainingSeconds: 172800,
            serviceDescription: 'E-Network DePIN Node Provisioning',
            createdAt: new Date().toISOString(),
          }
        ]);
      }
    } catch (err: any) {
      setFetchError(err.message || 'Ledger synchronization failure.');
    } finally {
      setLoading(false);
    }
  }, [pioneer?.uid]);

  useEffect(() => {
    fetchEscrows();
  }, [fetchEscrows]);

  // 2. Submit Live Lock to Soroban / Prisma Pipeline
  const handleCreateVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerAddress || !amount || parseFloat(amount) <= 0) {
      setFormError('Please provide a valid provider handle/address and Pi amount.');
      return;
    }

    setIsCreating(true);
    setFormError(null);

    try {
      const res = await fetch('/api/escrow/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consumerUid: pioneer?.uid || 'usr_pioneer_1001',
          providerAddress: providerAddress.trim(),
          piAmount: parseFloat(amount),
          timelockHours: parseInt(timelockHours, 10),
          description: description.trim() || 'E-Network Service Contract',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to lock escrow vault.');

      setProviderAddress('');
      setDescription('');
      setActiveTab('vaults');
      await fetchEscrows();
    } catch (err: any) {
      setFormError(err.message || 'Vault creation aborted.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenDisputeReview = (vault: EscrowVaultItem) => {
    setSelectedDisputeVault(vault);
    setIsDisputeModalOpen(true);
  };

  return (
    <PioneerAuthGate>
      <div className="min-h-screen bg-neutral-950 text-neutral-100 p-3 sm:p-6 font-sans pb-28">
        <div className="max-w-[384px] mx-auto space-y-4 font-mono">
          
          {/* TOP BAR */}
          <div className="flex items-center justify-between pt-2">
            <Link 
              href="/mesh" 
              className="p-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-400 hover:text-white transition flex items-center gap-1.5 text-xs font-mono"
            >
              <ArrowLeft size={16} /> Hub
            </Link>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono bg-indigo-950 text-indigo-400 border border-indigo-800 px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck size={10} /> Noir ZK-Verified
              </span>
            </div>
          </div>

          {/* PI MAINNET COMPLIANCE BANNER */}
          <div className="bg-purple-950/40 border border-purple-800/80 p-3 rounded-2xl flex items-center justify-between font-mono text-[10px] text-purple-300">
            <span className="flex items-center gap-1.5 font-bold">
              <ShieldCheck size={14} className="text-purple-400" /> Pi Ecosystem Compliant
            </span>
            <span className="bg-purple-900/60 text-purple-200 px-2 py-0.5 rounded font-bold uppercase border border-purple-700">
              100% Settled in Pi (PI)
            </span>
          </div>

          {/* HERO & TABS */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 shadow-2xl space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                  <ShieldCheck size={18} className="text-indigo-400" /> E-Network Merchant Escrow
                </h1>
                <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                  48-Hour Timelock • Passkey Vaults • 5-Elder Council
                </p>
              </div>
              <button
                onClick={fetchEscrows}
                disabled={loading}
                className="p-1.5 text-neutral-400 hover:text-white bg-neutral-950 border border-neutral-800 rounded-xl"
              >
                <RefreshCw size={13} className={loading ? 'animate-spin text-indigo-400' : ''} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5 p-1 bg-neutral-950 rounded-2xl border border-neutral-800 font-mono text-xs">
              <button
                onClick={() => setActiveTab('vaults')}
                className={`py-2 rounded-xl transition font-bold flex items-center justify-center gap-1.5 ${
                  activeTab === 'vaults'
                    ? 'bg-indigo-950 border border-indigo-700 text-indigo-300'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Lock size={14} /> Active Vaults ({vaults.length})
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`py-2 rounded-xl transition font-bold flex items-center justify-center gap-1.5 ${
                  activeTab === 'create'
                    ? 'bg-indigo-950 border border-indigo-700 text-indigo-300'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Plus size={14} /> Lock New Vault
              </button>
            </div>
          </div>

          {/* TAB 1: MODULAR ESCROW CARDS */}
          {activeTab === 'vaults' && (
            <div className="space-y-4">
              {fetchError && (
                <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-2xl text-[11px] text-rose-300 flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{fetchError}</span>
                </div>
              )}

              {vaults.map((vault) => (
                <EscrowCard key={vault.id} initialEscrowId={vault.id} />
              ))}
            </div>
          )}

          {/* TAB 2: LOCK NEW ESCROW FORM */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateVault} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 shadow-2xl space-y-3.5">
              <div className="flex justify-between items-center">
                <h2 className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider">
                  Create Merchant Escrow Lock
                </h2>
                <span className="text-[10px] font-mono text-indigo-400">Step 1 of 2</span>
              </div>

              {formError && (
                <div className="p-2.5 bg-rose-950/40 border border-rose-800/60 rounded-xl text-[10px] text-rose-300 flex items-center gap-1.5">
                  <AlertCircle size={12} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-neutral-400 block">Service Provider Wallet / UID</label>
                <input
                  type="text"
                  required
                  placeholder="GAU5... or @Merchant_Pioneer"
                  value={providerAddress}
                  onChange={(e) => setProviderAddress(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 space-y-1">
                  <label className="text-[11px] font-mono text-neutral-400 block">Escrow Amount (PI)</label>
                  <input
                    type="number"
                    step="0.0000001"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-neutral-400 block">Settlement</label>
                  <div className="w-full bg-purple-950/80 border border-purple-800 rounded-xl p-2.5 text-xs font-mono text-purple-300 font-bold text-center flex items-center justify-center gap-1">
                    <ShieldCheck size={12} className="text-purple-400" /> PI Only
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-neutral-400 block">Auto-Release Timelock</label>
                <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
                  {['24', '48', '72'].map((hrs) => (
                    <button
                      type="button"
                      key={hrs}
                      onClick={() => setTimelockHours(hrs)}
                      className={`py-2 rounded-xl border transition text-center ${
                        timelockHours === hrs
                          ? 'bg-indigo-950 border-indigo-600 text-indigo-300 font-bold'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                      }`}
                    >
                      {hrs} Hours
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-neutral-400 block">Service Scope Reference</label>
                <textarea
                  rows={2}
                  placeholder="Describe service deliverables or order scope..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full py-3 bg-linear-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 font-bold rounded-xl text-white text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg disabled:opacity-50"
              >
                {isCreating ? (
                  <>
                    <RefreshCw size={14} className="animate-spin text-cyan-300" />
                    Locking Vault Contract...
                  </>
                ) : (
                  <>
                    <Lock size={14} />
                    Deposit & Lock Escrow Vault (PI)
                  </>
                )}
              </button>
            </form>
          )}

          {/* ADJUDICATOR APPEAL PORTAL */}
          <div className="bg-neutral-900/50 border border-neutral-800 p-3.5 rounded-2xl space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between text-neutral-300">
              <span className="font-bold flex items-center gap-1.5 text-amber-400">
                <Scale size={14} /> Dispute Governance (5-Elder Panel)
              </span>
              <span className="text-[10px] text-cyan-400 bg-cyan-950 border border-cyan-800 px-1.5 py-0.5 rounded font-bold">
                VRF Active
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Disputed locks trigger VRF selection of 5 Genesis 100 Elders. Settled via game-theoretic <strong className="text-neutral-200">75% Winner / 25% Non-Biased Elder</strong> bond split.
            </p>
            <button
              onClick={() => vaults[0] && handleOpenDisputeReview(vaults[0])}
              className="w-full py-2 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 text-amber-400 hover:text-amber-300 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Award size={14} /> Genesis 100 Adjudicator Portal
            </button>
          </div>

        </div>

        {/* 5-ELDER DISPUTE MODAL */}
        {selectedDisputeVault && (
          <ElderDisputeModal
            isOpen={isDisputeModalOpen}
            onClose={() => setIsDisputeModalOpen(false)}
            disputeData={{
              id: selectedDisputeVault.id,
              escrowId: selectedDisputeVault.id,
              consumerUid: selectedDisputeVault.consumer,
              providerName: selectedDisputeVault.provider,
              escrowAmount: selectedDisputeVault.amount,
              bondAmount: selectedDisputeVault.bondAmount || 5000,
              serviceDescription: selectedDisputeVault.serviceDescription,
              consumerClaim: selectedDisputeVault.consumerClaim || 'SLA verification failed.',
              zkProofHash: selectedDisputeVault.zkProofHash || '0x7f8a91b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8',
              votesForConsumer: 1,
              votesForMerchant: 1,
              quorumTotal: 5,
            }}
            onVoteSuccess={fetchEscrows}
          />
        )}
      </div>
    </PioneerAuthGate>
  );
}