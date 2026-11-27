// Location: app/dashboard/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useNodeHeartbeat } from "@/hooks/useNodeHeartbeat";
import { useAuth } from "@/context/AuthContext";
import {
  Shield,
  Server,
  ArrowRight,
  RefreshCw,
  Lock,
  Crown,
  Sliders,
} from "lucide-react";
import StakingPoolCard from "@/app/dashboard/components/StakingPoolCard";
import StakingPoolEpochLedger from "@/components/staking/StakingPoolEpochLedger";
import {
  canAccessDashboardSection,
  canPerformGovernanceAction,
  GOVERNANCE_TIER_META,
  GovernanceTierLevel,
  normalizeTierLevel,
} from "@/app/lib/governance/tierRbac";

interface MeshHealthResponse {
  status?: string;
  node?: {
    id?: string;
    role?: string;
    uptimeSeconds?: number;
  };
  meshLedger?: {
    dbStatus?: string;
    dbLatencyMs?: number;
    activeLocks?: number;
    pendingDisputes?: number;
    settledContracts?: number;
  };
}

export interface DashboardPageProps {
  governanceTier?: GovernanceTierLevel | string;
}

const TIER_LEVELS: GovernanceTierLevel[] = [1, 2, 3, 4, 5];
const SANCTIONED_STATUSES = new Set(["FROZEN", "QUARANTINED", "SUSPENDED"]);
const IS_DEV_OR_TEST = process.env.NODE_ENV !== "production";

export default function DashboardPage({
  governanceTier,
}: DashboardPageProps) {
  const { pioneer, isHydrated, isFounder, executeStakePayment } = useAuth();

  const resolvedBaseTier = normalizeTierLevel(
    governanceTier ?? (pioneer?.isAuthenticated ? pioneer?.tier : 1) ?? 1
  );

  const [selectedTier, setSelectedTier] = useState<GovernanceTierLevel>(
    resolvedBaseTier
  );
  const [healthData, setHealthData] = useState<MeshHealthResponse | null>(null);

  useEffect(() => {
    setSelectedTier(resolvedBaseTier);
  }, [resolvedBaseTier]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const tierParam = new URLSearchParams(window.location.search).get("tier");
    if (tierParam) {
      setSelectedTier(normalizeTierLevel(tierParam));
    }
  }, []);

  const heartbeat = useNodeHeartbeat({
    nodeId: "Node-001-X570-Taichi",
    role: "PRIMARY_VALIDATOR",
    protocolVersion: "28",
    uptimeShield: 92.4,
    intervalMs: 60000,
  });

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/mesh/health", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as MeshHealthResponse;
        setHealthData(data);
      }
    } catch (err) {
      console.error("[DASHBOARD_MESH_HEALTH_FAULT]:", err);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const rawStatus = String(pioneer?.status || "ACTIVE").toUpperCase();
  const isNodeFrozen = SANCTIONED_STATUSES.has(rawStatus);
  const hasPassport = isHydrated ? Boolean(pioneer?.isAuthenticated) : false;
  const hasRole = Boolean(pioneer?.role && pioneer.role !== "NONE");

  const canShowPreviewBar = IS_DEV_OR_TEST || Boolean(isFounder);
  const effectiveTier = canShowPreviewBar ? selectedTier : resolvedBaseTier;

  const activePioneerUid = pioneer?.uid || pioneer?.publicKey || "";

  const effectiveShield =
    typeof heartbeat.uptimeShield === "number" &&
    Number.isFinite(heartbeat.uptimeShield)
      ? heartbeat.uptimeShield
      : 92.4;
  const shieldHealthy = effectiveShield >= 92.0;

  const tierMeta = GOVERNANCE_TIER_META[effectiveTier];
  const nodePulsePerm = canPerformGovernanceAction(
    effectiveTier,
    "TRIGGER_NODE_PULSE",
    {
      hasPassport,
      isFrozen: isNodeFrozen,
      hasRole,
    }
  );
  const validatorSectionPerm = canAccessDashboardSection(
    effectiveTier,
    "VALIDATOR_TELEMETRY_CARD"
  );
  const elderSectionPerm = canAccessDashboardSection(
    effectiveTier,
    "ELDER_ADJUDICATION_PANEL"
  );

  return (
    <div className="w-full max-w-[384px] mx-auto p-4 pb-24 space-y-4 font-mono text-slate-100">
      {/* Header */}
      <header className="border-b border-zinc-800 pb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`h-2.5 w-2.5 shrink-0 rounded-full animate-pulse ${
              heartbeat.warning || isNodeFrozen
                ? "bg-amber-400"
                : "bg-emerald-500"
            }`}
          />
          <span className="font-bold text-xs tracking-wider uppercase text-zinc-100 truncate">
            BAZAAR REPUBLIC // L2
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`rounded border px-1.5 py-0.5 text-[9px] font-bold ${tierMeta.badgeClass}`}
          >
            {tierMeta.shortLabel}
          </span>

          <button
            type="button"
            disabled={!nodePulsePerm.allowed}
            onClick={() => {
              if (!nodePulsePerm.allowed) return;
              heartbeat.triggerPulse();
              fetchHealth();
            }}
            title={
              nodePulsePerm.allowed
                ? "Trigger Validator Heartbeat Pulse"
                : nodePulsePerm.reason
            }
            className="text-[10px] text-cyan-400 hover:text-cyan-300 disabled:text-zinc-500 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
          >
            {nodePulsePerm.allowed ? (
              <RefreshCw
                size={11}
                className={heartbeat.isPulsing ? "animate-spin" : ""}
              />
            ) : (
              <Lock size={10} className="text-amber-400" />
            )}
            <span>{healthData?.node?.id || "Node-001"}</span>
          </button>
        </div>
      </header>

      {/* Dev / Founder 5-Tier RBAC Preview Switcher */}
      {canShowPreviewBar && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-2.5 space-y-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="flex items-center gap-1.5 font-bold uppercase text-zinc-300">
              <Sliders size={12} className="text-cyan-400" />
              RBAC Tier Preview
            </span>
            <span className="text-[9px] text-zinc-500">5-Tier Access Gate</span>
          </div>

          <div className="grid grid-cols-5 gap-1">
            {TIER_LEVELS.map((lvl) => {
              const active = effectiveTier === lvl;
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSelectedTier(lvl)}
                  className={`rounded border py-1 text-[10px] font-bold cursor-pointer transition-colors ${
                    active
                      ? "border-cyan-500 bg-cyan-950/70 text-cyan-300"
                      : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  T{lvl}
                </button>
              );
            })}
          </div>

          <p className="text-[10px] text-zinc-400 leading-snug">
            <strong className="text-zinc-200">{tierMeta.label}:</strong>{" "}
            {tierMeta.summary}
          </p>
        </div>
      )}

      {/* Validator Telemetry & 92.0% Shield Indicator */}
      <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-3.5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-zinc-400 font-semibold uppercase flex items-center gap-1.5">
            <Server size={13} className="text-amber-400" />
            Validator Telemetry
          </span>
          <div className="flex items-center gap-1.5">
            {!validatorSectionPerm.allowed && (
              <span className="text-[9px] text-amber-300 font-bold px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800/70 flex items-center gap-1">
                <Lock size={9} /> T4 Controls
              </span>
            )}
            <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
              {isNodeFrozen
                ? rawStatus
                : heartbeat.nodeStatus || healthData?.status || "ONLINE"}
            </span>
          </div>
        </div>

        {/* Dedicated 92.0% Shield Indicator Banner */}
        <div className="rounded-lg bg-zinc-950/90 border border-zinc-800 p-2.5 flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase tracking-wider text-zinc-400 block">
              92.0% Shield Indicator
            </span>
            <span
              className={`text-xs font-bold ${
                shieldHealthy ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {shieldHealthy ? "SHIELD LOCKED (≥92.0%)" : "BELOW 92.0% TARGET"}
            </span>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
              shieldHealthy
                ? "text-emerald-300 bg-emerald-950/60 border-emerald-700/50"
                : "text-amber-300 bg-amber-950/60 border-amber-700/50"
            }`}
          >
            92.0% Target
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="bg-zinc-950/70 p-2 rounded-lg border border-zinc-800/80">
            <span className="text-zinc-500 block text-[10px]">UPTIME SHIELD</span>
            <span
              className={`text-sm font-bold ${
                shieldHealthy ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {effectiveShield.toFixed(1)}%
            </span>
            <span className="text-[9px] text-zinc-500 block">
              90.0% SLA Floor • 60s Ping
            </span>
          </div>

          <div className="bg-zinc-950/70 p-2 rounded-lg border border-zinc-800/80">
            <span className="text-zinc-500 block text-[10px]">DB LATENCY</span>
            <span className="text-sm font-bold text-cyan-400">
              {healthData?.meshLedger?.dbLatencyMs !== undefined
                ? `${healthData.meshLedger.dbLatencyMs}ms`
                : "<200ms"}
            </span>
            <span className="text-[9px] text-zinc-500 block">
              {healthData?.meshLedger?.dbStatus || "MongoDB bzr-db"}
            </span>
          </div>
        </div>

        {heartbeat.warning && (
          <div className="text-[10px] text-amber-300 bg-amber-950/50 border border-amber-800/70 rounded-lg p-2">
            {heartbeat.warning}
          </div>
        )}
      </div>

      {/* Genesis LP Staking Pool & Epoch Ledger */}
      <StakingPoolCard
        pioneerUid={activePioneerUid}
        governanceTier={effectiveTier}
        defaultUptimeShieldPct={Math.round(effectiveShield)}
        hasPassport={hasPassport}
        isFrozen={isNodeFrozen}
        onExecuteStake={executeStakePayment}
      />

      <StakingPoolEpochLedger poolId="GENESIS_LP_1000_PI" pioneerUid={activePioneerUid || undefined} />

      {/* Tier 5 Genesis / Elder Protocol Clearance Card */}
      <div
        className={`rounded-xl border p-3 text-[11px] flex items-center justify-between gap-2 ${
          elderSectionPerm.allowed
            ? "border-amber-700/70 bg-amber-950/20 text-amber-200"
            : "border-zinc-800 bg-zinc-900/40 text-zinc-500"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {elderSectionPerm.allowed ? (
            <Crown size={14} className="shrink-0 text-amber-400" />
          ) : (
            <Lock size={14} className="shrink-0 text-zinc-500" />
          )}
          <div className="truncate">
            <span className="font-bold block text-[11px]">
              {elderSectionPerm.allowed
                ? "Genesis / Elder Protocol Clearance Active"
                : "Genesis / Elder Controls Locked"}
            </span>
            <span className="text-[10px] block truncate">
              {elderSectionPerm.allowed
                ? "5-Elder adjudication, epoch settlement & WASM upgrades"
                : "Requires Tier 5 • Genesis / Elder clearance"}
            </span>
          </div>
        </div>
        <span className="shrink-0 rounded border border-zinc-700 px-1.5 py-0.5 text-[9px] font-bold">
          {elderSectionPerm.allowed ? "T5 UNLOCKED" : "T5 GATE"}
        </span>
      </div>

      {/* Quick Sector Navigation */}
      <nav className="grid grid-cols-2 gap-2 text-xs">
        <Link
          href={`/governance?tier=${effectiveTier}`}
          className="p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800 hover:border-cyan-500/50 flex items-center justify-between"
        >
          <span className="flex items-center gap-1.5 text-cyan-300 font-semibold">
            <Shield size={13} /> Governance
          </span>
          <ArrowRight size={13} className="text-zinc-500" />
        </Link>

        <Link
          href={
            validatorSectionPerm.allowed
              ? `/mesh/node?tier=${effectiveTier}`
              : "#"
          }
          aria-disabled={!validatorSectionPerm.allowed}
          onClick={(e) => {
            if (!validatorSectionPerm.allowed) e.preventDefault();
          }}
          className={`p-2.5 rounded-xl border flex items-center justify-between ${
            validatorSectionPerm.allowed
              ? "bg-zinc-900/70 border-zinc-800 hover:border-emerald-500/50 text-emerald-300"
              : "bg-zinc-950/60 border-zinc-800/70 text-zinc-500 cursor-not-allowed"
          }`}
        >
          <span className="font-semibold flex items-center gap-1">
            {!validatorSectionPerm.allowed && (
              <Lock size={11} className="text-amber-400" />
            )}
            DePIN Node
          </span>
          <ArrowRight size={13} className="text-zinc-500" />
        </Link>
      </nav>
    </div>
  );
}
