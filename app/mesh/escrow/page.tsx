'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  ArrowLeft,
  RefreshCw,
  Scale,
  Plus,
  Award,
  AlertCircle,
  Search,
} from 'lucide-react';
import ElderDisputeModal from '@/components/ElderDisputeModal';
import PioneerAuthGate from '@/app/components/PioneerAuthGate';
import { EscrowCard } from '@/components/vault/EscrowCard';
import LivePiCheckout from '@/components/vault/LivePiCheckout';
import { useAuth } from '@/context/AuthContext';
import {
  canAccessSubSection,
  canPerformGovernanceAction,
  GOVERNANCE_TIER_META,
  normalizeTierLevel,
} from '@/app/lib/governance/tierRbac';

export interface EscrowVaultItem {
  id: string;
  escrowId?: string;
  provider: string;
  consumer: string;
  amount: number;
  amountPi?: number;
  token: 'PI';
  status: 'LOCKED' | 'PENDING_RELEASE' | 'RELEASED' | 'DISPUTED' | 'REFUNDED';
  timelockRemainingSeconds?: number;
  serviceDescription: string;
  createdAt: string;
  bondAmount?: number;
  consumerClaim?: string;
  zkProofHash?: string;
}

type StatusFilter = 'ALL' | 'LOCKED' | 'DISPUTED' | 'RELEASED' | 'REFUNDED';

export default function MeshEscrowPage() {
  const { pioneer, hasActiveRole, isFounder } = useAuth();
  const [activeTab, setActiveTab] = useState<'vaults' | 'create'>('vaults');

  // Filter State
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('LOCKED');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal & Selection State
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState<boolean>(false);
  const [selectedDisputeVault, setSelectedDisputeVault] =
    useState<EscrowVaultItem | null>(null);

  // Live Ledger State
  const [vaults, setVaults] = useState<EscrowVaultItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Form State
  const [providerAddress, setProviderAddress] = useState('');
  const [amount, setAmount] = useState('1.0');
  const [timelockHours, setTimelockHours] = useState('48');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // RBAC Evaluation
  const effectiveTier = normalizeTierLevel(pioneer?.tier ?? 1);
  const tierMeta = GOVERNANCE_TIER_META[effectiveTier];
  const isFrozen = pioneer?.status === 'FROZEN';
  const hasPassport = Boolean(pioneer?.isAuthenticated);

  const rbacSubject = useMemo(
    () => ({
      tier: effectiveTier,
      hasRole: hasActiveRole,
      hasPassport,
      isFrozen,
      isFounder,
      role: pioneer?.role,
    }),
    [effectiveTier, hasActiveRole, hasPassport, isFrozen, isFounder, pioneer?.role]
  );

  const viewAccess = useMemo(
    () => canAccessSubSection('ESCROW_VIEW', rbacSubject),
    [rbacSubject]
  );

  const executeAccess = useMemo(
    () => canAccessSubSection('ESCROW_EXECUTE', rbacSubject),
    [rbacSubject]
  );

  const elderAdjudicatePerm = useMemo(
    () =>
      canPerformGovernanceAction(effectiveTier, 'ADJUDICATE_ELDER_DISPUTE', {
        isFrozen,
        hasPassport,
        hasRole: hasActiveRole,
      }),
    [effectiveTier, isFrozen, hasPassport, hasActiveRole]
  );

  // 1. Fetch Active Escrow Vaults from Backend
  const fetchEscrows = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/escrow/list', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to synchronize escrow ledger.');
      const data = await res.json();

      if (data.escrows && Array.isArray(data.escrows) && data.escrows.length > 0) {
        setVaults(data.escrows);
      } else {
        setVaults([
          {
            id: 'MBZR_ESCROW_CANARY_01',
            escrowId: 'MBZR_ESCROW_CANARY_01',
            provider: 'GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3',
            consumer: pioneer?.uid || 'pioneer_session',
            amount: 50.0,
            token: 'PI',
            status: 'LOCKED',
            timelockRemainingSeconds: 172800,
            serviceDescription: 'E-Network DePIN Node Provisioning',
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch (err: any) {
      setFetchError(err?.message || 'Ledger synchronization failure.');
    } finally {
      setLoading(false);
    }
  }, [pioneer?.uid]);

  useEffect(() => {
    fetchEscrows();
  }, [fetchEscrows]);

  // 2. Submit Live Lock to Soroban / Prisma Pipeline (Gated by ESCROW_EXECUTE)
  const handleCreateVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!executeAccess.allowed) {
      setFormError(
        executeAccess.reason ||
          `Escrow lock creation requires ${executeAccess.requiredTierLabel}.`
      );
      return;
    }

    const numericAmount = parseFloat(amount);
    if (!providerAddress.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      setFormError('Please provide a valid provider handle/address and PI amount.');
      return;
    }

    setIsCreating(true);
    setFormError(null);

    try {
      const res = await fetch('/api/escrow/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consumerUid: pioneer?.uid || 'pioneer_session',
          providerAddress: providerAddress.trim(),
          piAmount: numericAmount,
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
      setFormError(err?.message || 'Vault creation aborted.');
    } finally {
      setIsCreating(false);
    }
  };

  const filteredVaults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return vaults.filter((vault) => {
      const normalizedStatus = String(vault.status || '').toUpperCase();
      if (statusFilter !== 'ALL' && normalizedStatus !== statusFilter) {
        return false;
      }
      if (q) {
        const matchText = [
          vault.id,
          vault.escrowId,
          vault.consumer,
          vault.provider,
          vault.serviceDescription,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!matchText.includes(q)) return false;
      }
      return true;
    });
  }, [vaults, statusFilter, searchQuery]);

  const handleOpenDisputeReview = (vault: EscrowVaultItem) => {
    setSelectedDisputeVault(vault);
    setIsDisputeModalOpen(true);
  };

  const handleLaunchAdjudicationPortal = () => {
    if (!elderAdjudicatePerm.allowed) return;
    const target =
      filteredVaults.find((v) => v.status === 'DISPUTED') ||
      vaults.find((v) => v.status === 'DISPUTED') ||
      filteredVaults[0] ||
      vaults[0];
    if (target) {
      handleOpenDisputeReview(target);
    }
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
            <div className="flex items-center space-x-1.5">
              <span
                className={`text-[9px] font-mono border px-2 py-0.5 rounded font-bold uppercase ${tierMeta.badgeClass}`}
              >
                {tierMeta.shortLabel}
              </span>
              <span className="text-[10px] font-mono bg-indigo-950 text-indigo-400 border border-indigo-800 px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck size={10} /> Noir ZK
              </span>
            </div>
          </div>

          {/* PI COMPLIANCE BANNER */}
          <div className="bg-purple-950/40 border border-purple-800/80 p-3 rounded-2xl flex items-center justify-between font-mono text-[10px] text-purple-300">
            <span className="flex items-center gap-1.5 font-bold">
              <ShieldCheck size={14} className="text-purple-400" /> Pi Ecosystem Compliant
            </span>
            <span className="bg-purple-900/60 text-purple-200 px-2 py-0.5 rounded font-bold uppercase border border-purple-700">
              100% Settled in Pi (PI)
            </span>
          </div>

          {/* EXECUTION / VIEW CLEARANCE NOTICE */}
          {!executeAccess.allowed && (
            <div className="bg-amber-950/30 border border-amber-800/70 p-3 rounded-2xl font-mono text-[10px] text-amber-200 space-y-1">
              <div className="flex items-center justify-between font-bold text-amber-300">
                <span className="flex items-center gap-1.5">
                  <Lock size={12} className="text-amber-400" />
                  Escrow Ledger: {viewAccess.allowed ? 'View-Only Mode' : 'Restricted'}
                </span>
                <span className="bg-amber-950/80 border border-amber-700/70 px-1.5 py-0.5 rounded text-[9px]">
                  {executeAccess.requiredTierLabel}
                </span>
              </div>
              <p className="text-neutral-300 leading-relaxed">
                {executeAccess.reason ||
                  'Vault inspection is open; creating or executing escrow locks requires an active role/passport and Tier 2+.'}
              </p>
            </div>
          )}

          {/* NATIVE PI SDK GATEWAY COMPONENT */}
          <LivePiCheckout
            amount={1.0}
            memo="Bazaar Republic Escrow Settlement Test"
            onSuccess={() => fetchEscrows()}
          />

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
                type="button"
                onClick={fetchEscrows}
                disabled={loading}
                className="p-1.5 text-neutral-400 hover:text-white bg-neutral-950 border border-neutral-800 rounded-xl cursor-pointer"
              >
                <RefreshCw
                  size={13}
                  className={loading ? 'animate-spin text-indigo-400' : ''}
                />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5 p-1 bg-neutral-950 rounded-2xl border border-neutral-800 font-mono text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('vaults')}
                className={`py-2 rounded-xl transition font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'vaults'
                    ? 'bg-indigo-950 border border-indigo-700 text-indigo-300'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Lock size={14} /> Active Vaults ({filteredVaults.length} / {vaults.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormError(null);
                  setActiveTab('create');
                }}
                title={
                  executeAccess.allowed
                    ? 'Lock a new escrow vault'
                    : executeAccess.reason
                }
                className={`py-2 rounded-xl transition font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'create'
                    ? 'bg-indigo-950 border border-indigo-700 text-indigo-300'
                    : executeAccess.allowed
                      ? 'text-neutral-400 hover:text-white'
                      : 'text-neutral-500 hover:text-amber-300'
                }`}
              >
                {executeAccess.allowed ? <Plus size={14} /> : <Lock size={13} className="text-amber-400" />}
                Lock New Vault
              </button>
            </div>
          </div>

          {/* TAB 1: MODULAR ESCROW CARDS */}
          {activeTab === 'vaults' && (
            <div className="space-y-3">
              {/* VAULT FILTER BAR */}
              <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-3 space-y-2 text-[10px]">
                <div className="flex flex-wrap gap-1">
                  {(['LOCKED', 'ALL', 'DISPUTED', 'RELEASED', 'REFUNDED'] as const).map(
                    (st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setStatusFilter(st)}
                        className={`px-2 py-1 rounded-lg border transition cursor-pointer ${
                          statusFilter === st
                            ? 'bg-indigo-950 border-indigo-600 text-indigo-300 font-bold'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    )
                  )}
                </div>

                <div className="relative">
                  <Search
                    size={12}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter by ID (e.g. VAULT_CD6_01) or address..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-7 pr-2.5 py-1.5 text-[11px] text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              {fetchError && (
                <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-2xl text-[11px] text-rose-300 flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{fetchError}</span>
                </div>
              )}

              {filteredVaults.length === 0 ? (
                <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-2xl text-[11px] text-neutral-400 text-center space-y-2">
                  <p>
                    No vaults match <strong className="text-neutral-200">{statusFilter}</strong>
                    {searchQuery.trim() ? ` for "${searchQuery.trim()}"` : ''}.
                  </p>
                  {statusFilter !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => setStatusFilter('ALL')}
                      className="px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-indigo-300 hover:border-indigo-700 cursor-pointer"
                    >
                      Show All ({vaults.length})
                    </button>
                  )}
                </div>
              ) : (
                filteredVaults.map((vault, idx) => (
                  <EscrowCard
                    key={`${vault.id || vault.escrowId || 'vault'}-${idx}`}
                    initialEscrowId={vault.escrowId || vault.id}
                  />
                ))
              )}
            </div>
          )}

          {/* TAB 2: LOCK NEW ESCROW FORM */}
          {activeTab === 'create' && (
            <form
              onSubmit={handleCreateVault}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 shadow-2xl space-y-3.5"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider">
                  Create Merchant Escrow Lock
                </h2>
                <span className="text-[10px] font-mono text-indigo-400">
                  {executeAccess.allowed ? 'T2+ Cleared' : executeAccess.requiredTierLabel}
                </span>
              </div>

              {!executeAccess.allowed && (
                <div className="p-2.5 bg-amber-950/30 border border-amber-800/70 rounded-xl text-[10px] text-amber-200 flex items-center gap-1.5">
                  <Lock size={12} className="shrink-0 text-amber-400" />
                  <span>
                    {executeAccess.reason ||
                      `Locking new escrow vaults requires ${executeAccess.requiredTierLabel}.`}
                  </span>
                </div>
              )}

              {formError && (
                <div className="p-2.5 bg-rose-950/40 border border-rose-800/60 rounded-xl text-[10px] text-rose-300 flex items-center gap-1.5">
                  <AlertCircle size={12} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-neutral-400 block">
                  Service Provider Wallet / UID
                </label>
                <input
                  type="text"
                  required
                  disabled={!executeAccess.allowed || isCreating}
                  placeholder="GAU5... or @Merchant_Pioneer"
                  value={providerAddress}
                  onChange={(e) => setProviderAddress(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-600 disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 space-y-1">
                  <label className="text-[11px] font-mono text-neutral-400 block">
                    Escrow Amount (PI)
                  </label>
                  <input
                    type="number"
                    step="0.0000001"
                    required
                    disabled={!executeAccess.allowed || isCreating}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-600 disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-neutral-400 block">
                    Settlement
                  </label>
                  <div className="w-full bg-purple-950/80 border border-purple-800 rounded-xl p-2.5 text-xs font-mono text-purple-300 font-bold text-center flex items-center justify-center gap-1">
                    <ShieldCheck size={12} className="text-purple-400" /> PI Only
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-neutral-400 block">
                  Auto-Release Timelock
                </label>
                <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
                  {['24', '48', '72'].map((hrs) => (
                    <button
                      type="button"
                      key={hrs}
                      disabled={!executeAccess.allowed || isCreating}
                      onClick={() => setTimelockHours(hrs)}
                      className={`py-2 rounded-xl border transition text-center cursor-pointer disabled:opacity-50 ${
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
                <label className="text-[11px] font-mono text-neutral-400 block">
                  Service Scope Reference
                </label>
                <textarea
                  rows={2}
                  disabled={!executeAccess.allowed || isCreating}
                  placeholder="Describe service deliverables or order scope..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-600 disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={!executeAccess.allowed || isCreating}
                title={executeAccess.allowed ? undefined : executeAccess.reason}
                className="w-full py-3 bg-linear-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 font-bold rounded-xl text-white text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isCreating ? (
                  <>
                    <RefreshCw size={14} className="animate-spin text-cyan-300" />
                    Locking Vault Contract...
                  </>
                ) : !executeAccess.allowed ? (
                  <>
                    <Lock size={14} />
                    Requires {executeAccess.requiredTierLabel}
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
                {GOVERNANCE_TIER_META[5].shortLabel}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Disputed locks trigger VRF selection of 5 Genesis 100 Elders. Settled
              via game-theoretic{' '}
              <strong className="text-neutral-200">
                75% Winner / 25% Non-Biased Elder
              </strong>{' '}
              bond split.
            </p>
            <button
              type="button"
              disabled={!elderAdjudicatePerm.allowed}
              onClick={handleLaunchAdjudicationPortal}
              title={
                elderAdjudicatePerm.allowed
                  ? 'Open Genesis 100 Adjudicator Portal'
                  : elderAdjudicatePerm.reason
              }
              className="w-full py-2 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 text-amber-400 hover:text-amber-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              {elderAdjudicatePerm.allowed ? (
                <Award size={14} />
              ) : (
                <Lock size={13} className="text-amber-500" />
              )}
              {elderAdjudicatePerm.allowed
                ? 'Genesis 100 Adjudicator Portal'
                : `Elder Portal Locked (${GOVERNANCE_TIER_META[5].shortLabel})`}
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
              escrowId: selectedDisputeVault.escrowId || selectedDisputeVault.id,
              consumerUid: selectedDisputeVault.consumer,
              providerName: selectedDisputeVault.provider,
              escrowAmount: Number(
                selectedDisputeVault.amount ?? selectedDisputeVault.amountPi ?? 50
              ),
              bondAmount: selectedDisputeVault.bondAmount || 5000,
              serviceDescription: selectedDisputeVault.serviceDescription,
              consumerClaim:
                selectedDisputeVault.consumerClaim || 'SLA verification failed.',
              zkProofHash:
                selectedDisputeVault.zkProofHash ||
                '0x7f8a91b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8',
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