"use client";

import React, { useCallback, useEffect, useState } from "react";

export interface PoolSnapshot {
  poolId: string;
  status: string;
  currentEpochNumber: number;
  vaultContractId?: string;
  pegRatioMbzrPerPi?: number;
  stakerNodeShareBps?: number;
  polTreasuryShareBps?: number;
  totalStakedPiFormatted?: string;
  totalUnbondingPiFormatted?: string;
  remainingGlobalCapPiFormatted?: string;
  activeMbzrIssuedFormatted?: string;
  polReserveMbzrFormatted?: string;
  polReservePiFormatted?: string;
  collateralRatioPct?: string;
}

export interface ActiveEpochSnapshot {
  epochNumber: number;
  status: string;
  activeStakerCount: number;
  totalPoolEffectiveWeight: string;
  grossFeePoolMbzrSubunits: string;
  swapFeesCollectedMbzrSubunits: string;
  marketplaceFeesCollectedMbzrSubunits: string;
  meltTariffsCollectedMbzrSubunits: string;
  slashedPenaltiesMbzrSubunits: string;
  stakerPool70MbzrSubunits: string;
  polTreasury30MbzrSubunits: string;
  dustRemainderMbzrSubunits?: string;
}

export interface StakePositionItem {
  stakeId: string;
  pioneerUid: string;
  stellarAddress: string;
  principalPiFormatted: string;
  equivalentMbzrFormatted: string;
  lockTierDays: number;
  uptimeShieldPct: number;
  effectiveWeightUnits: string;
  accruedMbzrSubunits: string;
  claimedMbzrSubunits: string;
  status: string;
  unlocksAt?: string;
}

interface PoolApiResponse {
  success?: boolean;
  pool?: PoolSnapshot;
  activeEpoch?: ActiveEpochSnapshot;
  stakes?: StakePositionItem[];
}

interface StakingPoolEpochLedgerProps {
  poolId?: string;
  pioneerUid?: string;
  pollIntervalMs?: number;
}

const SUBUNITS_PER_MBZR = 10_000_000n;

function formatSubunitsToMbzr(raw?: string | number | null): string {
  try {
    const val = BigInt(raw ?? "0");
    const negative = val < 0n;
    const abs = negative ? -val : val;
    const whole = abs / SUBUNITS_PER_MBZR;
    const frac = (abs % SUBUNITS_PER_MBZR).toString().padStart(7, "0");
    return `${negative ? "-" : ""}${whole.toString()}.${frac}`;
  } catch {
    return "0.0000000";
  }
}

export default function StakingPoolEpochLedger({
  poolId = "GENESIS_LP_1000_PI",
  pioneerUid,
  pollIntervalMs = 15000,
}: StakingPoolEpochLedgerProps) {
  const [pool, setPool] = useState<PoolSnapshot | null>(null);
  const [epoch, setEpoch] = useState<ActiveEpochSnapshot | null>(null);
  const [stakes, setStakes] = useState<StakePositionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const fetchPoolState = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setErrorMsg(null);
      try {
        const params = new URLSearchParams({ poolId });
        if (pioneerUid) params.set("pioneerUid", pioneerUid);

        const res = await fetch(`/api/staking/pool?${params.toString()}`, {
          cache: "no-store",
        });
        const data: PoolApiResponse = await res.json();

        if (!res.ok || data.success === false) {
          throw new Error(
            (data as { message?: string; error?: string })?.message ||
              (data as { error?: string })?.error ||
              `Failed to load pool (${res.status})`
          );
        }

        if (data.pool) setPool(data.pool);
        if (data.activeEpoch) setEpoch(data.activeEpoch);
        if (Array.isArray(data.stakes)) setStakes(data.stakes);
      } catch (err: unknown) {
        setErrorMsg(
          err instanceof Error ? err.message : "Unable to load staking pool state."
        );
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [poolId, pioneerUid]
  );

  useEffect(() => {
    void fetchPoolState(false);
    if (!pollIntervalMs || pollIntervalMs <= 0) return;
    const id = window.setInterval(() => {
      void fetchPoolState(true);
    }, pollIntervalMs);
    return () => window.clearInterval(id);
  }, [fetchPoolState, pollIntervalMs]);

  const handleClaimRewards = async (stakeId?: string) => {
    const key = `claim:${stakeId ?? "all"}`;
    setBusyAction(key);
    setStatusBanner(null);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/staking/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poolId,
          ...(stakeId ? { stakeId } : {}),
          ...(pioneerUid ? { pioneerUid } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data?.message || data?.error || "Claim request failed.");
      }
      setStatusBanner(
        `Claimed ${data.totalClaimedMbzrFormatted ?? formatSubunitsToMbzr(data.totalClaimedMbzrSubunits)} mBZR`
      );
      await fetchPoolState(true);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to claim rewards.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleUnbondAction = async (
    stake: StakePositionItem,
    mode: "REQUEST_UNBOND" | "COMPLETE_UNBOND"
  ) => {
    const key = `unbond:${stake.stakeId}:${mode}`;
    setBusyAction(key);
    setStatusBanner(null);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/staking/unstake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poolId,
          stakeId: stake.stakeId,
          action: mode,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data?.message || data?.error || "Unbond action failed.");
      }
      setStatusBanner(`${mode} submitted for ${stake.stakeId}`);
      await fetchPoolState(true);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Unbond action failed.");
    } finally {
      setBusyAction(null);
    }
  };

  const totalClaimableSubunits = stakes.reduce((acc, s) => {
    try {
      return acc + BigInt(s.accruedMbzrSubunits || "0");
    } catch {
      return acc;
    }
  }, 0n);

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 text-zinc-100 shadow-lg space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <h2 className="text-lg font-semibold tracking-tight">
              Staking Pool & Epoch Ledger
            </h2>
            <span className="rounded bg-zinc-900 px-2 py-0.5 font-mono text-xs text-emerald-300 border border-zinc-800">
              {pool?.poolId ?? poolId}
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400 font-mono">
            Peg: 1 Pi = {pool?.pegRatioMbzrPerPi ?? 1000} mBZR · Split:{" "}
            {((pool?.stakerNodeShareBps ?? 7000) / 100).toFixed(0)}% Stakers /{" "}
            {((pool?.polTreasuryShareBps ?? 3000) / 100).toFixed(0)}% POL
            {pool?.vaultContractId ? ` · Vault ${pool.vaultContractId.slice(0, 8)}…` : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void fetchPoolState(false)}
            disabled={loading || busyAction !== null}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? "Syncing..." : "Refresh"}
          </button>
          <button
            type="button"
            onClick={() => void handleClaimRewards()}
            disabled={totalClaimableSubunits <= 0n || busyAction !== null}
            className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-40"
          >
            {busyAction === "claim:all"
              ? "Claiming..."
              : `Claim All (${formatSubunitsToMbzr(totalClaimableSubunits.toString())} mBZR)`}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-lg border border-red-800/80 bg-red-950/50 px-3.5 py-2.5 text-xs text-red-200">
          {errorMsg}
        </div>
      )}
      {statusBanner && (
        <div className="rounded-lg border border-emerald-800/80 bg-emerald-950/40 px-3.5 py-2.5 text-xs text-emerald-200">
          {statusBanner}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-zinc-800/90 bg-zinc-900/60 p-3">
          <div className="text-[11px] uppercase tracking-wider text-zinc-400">
            Total Staked
          </div>
          <div className="mt-1 font-mono text-sm font-semibold text-zinc-100">
            {pool?.totalStakedPiFormatted ?? "0.0000000"} Pi
          </div>
          <div className="mt-0.5 font-mono text-[11px] text-zinc-400">
            Rem. Cap: {pool?.remainingGlobalCapPiFormatted ?? "1000.0000000"} Pi
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800/90 bg-zinc-900/60 p-3">
          <div className="text-[11px] uppercase tracking-wider text-zinc-400">
            Active mBZR Issued
          </div>
          <div className="mt-1 font-mono text-sm font-semibold text-zinc-100">
            {pool?.activeMbzrIssuedFormatted ?? "0.0000000"}
          </div>
          <div className="mt-0.5 font-mono text-[11px] text-emerald-400">
            Backing: {pool?.collateralRatioPct ?? "100.00"}%
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800/90 bg-zinc-900/60 p-3">
          <div className="text-[11px] uppercase tracking-wider text-zinc-400">
            POL Treasury Reserve
          </div>
          <div className="mt-1 font-mono text-sm font-semibold text-amber-300">
            {pool?.polReserveMbzrFormatted ?? "0.0000000"} mBZR
          </div>
          <div className="mt-0.5 font-mono text-[11px] text-zinc-400">
            {pool?.polReservePiFormatted ?? "0.0000000"} Pi eq.
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800/90 bg-zinc-900/60 p-3">
          <div className="text-[11px] uppercase tracking-wider text-zinc-400">
            Active Epoch
          </div>
          <div className="mt-1 font-mono text-sm font-semibold text-zinc-100">
            #{epoch?.epochNumber ?? pool?.currentEpochNumber ?? 1}{" "}
            <span className="text-xs font-normal text-emerald-400">
              ({epoch?.status ?? "OPEN"})
            </span>
          </div>
          <div className="mt-0.5 font-mono text-[11px] text-zinc-400">
            Stakers: {epoch?.activeStakerCount ?? stakes.length} · Weight:{" "}
            {epoch?.totalPoolEffectiveWeight ?? "0"}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Epoch #{epoch?.epochNumber ?? pool?.currentEpochNumber ?? 1} Fee Streams & 70/30 Split
          </h3>
          <span className="font-mono text-xs text-zinc-300">
            Gross: {formatSubunitsToMbzr(epoch?.grossFeePoolMbzrSubunits)} mBZR
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 text-xs sm:grid-cols-4 font-mono">
          <div className="rounded border border-zinc-800/80 bg-zinc-950/70 p-2.5">
            <div className="text-[11px] text-zinc-400">Swap Fees (0.30%)</div>
            <div className="mt-1 text-zinc-100">
              {formatSubunitsToMbzr(epoch?.swapFeesCollectedMbzrSubunits)}
            </div>
          </div>
          <div className="rounded border border-zinc-800/80 bg-zinc-950/70 p-2.5">
            <div className="text-[11px] text-zinc-400">Marketplace Escrow</div>
            <div className="mt-1 text-zinc-100">
              {formatSubunitsToMbzr(epoch?.marketplaceFeesCollectedMbzrSubunits)}
            </div>
          </div>
          <div className="rounded border border-zinc-800/80 bg-zinc-950/70 p-2.5">
            <div className="text-[11px] text-zinc-400">Melt Tariffs (0.50%)</div>
            <div className="mt-1 text-zinc-100">
              {formatSubunitsToMbzr(epoch?.meltTariffsCollectedMbzrSubunits)}
            </div>
          </div>
          <div className="rounded border border-zinc-800/80 bg-zinc-950/70 p-2.5">
            <div className="text-[11px] text-zinc-400">Slashed Penalties</div>
            <div className="mt-1 text-zinc-100">
              {formatSubunitsToMbzr(epoch?.slashedPenaltiesMbzrSubunits)}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs font-mono border-t border-zinc-800/80">
          <span className="text-emerald-300">
            70% Staker Pool: {formatSubunitsToMbzr(epoch?.stakerPool70MbzrSubunits)} mBZR
          </span>
          <span className="text-amber-300">
            30% POL Treasury: {formatSubunitsToMbzr(epoch?.polTreasury30MbzrSubunits)} mBZR
          </span>
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Stake Positions ({stakes.length})
          </h3>
          {pool?.totalUnbondingPiFormatted && (
            <span className="font-mono text-[11px] text-zinc-400">
              Unbonding Pool: {pool.totalUnbondingPiFormatted} Pi
            </span>
          )}
        </div>

        {stakes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-800 p-6 text-center text-xs text-zinc-400">
            No stake positions found for this filter.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-zinc-900/90 text-[11px] uppercase text-zinc-400">
                <tr>
                  <th className="px-3 py-2">Stake ID</th>
                  <th className="px-3 py-2">Principal</th>
                  <th className="px-3 py-2">Tier / Weight</th>
                  <th className="px-3 py-2">Accrued</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 font-mono">
                {stakes.map((s) => {
                  const hasAccrued = BigInt(s.accruedMbzrSubunits || "0") > 0n;
                  return (
                    <tr key={s.stakeId} className="hover:bg-zinc-900/40">
                      <td className="px-3 py-2.5">
                        <div className="text-zinc-200">{s.stakeId}</div>
                        <div className="text-[11px] text-zinc-500">
                          {s.pioneerUid}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="text-zinc-100">{s.principalPiFormatted} Pi</div>
                        <div className="text-[11px] text-zinc-400">
                          {s.equivalentMbzrFormatted} mBZR
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="text-zinc-200">{s.lockTierDays}d · {s.uptimeShieldPct}%</div>
                        <div className="text-[11px] text-zinc-400">
                          W: {s.effectiveWeightUnits}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="text-emerald-300">
                          {formatSubunitsToMbzr(s.accruedMbzrSubunits)} mBZR
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          Claimed: {formatSubunitsToMbzr(s.claimedMbzrSubunits)}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="rounded bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-200">
                          {s.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          disabled={!hasAccrued || busyAction !== null}
                          onClick={() => void handleClaimRewards(s.stakeId)}
                          className="rounded border border-emerald-600/60 bg-emerald-950/50 px-2 py-1 text-[11px] text-emerald-200 hover:bg-emerald-900/60 disabled:opacity-40"
                        >
                          Claim
                        </button>
                        {s.status === "ACTIVE" ? (
                          <button
                            type="button"
                            disabled={busyAction !== null}
                            onClick={() => void handleUnbondAction(s, "REQUEST_UNBOND")}
                            className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-200 hover:bg-zinc-800 disabled:opacity-40"
                          >
                            Unbond
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={busyAction !== null}
                            onClick={() => void handleUnbondAction(s, "COMPLETE_UNBOND")}
                            className="rounded border border-amber-700/60 bg-amber-950/40 px-2 py-1 text-[11px] text-amber-200 hover:bg-amber-900/50 disabled:opacity-40"
                          >
                            Complete Unbond
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
