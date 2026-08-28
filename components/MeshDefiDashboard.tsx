// Location: components/MeshDefiDashboard.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useMeshVaults, VaultRecord } from '@/hooks/useMeshVaults';
import { useMeshUnbounding, UnbondingRequest } from '@/hooks/useMeshUnbounding';
import { useMeshToken } from '@/hooks/useMeshToken';

interface DashboardProps {
  userAddress?: string;
}

const DEFAULT_ADMIN = 'GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3';

export default function MeshDeFiDashboard({ userAddress = DEFAULT_ADMIN }: DashboardProps) {
  // Contract Hooks
  const { getTotalLocked, getVault, deposit, isLoading: vaultLoading } = useMeshVaults();
  const { getUserQueue, getMaturedAmount, getTotalUnbonding, claimMatured, isLoading: unbondingLoading } = useMeshUnbounding();
  const { getBalance, getTotalSupply, piToMbzrDisplay, mbzrSubunitsToPi, piToMbzrSubunits, isLoading: tokenLoading } = useMeshToken();

  // Local State
  const [balanceSubunits, setBalanceSubunits] = useState<bigint>(BigInt(0));
  const [totalSupplySubunits, setTotalSupplySubunits] = useState<bigint>(BigInt(0));
  const [totalLockedSubunits, setTotalLockedSubunits] = useState<bigint>(BigInt(0));
  const [totalUnbondingSubunits, setTotalUnbondingSubunits] = useState<bigint>(BigInt(0));
  const [userVault, setUserVault] = useState<VaultRecord | null>(null);
  const [unbondingQueue, setUnbondingQueue] = useState<UnbondingRequest[]>([]);
  const [maturedSubunits, setMaturedSubunits] = useState<bigint>(BigInt(0));
  const [stakeInputPi, setStakeInputPi] = useState<string>('1.0');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Unified Data Refresher
  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    setActionFeedback(null);
    try {
      const [bal, supply, locked, userV, queue, matured, totalUnb] = await Promise.all([
        getBalance(userAddress),
        getTotalSupply(),
        getTotalLocked(),
        getVault(userAddress),
        getUserQueue(userAddress),
        getMaturedAmount(userAddress),
        getTotalUnbonding(),
      ]);

      setBalanceSubunits(bal);
      setTotalSupplySubunits(supply);
      if (locked !== null) setTotalLockedSubunits(locked);
      setUserVault(userV);
      setUnbondingQueue(queue);
      setMaturedSubunits(matured);
      setTotalUnbondingSubunits(totalUnb);
    } catch (err) {
      console.error('Failed to sync MESH on-chain state:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [
    userAddress,
    getBalance,
    getTotalSupply,
    getTotalLocked,
    getVault,
    getUserQueue,
    getMaturedAmount,
    getTotalUnbonding,
  ]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Format Helper: Subunits -> Formatted mBZR
  const formatSubunitsToMbzr = (subunits: bigint): string => {
    const raw = Number(subunits) / 10_000_000;
    return raw.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleStake = async () => {
    try {
      const amountBigInt = piToMbzrSubunits(stakeInputPi);
      if (amountBigInt <= BigInt(0)) {
        setActionFeedback('Invalid deposit amount.');
        return;
      }
      setActionFeedback('Broadcasting stake transaction to Soroban...');
      const res = await deposit(userAddress, amountBigInt);
      if (res.success) {
        setActionFeedback('Stake transaction confirmed on ledger.');
        await refreshAll();
      } else {
        setActionFeedback(res.error || 'Stake transaction failed.');
      }
    } catch (err: any) {
      setActionFeedback(err.message || 'Signature rejected by wallet.');
    }
  };

  const handleClaim = async () => {
    try {
      setActionFeedback('Claiming matured unbonded tokens...');
      const res = await claimMatured(userAddress);
      if (res.success) {
        setActionFeedback('Claim settled successfully.');
        await refreshAll();
      } else {
        setActionFeedback(res.error || 'Claim failed.');
      }
    } catch (err: any) {
      setActionFeedback(err.message || 'Claim execution aborted.');
    }
  };

  const isAnyLoading = vaultLoading || unbondingLoading || tokenLoading || isRefreshing;

  return (
    <div className="w-full max-w-[384px] mx-auto min-h-dvh bg-slate-950 text-slate-100 p-4 flex flex-col gap-4 font-sans antialiased border border-slate-800 rounded-2xl shadow-2xl">
      {/* Header / Network Status */}
      <header className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-sm font-bold tracking-wider uppercase text-slate-200">Bazaar Republic</h1>
          </div>
          <p className="text-[10px] text-slate-400 font-mono">Pi Testnet2 • Soroban Triad</p>
        </div>
        <button
          onClick={refreshAll}
          disabled={isAnyLoading}
          className="px-2.5 py-1 text-xs font-mono bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all rounded text-slate-300 border border-slate-700 disabled:opacity-50"
        >
          {isAnyLoading ? 'SYNCING...' : 'SYNC'}
        </button>
      </header>

      {/* Transaction Feedback */}
      {actionFeedback && (
        <div className="p-2 bg-amber-950/40 border border-amber-800/50 rounded text-[11px] text-amber-300 font-mono">
          {actionFeedback}
        </div>
      )}

      {/* Hero: Balance & Peg Module */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
        <div className="flex justify-between items-baseline">
          <span className="text-[11px] text-slate-400 font-medium">Available Balance</span>
          <span className="text-[10px] text-amber-400 font-mono">1 Π = 1,000 mBZR</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black tracking-tight text-white">
            {formatSubunitsToMbzr(balanceSubunits)}
          </span>
          <span className="text-xs font-bold text-amber-500 font-mono">mBZR</span>
        </div>
        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
          <span>≈ {mbzrSubunitsToPi(balanceSubunits)}</span>
          <span className="text-slate-300">Π</span>
        </div>
      </section>

      {/* Protocol Metrics Grid */}
      <section className="grid grid-cols-2 gap-2">
        <div className="bg-slate-900/40 border border-slate-800/80 p-2.5 rounded-lg flex flex-col">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Locked</span>
          <span className="text-sm font-bold font-mono text-emerald-400 mt-1">
            {formatSubunitsToMbzr(totalLockedSubunits)}
          </span>
          <span className="text-[9px] text-slate-400 font-mono">mBZR Vaults</span>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/80 p-2.5 rounded-lg flex flex-col">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">In Unbonding</span>
          <span className="text-sm font-bold font-mono text-cyan-400 mt-1">
            {formatSubunitsToMbzr(totalUnbondingSubunits)}
          </span>
          <span className="text-[9px] text-slate-400 font-mono">Cooldown Pool</span>
        </div>
      </section>

      {/* Staking & Deposit Action Card */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-col gap-2.5">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Mesh Vault Staking</h2>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50 font-mono">
            Active
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-slate-400">Deposit Amount (Pi)</label>
          <div className="relative flex items-center">
            <input
              type="number"
              step="0.1"
              min="0"
              value={stakeInputPi}
              onChange={(e) => setStakeInputPi(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-amber-500 transition-colors"
              placeholder="0.0"
            />
            <span className="absolute right-3 text-xs font-mono text-slate-400 pointer-events-none">Π</span>
          </div>
          <div className="text-[10px] text-slate-400 flex justify-between px-1">
            <span>Yield Equivalent:</span>
            <span className="font-mono text-amber-400">{piToMbzrDisplay(stakeInputPi || 0)}</span>
          </div>
        </div>

        <button
          onClick={handleStake}
          disabled={isAnyLoading}
          className="w-full py-2 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-lg uppercase tracking-wider shadow transition-all active:scale-[0.98]"
        >
          {isAnyLoading ? 'PROCESSING...' : 'Stake & Lock'}
        </button>
      </section>

      {/* Active Vault State */}
      {userVault && userVault.principal > BigInt(0) && (
        <section className="bg-slate-900/30 border border-slate-800 rounded-xl p-3 flex flex-col gap-1.5 text-xs">
          <div className="flex justify-between items-center border-b border-slate-800/60 pb-1.5">
            <span className="text-[11px] text-slate-400">User Vault Locked</span>
            <span className="font-mono text-emerald-400 font-bold">{formatSubunitsToMbzr(userVault.principal)} mBZR</span>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Unlock Status:</span>
            <span>{userVault.claimed ? 'Claimed' : 'Locked'}</span>
          </div>
        </section>
      )}

      {/* Unbonding & Cooldown Queue Card */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-col gap-2.5">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Unbonding Queue</h2>
          <span className="text-[10px] font-mono text-cyan-400">{unbondingQueue.length} Active</span>
        </div>

        {unbondingQueue.length === 0 ? (
          <div className="p-3 text-center bg-slate-950/40 rounded-lg border border-dashed border-slate-800">
            <p className="text-[11px] text-slate-400">No tokens currently in cooldown.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
            {unbondingQueue.map((req) => (
              <div
                key={req.id.toString()}
                className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800/80 text-[11px]"
              >
                <div className="flex flex-col">
                  <span className="font-mono text-slate-200">{formatSubunitsToMbzr(req.amount)} mBZR</span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    Req #{req.id.toString()} • {req.claimed ? 'Claimed' : 'Cooling Down'}
                  </span>
                </div>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                    req.claimed
                      ? 'bg-slate-800 text-slate-400'
                      : 'bg-cyan-950 text-cyan-400 border border-cyan-800/50'
                  }`}
                >
                  {req.claimed ? 'SETTLED' : 'LOCKED'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Claim Matured Action */}
        <div className="pt-1 flex items-center justify-between border-t border-slate-800">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400">Ready to Claim:</span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {formatSubunitsToMbzr(maturedSubunits)} mBZR
            </span>
          </div>
          <button
            disabled={maturedSubunits <= BigInt(0) || isAnyLoading}
            onClick={handleClaim}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-400 text-slate-950 text-xs font-bold rounded-lg uppercase tracking-wider transition-all disabled:border disabled:border-slate-700"
          >
            Claim
          </button>
        </div>
      </section>

      {/* Footer System Status */}
      <footer className="mt-auto pt-2 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-400 font-mono">
        <span>Node: S23 Ultra (384x854)</span>
        <span>Total Supply: {formatSubunitsToMbzr(totalSupplySubunits)}</span>
      </footer>
    </div>
  );
}