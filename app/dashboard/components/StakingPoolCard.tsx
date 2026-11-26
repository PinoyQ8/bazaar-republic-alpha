// Location: app/dashboard/components/StakingPoolCard.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Clock,
  Coins,
  Layers,
  Lock,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Unlock,
} from "lucide-react";
import {
  canPerformGovernanceAction,
  GOVERNANCE_TIER_META,
  GovernanceTierLevel,
  normalizeTierLevel,
} from "@/app/lib/governance/tierRbac";

const DEFAULT_PIONEER_UID = "GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3";

interface PoolPayload {
  poolId: string;
  status: string;
  currentEpochNumber: number;
  globalCapPiStroops: string;
  totalStakedPiStroops: string;
  totalUnbondingPiStroops: string;
  remainingGlobalCapPiStroops: string;
  remainingGlobalCapPiFormatted: string;
  totalStakedPiFormatted: string;
  totalUnbondingPiFormatted: string;
  activeMbzrIssuedFormatted: string;
  polReserveMbzrFormatted: string;
  polReservePiFormatted: string;
  collateralRatioPct: string;
  pegRatioMbzrPerPi: number;
  minUptimeShieldPct: number;
  unbondingCooldownSeconds: number;
}

interface ActiveEpochPayload {
  epochNumber: number;
  status: string;
  activeStakerCount: number;
  swapFeesCollectedMbzrSubunits: string;
  marketplaceFeesCollectedMbzrSubunits: string;
  meltTariffsCollectedMbzrSubunits: string;
  slashedPenaltiesMbzrSubunits: string;
  grossFeePoolMbzrSubunits: string;
  stakerPool70MbzrSubunits: string;
  polTreasury30MbzrSubunits: string;
  totalPoolEffectiveWeight: string;
}

interface StakePositionItem {
  stakeId: string;
  pioneerUid: string;
  principalPiStroops: string;
  equivalentMbzrSubunits: string;
  lockTierDays: number;
  lockMultiplierBps: number;
  uptimeShieldPct: number;
  effectiveWeightUnits: string;
  accruedMbzrSubunits: string;
  claimedMbzrSubunits: string;
  status: "ACTIVE" | "UNBONDING" | "WITHDRAWN" | string;
  stakedAt: string;
  unlocksAt: string;
  unbondCompletesAt?: string;
}

interface PoolApiResponse {
  success: boolean;
  pool: PoolPayload;
  activeEpoch: ActiveEpochPayload | null;
  stakes: StakePositionItem[];
  error?: string;
}

export interface StakingPoolCardProps {
  pioneerUid?: string;
  stellarAddress?: string;
  refreshIntervalMs?: number;
  defaultUptimeShieldPct?: number;
  governanceTier?: GovernanceTierLevel | string;
  hasPassport?: boolean;
  isFrozen?: boolean;
  onExecuteStake?: (amountPi: number) => Promise<void> | void;
}

function format7DecimalsFromSubunits(raw: string | undefined | null): string {
  if (!raw) return "0.0000000";
  try {
    const val = BigInt(raw);
    const sign = val < 0n ? "-" : "";
    const abs = val < 0n ? -val : val;
    const whole = abs / 10_000_000n;
    const frac = (abs % 10_000_000n).toString().padStart(7, "0");
    return `${sign}${whole.toString()}.${frac}`;
  } catch {
    return "0.0000000";
  }
}

function safeBigInt(raw: string | undefined | null): bigint {
  if (!raw) return 0n;
  try {
    return BigInt(raw);
  } catch {
    return 0n;
  }
}

function formatShortDate(iso?: string): string {
  if (!iso) return "--";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--";
  return d.toISOString().slice(0, 10);
}

export default function StakingPoolCard({
  pioneerUid = DEFAULT_PIONEER_UID,
  stellarAddress,
  refreshIntervalMs = 20000,
  defaultUptimeShieldPct = 95,
  governanceTier = 1,
  hasPassport = true,
  isFrozen = false,
  onExecuteStake,
}: StakingPoolCardProps) {
  const [data, setData] = useState<PoolApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [unstakingId, setUnstakingId] = useState<string | null>(null);

  const [stakeAmountPi, setStakeAmountPi] = useState<string>("5");
  const [lockTierDays, setLockTierDays] = useState<30 | 60 | 90>(90);
  const [banner, setBanner] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const resolvedTier = normalizeTierLevel(governanceTier);
  const vaultPermission = useMemo(
    () =>
      canPerformGovernanceAction(resolvedTier, "MANAGE_STAKING_VAULT", {
        hasPassport,
        isFrozen,
      }),
    [resolvedTier, hasPassport, isFrozen]
  );

  const effectiveUid = useMemo(
  () =>
    pioneerUid && pioneerUid.trim().length > 0
      ? pioneerUid.trim()
      : DEFAULT_PIONEER_UID,
  [pioneerUid]
);

const fetchPoolState = useCallback(
  async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const query = effectiveUid
        ? `?pioneerUid=${encodeURIComponent(effectiveUid)}`
        : "";
      const res = await fetch(`/api/staking/pool${query}`, {
        cache: "no-store",
      });
      const json = (await res.json().catch(() => ({}))) as PoolApiResponse;

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load staking pool.");
      }

      setData(json);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Network error loading pool.";
      setBanner({ type: "err", text: msg });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  },
  [effectiveUid]
);

  useEffect(() => {
    fetchPoolState(false);
    if (refreshIntervalMs > 0) {
      const id = setInterval(() => fetchPoolState(true), refreshIntervalMs);
      return () => clearInterval(id);
    }
  }, [fetchPoolState, refreshIntervalMs]);

  const capProgressPct = useMemo(() => {
    if (!data?.pool) return 0;
    const staked = safeBigInt(data.pool.totalStakedPiStroops);
    const cap = safeBigInt(data.pool.globalCapPiStroops);
    if (cap <= 0n) return 0;
    const bps = (staked * 10_000n) / cap;
    return Math.min(100, Math.max(0, Number(bps) / 100));
  }, [data]);

  const totalAccruedSubunits = useMemo(() => {
    if (!data?.stakes?.length) return 0n;
    return data.stakes.reduce((acc, s) => acc + safeBigInt(s.accruedMbzrSubunits), 0n);
  }, [data]);

  const previewMbzr = useMemo(() => {
    const num = Number.parseFloat(stakeAmountPi);
    if (!Number.isFinite(num) || num <= 0) return "0.0000000";
    return (num * 1000).toFixed(7);
  }, [stakeAmountPi]);

  const handleDeposit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!vaultPermission.allowed) {
    setBanner({
      type: "err",
      text: vaultPermission.reason ?? "Insufficient tier clearance for staking.",
    });
    return;
  }
  setBanner(null);
  setSubmitting(true);
  try {
    const numericAmount = Number.parseFloat(stakeAmountPi);
    if (onExecuteStake && Number.isFinite(numericAmount) && numericAmount > 0) {
      await onExecuteStake(numericAmount);
    }
    const res = await fetch("/api/staking/deposit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-pioneer-uid": effectiveUid,
      },
      body: JSON.stringify({
        pioneerUid: effectiveUid,
        stellarAddress: stellarAddress || effectiveUid,
        amountPi: stakeAmountPi,
        lockTierDays,
        uptimeShieldPct: defaultUptimeShieldPct,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Stake deposit failed.");
    }
    setBanner({
      type: "ok",
      text: `Locked ${json.stake?.principalPiFormatted ?? stakeAmountPi} Pi (${lockTierDays}d tier) -> ${json.stake?.stakeId}`,
    });
    await fetchPoolState(true);
  } catch (err: unknown) {
    setBanner({
      type: "err",
      text: err instanceof Error ? err.message : "Failed to deposit stake.",
    });
  } finally {
    setSubmitting(false);
  }
};

const handleClaim = async (stakeId?: string) => {
  if (!vaultPermission.allowed) {
    setBanner({
      type: "err",
      text: vaultPermission.reason ?? "Insufficient tier clearance to claim rewards.",
    });
    return;
  }
  setBanner(null);
  setClaimingId(stakeId ?? "ALL");
  try {
    const res = await fetch("/api/staking/claim", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-pioneer-uid": effectiveUid,
      },
      body: JSON.stringify({
        pioneerUid: effectiveUid,
        ...(stakeId ? { stakeId } : {}),
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Claim failed.");
    }
    setBanner({
      type: "ok",
      text: `Claimed ${json.totalClaimedMbzrFormatted} mBZR (${json.piEquivalentFormatted} Pi eq.)`,
    });
    await fetchPoolState(true);
  } catch (err: unknown) {
    setBanner({
      type: "err",
      text: err instanceof Error ? err.message : "Failed to claim accrued rewards.",
    });
  } finally {
    setClaimingId(null);
  }
};

const handleUnstake = async (stake: StakePositionItem) => {
  if (!vaultPermission.allowed) {
    setBanner({
      type: "err",
      text: vaultPermission.reason ?? "Insufficient tier clearance to unbond stake.",
    });
    return;
  }
  setBanner(null);
  setUnstakingId(stake.stakeId);
  const action =
    stake.status === "UNBONDING" ? "COMPLETE_UNBOND" : "REQUEST_UNBOND";
  try {
    const res = await fetch("/api/staking/unstake", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-pioneer-uid": effectiveUid,
      },
      body: JSON.stringify({
        stakeId: stake.stakeId,
        pioneerUid: effectiveUid,
        action,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) {
      if (json.error === "STAKE_LOCK_ACTIVE") {
        throw new Error(`Lock active until ${formatShortDate(json.unlocksAt)}`);
      }
      if (json.error === "UNBONDING_COOLDOWN_IN_PROGRESS") {
        throw new Error(
          `Cooldown active until ${formatShortDate(json.unbondCompletesAt)}`
        );
      }
      throw new Error(json.error || "Unstake request failed.");
    }
    setBanner({
      type: "ok",
      text:
        json.stage === "UNBONDING"
          ? `Unbonding started for ${stake.stakeId}; completes ${formatShortDate(json.unbondCompletesAt)}`
          : `Withdrawn ${json.releasedPrincipalPiFormatted} Pi from ${stake.stakeId}`,
    });
    await fetchPoolState(true);
  } catch (err: unknown) {
    setBanner({
      type: "err",
      text: err instanceof Error ? err.message : "Failed to process unstake.",
    });
  } finally {
    setUnstakingId(null);
  }
};

  const pool = data?.pool;
  const epoch = data?.activeEpoch;
  const stakes = data?.stakes ?? [];
  const requiredMeta = GOVERNANCE_TIER_META[vaultPermission.requiredTier];

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950/90 p-3.5 font-mono text-slate-100 shadow-xl space-y-3.5">
      <div className="flex items-center justify-between border-b border-zinc-800/90 pb-2.5">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-cyan-400" />
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-100">
              Genesis LP Vault // 1,000 Pi
            </h2>
            <p className="text-[10px] text-zinc-500">
              {pool?.poolId ?? "GENESIS_LP_1000_PI"} • Epoch #{pool?.currentEpochNumber ?? "--"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
              vaultPermission.allowed
                ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/70"
                : "bg-amber-950/80 text-amber-400 border border-amber-800/70"
            }`}
          >
            {vaultPermission.allowed ? (pool?.status ?? "ACTIVE") : "READ-ONLY"}
          </span>
          <button
            type="button"
            onClick={() => fetchPoolState(false)}
            disabled={refreshing}
            aria-label="Refresh staking pool"
            className="rounded border border-zinc-800 bg-zinc-900 p-1 text-cyan-400 hover:border-cyan-700 hover:text-cyan-300 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {!vaultPermission.allowed && (
        <div className="rounded-lg border border-amber-800/70 bg-amber-950/30 px-2.5 py-2 text-[10px] text-amber-300 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 shrink-0 text-amber-400" />
            <span>
              Vault actions locked ({vaultPermission.reason}). Pool & epoch metrics remain viewable.
            </span>
          </span>
          <span
            className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-bold ${requiredMeta.badgeClass}`}
          >
            {requiredMeta.shortLabel}
          </span>
        </div>
      )}

      {banner && (
        <div
          className={`rounded-lg border px-2.5 py-1.5 text-[11px] wrap-break-word ${
            banner.type === "ok"
              ? "border-emerald-800/80 bg-emerald-950/40 text-emerald-300"
              : "border-rose-800/80 bg-rose-950/40 text-rose-300"
          }`}
        >
          {banner.text}
        </div>
      )}

      {loading && !pool ? (
        <div className="py-6 text-center text-xs text-zinc-500">
          Synchronizing liquidity pool & epoch ledger...
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/50 p-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-400">Global Pool Cap</span>
              <span className="font-bold text-cyan-300">
                {pool?.totalStakedPiFormatted ?? "0.0000000"} / 1,000.0000000 Pi
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full bg-linear-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${capProgressPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-zinc-500">
              <span>Cap Used: {capProgressPct.toFixed(2)}%</span>
              <span>Remaining: {pool?.remainingGlobalCapPiFormatted ?? "0.0000000"} Pi</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-2">
              <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                <ShieldCheck className="h-3 w-3 text-emerald-400" />
                <span>Backing Ratio (1:1k)</span>
              </div>
              <div className="mt-1 font-bold text-emerald-400">
                {pool?.collateralRatioPct ?? "100.00"}% CR
              </div>
              <div className="text-[10px] text-zinc-500 truncate">
                {pool?.activeMbzrIssuedFormatted ?? "0.0000000"} mBZR
              </div>
            </div>

            <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-2">
              <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                <Coins className="h-3 w-3 text-amber-400" />
                <span>DAO POL Reserve (30%)</span>
              </div>
              <div className="mt-1 font-bold text-amber-300">
                {pool?.polReserveMbzrFormatted ?? "0.0000000"} mBZR
              </div>
              <div className="text-[10px] text-zinc-500">
                {pool?.polReservePiFormatted ?? "0.0000000"} Pi eq.
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-indigo-900/60 bg-indigo-950/20 p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-indigo-300">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                Epoch #{epoch?.epochNumber ?? pool?.currentEpochNumber ?? 1} Fee Ledger
              </span>
              <span className="text-[10px] text-indigo-400">
                {epoch?.status ?? "OPEN"} • {epoch?.activeStakerCount ?? 0} Staker(s)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
              <div className="flex justify-between">
                <span className="text-zinc-400">0.30% Swap Fees:</span>
                <span className="text-zinc-200">
                  {format7DecimalsFromSubunits(epoch?.swapFeesCollectedMbzrSubunits)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Escrow Fees:</span>
                <span className="text-zinc-200">
                  {format7DecimalsFromSubunits(epoch?.marketplaceFeesCollectedMbzrSubunits)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">0.50% Melt Tariff:</span>
                <span className="text-zinc-200">
                  {format7DecimalsFromSubunits(epoch?.meltTariffsCollectedMbzrSubunits)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Slashed SLA:</span>
                <span className="text-zinc-200">
                  {format7DecimalsFromSubunits(epoch?.slashedPenaltiesMbzrSubunits)}
                </span>
              </div>
            </div>

            <div className="border-t border-indigo-900/50 pt-1.5 flex items-center justify-between text-[10px]">
              <span className="text-zinc-400">
                Gross:{" "}
                <strong className="text-zinc-100">
                  {format7DecimalsFromSubunits(epoch?.grossFeePoolMbzrSubunits)} mBZR
                </strong>
              </span>
              <span className="text-emerald-300">
                70% Stakers:{" "}
                <strong>{format7DecimalsFromSubunits(epoch?.stakerPool70MbzrSubunits)}</strong>
              </span>
            </div>
          </div>

          <form
            onSubmit={handleDeposit}
            className={`rounded-lg border border-zinc-800 bg-zinc-900/40 p-2.5 space-y-2 ${
              !vaultPermission.allowed ? "opacity-60" : ""
            }`}
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-zinc-200">Lock Pi Liquidity</span>
              <span className="text-[10px] text-cyan-400">Mint: {previewMbzr} mBZR</span>
            </div>

            <div className="flex gap-2">
              <input
                type="number"
                step="0.0000001"
                min="1"
                max="250"
                disabled={!vaultPermission.allowed}
                value={stakeAmountPi}
                onChange={(e) => setStakeAmountPi(e.target.value)}
                placeholder="Amount in Pi"
                className="w-full rounded border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-100 focus:border-cyan-500 focus:outline-none disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!vaultPermission.allowed || submitting || pool?.status !== "ACTIVE"}
                title={
                  vaultPermission.allowed
                    ? "Lock Pi into Genesis LP Vault"
                    : vaultPermission.reason
                }
                className="shrink-0 rounded bg-cyan-600 px-3 py-1.5 text-xs font-bold text-zinc-950 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
              >
                <Lock className="h-3.5 w-3.5" />
                {!vaultPermission.allowed ? "T3 Lock" : submitting ? "Locking..." : "Stake"}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { days: 30, mult: "1.0x" },
                  { days: 60, mult: "1.25x" },
                  { days: 90, mult: "1.5x" },
                ] as const
              ).map((tier) => (
                <button
                  key={tier.days}
                  type="button"
                  disabled={!vaultPermission.allowed}
                  onClick={() => setLockTierDays(tier.days)}
                  className={`rounded border py-1 text-[10px] font-bold disabled:cursor-not-allowed cursor-pointer ${
                    lockTierDays === tier.days
                      ? "border-cyan-500 bg-cyan-950/60 text-cyan-300"
                      : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  {tier.days}d ({tier.mult})
                </button>
              ))}
            </div>
          </form>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-zinc-300">
                Your Stake Positions ({stakes.length})
              </span>
              {totalAccruedSubunits > 0n && (
                <button
                  type="button"
                  onClick={() => handleClaim()}
                  disabled={!vaultPermission.allowed || claimingId !== null}
                  title={vaultPermission.allowed ? "Claim all accrued rewards" : vaultPermission.reason}
                  className="rounded bg-emerald-500 px-2 py-1 text-[10px] font-bold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                >
                  <ArrowUpRight className="h-3 w-3" />
                  {claimingId === "ALL"
                    ? "Claiming..."
                    : `Claim ${format7DecimalsFromSubunits(totalAccruedSubunits.toString())} mBZR`}
                </button>
              )}
            </div>

            {stakes.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-800 p-3 text-center text-[11px] text-zinc-500">
                No active stake positions for {effectiveUid.slice(0, 8)}...
              </div>
            ) : (
              <div className="space-y-2">
                {stakes.map((st) => {
                  const accrued = safeBigInt(st.accruedMbzrSubunits);
                  const unlocked = new Date() >= new Date(st.unlocksAt);
                  const unbondReady =
                    st.status === "UNBONDING" &&
                    (!st.unbondCompletesAt || new Date() >= new Date(st.unbondCompletesAt));

                  return (
                    <div
                      key={st.stakeId}
                      className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2.5 space-y-1.5 text-[10px]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-200">{st.stakeId}</span>
                        <span
                          className={`rounded px-1.5 py-0.5 font-bold ${
                            st.status === "ACTIVE"
                              ? "bg-cyan-950 text-cyan-300"
                              : st.status === "UNBONDING"
                                ? "bg-amber-950 text-amber-300"
                                : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          {st.status}
                        </span>
                      </div>

                      <div className="flex justify-between text-zinc-400">
                        <span>
                          Principal:{" "}
                          <strong className="text-zinc-100">
                            {format7DecimalsFromSubunits(st.principalPiStroops)} Pi
                          </strong>
                        </span>
                        <span>
                          Tier: <strong className="text-cyan-300">{st.lockTierDays}d</strong> (
                          {(st.lockMultiplierBps / 10000).toFixed(2)}x)
                        </span>
                      </div>

                      <div className="flex justify-between text-zinc-400">
                        <span>
                          Accrued:{" "}
                          <strong className="text-emerald-400">
                            {format7DecimalsFromSubunits(st.accruedMbzrSubunits)} mBZR
                          </strong>
                        </span>
                        <span>
                          Claimed:{" "}
                          <strong className="text-zinc-300">
                            {format7DecimalsFromSubunits(st.claimedMbzrSubunits)} mBZR
                          </strong>
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80">
                        <span className="flex items-center gap-1 text-zinc-500">
                          <Clock className="h-3 w-3" />
                          {st.status === "UNBONDING"
                            ? `Ready: ${formatShortDate(st.unbondCompletesAt)}`
                            : `Unlocks: ${formatShortDate(st.unlocksAt)}`}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {accrued > 0n && (
                            <button
                              type="button"
                              onClick={() => handleClaim(st.stakeId)}
                              disabled={!vaultPermission.allowed || claimingId !== null}
                              className="rounded border border-emerald-700 bg-emerald-950/60 px-2 py-0.5 font-bold text-emerald-300 hover:bg-emerald-900/60 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                              {claimingId === st.stakeId ? "..." : "Claim"}
                            </button>
                          )}

                          {st.status === "ACTIVE" && (
                            <button
                              type="button"
                              onClick={() => handleUnstake(st)}
                              disabled={
                                !vaultPermission.allowed || !unlocked || unstakingId === st.stakeId
                              }
                              title={
                                !vaultPermission.allowed
                                  ? vaultPermission.reason
                                  : unlocked
                                    ? "Initiate 7-day unbonding cooldown"
                                    : `Locked until ${formatShortDate(st.unlocksAt)}`
                              }
                              className="rounded border border-zinc-700 bg-zinc-900 px-2 py-0.5 font-bold text-zinc-300 hover:border-amber-600 hover:text-amber-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                            >
                              <Unlock className="h-2.5 w-2.5" />
                              {unstakingId === st.stakeId
                                ? "..."
                                : !vaultPermission.allowed
                                  ? "T3 Lock"
                                  : unlocked
                                    ? "Unbond"
                                    : "Locked"}
                            </button>
                          )}

                          {st.status === "UNBONDING" && (
                            <button
                              type="button"
                              onClick={() => handleUnstake(st)}
                              disabled={
                                !vaultPermission.allowed ||
                                !unbondReady ||
                                unstakingId === st.stakeId
                              }
                              className="rounded border border-amber-700 bg-amber-950/60 px-2 py-0.5 font-bold text-amber-300 hover:bg-amber-900/60 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                              {unstakingId === st.stakeId
                                ? "..."
                                : !vaultPermission.allowed
                                  ? "T3 Lock"
                                  : unbondReady
                                    ? "Withdraw Pi"
                                    : "Cooldown"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}