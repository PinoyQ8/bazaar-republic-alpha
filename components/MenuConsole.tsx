// Location: components/MenuConsole.tsx
"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PasskeyEnrollmentCard from "@/components/PasskeyEnrollmentCard";
import {
  ArrowUpRight,
  Crown,
  Fingerprint,
  Menu,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  GOVERNANCE_TIER_META,
  normalizeTierLevel,
} from "@/app/lib/governance/tierRbac";

export default function MenuConsole() {
  const router = useRouter();
  const { pioneer, isFounder } = useAuth();

  const tierLevel = normalizeTierLevel(pioneer?.tier ?? 1);
  const tierMeta = GOVERNANCE_TIER_META[tierLevel];

  const handleBiometricLogin = () => {
    router.push("/dashboard");
  };

  const handleClose = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/dashboard");
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
          - Role: <span className="text-cyan-300">{pioneer?.role || "NONE"}</span>
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
      </div>

      {/* Biometric Passkey Enrollment */}
      <PasskeyEnrollmentCard />

      {/* Biometric Log-in & Close Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleBiometricLogin}
          className="w-full rounded-xl border border-cyan-700/80 bg-cyan-950/40 px-3 py-2.5 text-xs font-bold text-cyan-200 hover:bg-cyan-900/50 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Fingerprint className="h-3.5 w-3.5 text-cyan-300" />
          <span>Biometric Log-in</span>
        </button>

        <button
          type="button"
          onClick={handleClose}
          className="w-full rounded-xl border border-zinc-700/90 bg-zinc-900/80 px-3 py-2.5 text-xs font-bold text-zinc-200 hover:bg-zinc-800 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <X className="h-3.5 w-3.5 text-zinc-300" />
          <span>Close</span>
        </button>
      </div>
    </section>
  );
}