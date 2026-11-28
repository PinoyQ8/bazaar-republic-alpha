// Location: components/MenuConsole.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PasskeyEnrollmentCard from "@/components/PasskeyEnrollmentCard";
import {
  ArrowUpRight,
  Crown,
  LogOut,
  Menu,
  RefreshCw,
  ShieldCheck,
  User,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import {
  GOVERNANCE_TIER_META,
  normalizeTierLevel,
} from "@/app/lib/governance/tierRbac";

export default function MenuConsole() {
  const router = useRouter();
  const { pioneer, logout, isFounder, switchFounderRole } = useAuth();
  const [restoring, setRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const tierLevel = normalizeTierLevel(pioneer?.tier ?? 1);
  const tierMeta = GOVERNANCE_TIER_META[tierLevel];

  const configuredFounderUid = (
    process.env.NEXT_PUBLIC_FOUNDER_PI_UID || ""
  ).trim();
  const canRestoreFounder =
    isFounder ||
    Boolean(
      configuredFounderUid &&
        pioneer?.uid &&
        pioneer.uid.trim() === configuredFounderUid
    );

  const handleLogout = () => {
    logout();
    router.push("/log-in");
  };

  const handleQuickRestoreFounder = async () => {
    setRestoring(true);
    setRestoreError(null);
    try {
      await switchFounderRole({
        targetTier: "BAZAAR_FOUNDER",
        requestedRole: "FOUNDER",
        allowDevOverride: process.env.NODE_ENV !== "production",
      });
      router.push("/founder");
    } catch (err: any) {
      setRestoreError(err?.message || "RESTORE_FOUNDER_FAILED");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <section className="space-y-3 font-mono text-slate-100">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Menu className="h-4 w-4 text-cyan-400" />
          <h1 className="text-xs font-bold uppercase tracking-wider text-zinc-100">
            Republic Menu
          </h1>
        </div>
        <span
          className={`rounded border px-1.5 py-0.5 text-[9px] font-bold ${tierMeta.badgeClass}`}
        >
          {tierMeta.shortLabel}
        </span>
      </div>

      {/* Session & Role Card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 space-y-1.5 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-cyan-300">
          <User className="h-3.5 w-3.5" />
          <span>Pioneer Session</span>
        </div>
        <div className="text-[11px] text-zinc-300">
          Account: <strong>{pioneer?.username || "Guest / Unsynced"}</strong>
        </div>
        <div className="text-[10px] text-zinc-400">
          Status:{" "}
          <span className="text-emerald-300">
            {pioneer?.status || "SYNCING"}
          </span>{" "}
          • Role: <span className="text-cyan-300">{pioneer?.role || "NONE"}</span>
        </div>
        {pioneer?.uid && (
          <div className="text-[9px] text-zinc-500 truncate">
            UID: {pioneer.uid}
          </div>
        )}
      </div>

      {/* Quick Sector Links */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 space-y-2 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-zinc-200">
          <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
          <span>Sectors & Tools</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <Link
            href="/dashboard/marketplace"
            className="rounded-lg border border-zinc-800 bg-zinc-950/80 px-2.5 py-2 flex items-center justify-between hover:border-cyan-600/60"
          >
            <span>Market</span>
            <ArrowUpRight className="h-3 w-3 text-zinc-500" />
          </Link>
          <Link
            href="/mesh/escrow"
            className="rounded-lg border border-zinc-800 bg-zinc-950/80 px-2.5 py-2 flex items-center justify-between hover:border-cyan-600/60"
          >
            <span>Escrow</span>
            <ArrowUpRight className="h-3 w-3 text-zinc-500" />
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-zinc-800 bg-zinc-950/80 px-2.5 py-2 flex items-center justify-between hover:border-emerald-600/60"
          >
            <span>Staking</span>
            <ArrowUpRight className="h-3 w-3 text-zinc-500" />
          </Link>
          <Link
            href="/academy"
            className="rounded-lg border border-zinc-800 bg-zinc-950/80 px-2.5 py-2 flex items-center justify-between hover:border-cyan-600/60"
          >
            <span>Academy</span>
            <ArrowUpRight className="h-3 w-3 text-zinc-500" />
          </Link>
          <Link
            href="/governance"
            className="rounded-lg border border-zinc-800 bg-zinc-950/80 px-2.5 py-2 flex items-center justify-between hover:border-indigo-600/60"
          >
            <span>Genesis</span>
            <ArrowUpRight className="h-3 w-3 text-zinc-500" />
          </Link>
          {isFounder && (
            <Link
              href="/founder"
              className="rounded-lg border border-amber-700/70 bg-amber-950/30 px-2.5 py-2 text-amber-300 flex items-center justify-between hover:bg-amber-900/40"
            >
              <span className="flex items-center gap-1">
                <Crown className="h-3 w-3 text-amber-400" />
                Founder
              </span>
              <ArrowUpRight className="h-3 w-3 text-amber-400" />
            </Link>
          )}
        </div>

        {/* One-tap Founder Recovery when testing downgraded T1-T4 tiers */}
        {canRestoreFounder && !isFounder && (
          <div className="pt-1 space-y-1.5">
            <button
              type="button"
              disabled={restoring}
              onClick={handleQuickRestoreFounder}
              className="w-full rounded-lg border border-amber-700/80 bg-amber-950/50 px-3 py-2 text-[11px] font-bold text-amber-200 hover:bg-amber-900/50 flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {restoring ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Crown className="h-3.5 w-3.5 text-amber-400" />
              )}
              <span>Restore Founder Clearance</span>
            </button>
            {restoreError && (
              <p className="text-[10px] text-rose-400">{restoreError}</p>
            )}
          </div>
        )}
      </div>

      {/* Hardware Passkey Enrollment */}
      <PasskeyEnrollmentCard />

      {/* Log Out Action */}
      <button
        type="button"
        onClick={handleLogout}
        className="w-full rounded-xl border border-rose-800/80 bg-rose-950/40 px-3 py-2.5 text-xs font-bold text-rose-300 hover:bg-rose-900/50 flex items-center justify-center gap-2 cursor-pointer"
      >
        <LogOut className="h-3.5 w-3.5" />
        <span>Log Out</span>
      </button>
    </section>
  );
}