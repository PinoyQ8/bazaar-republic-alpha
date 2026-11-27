"use client";

import React, { useMemo } from "react";
import { Crown, Lock, ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  canAccessSubSection,
  GOVERNANCE_TIER_META,
  normalizeTierLevel,
} from "@/app/lib/governance/tierRbac";
import HeirSuccessionPanel from "@/components/HeirSuccessionPanel";
import FounderAccountSettingsCard from "@/components/founder/FounderAccountSettingsCard";

export default function FounderPage() {
  const { pioneer, hasActiveRole, isFounder } = useAuth();

  const tierLevel = normalizeTierLevel(pioneer?.tier ?? 1);
  const tierMeta = GOVERNANCE_TIER_META[tierLevel];

  const founderAccess = useMemo(
    () =>
      canAccessSubSection("FOUNDER_CONSOLE", {
        tier: tierLevel,
        hasRole: hasActiveRole,
        hasPassport: Boolean(pioneer?.isAuthenticated),
        isFrozen: pioneer?.status === "FROZEN",
        isFounder,
        role: pioneer?.role ?? pioneer?.tier,
      }),
    [
      tierLevel,
      hasActiveRole,
      pioneer?.isAuthenticated,
      pioneer?.status,
      isFounder,
      pioneer?.role,
      pioneer?.tier,
    ]
  );

  if (!founderAccess.allowed) {
    return (
      <main className="w-full max-w-[384px] mx-auto pb-24 font-mono text-slate-100">
        <div className="rounded-xl border border-rose-900/60 bg-rose-950/20 p-5 text-center space-y-2">
          <Lock className="h-6 w-6 text-rose-400 mx-auto" />
          <h1 className="text-xs font-bold uppercase tracking-widest text-rose-400">
            Founder Clearance Required
          </h1>
          <p className="text-[11px] text-zinc-400">
            {founderAccess.reason ??
              "This sector is restricted to the Founder role."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full max-w-[384px] mx-auto pb-24 space-y-4 font-mono text-slate-100">
      <header className="border-b border-amber-800/60 pb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-amber-400" />
          <h1 className="text-xs font-bold uppercase tracking-wider text-amber-300">
            Founder Command Console
          </h1>
        </div>
        <span className="rounded border border-amber-700/70 bg-amber-950/60 px-2 py-0.5 text-[9px] font-bold text-amber-300">
          {tierMeta.shortLabel} • FOUNDER
        </span>
      </header>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 space-y-1.5 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-amber-300">
          <ShieldAlert className="h-3.5 w-3.5" />
          <span>Constitutional & Emergency Controls</span>
        </div>
        <p className="text-[10px] text-zinc-400 leading-relaxed">
          72-hour Hold & Modify Soft Veto, emergency exploit sanctions, and
          sovereign heir succession continuity.
        </p>
      </div>

      <FounderAccountSettingsCard />

      <HeirSuccessionPanel
        founderAddress={
          pioneer?.publicKey ||
          "GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3"
        }
        isFounder={true}
      />
    </main>
  );
}
