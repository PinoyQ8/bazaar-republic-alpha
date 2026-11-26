// Location: components/EscrowConsole.tsx
"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Clock,
  Lock,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  canAccessSubSection,
  GOVERNANCE_TIER_META,
  GovernanceTierLevel,
  normalizeTierLevel,
} from "@/app/lib/governance/tierRbac";

export interface EscrowConsoleProps {
  governanceTier?: GovernanceTierLevel | string;
  hasRole?: boolean;
  hasPassport?: boolean;
  isFrozen?: boolean;
}

interface SampleEscrowRecord {
  id: string;
  counterparty: string;
  amountLabel: string;
  status: "LOCKED" | "RELEASED";
  windowLabel: string;
}

const SAMPLE_ESCROWS: SampleEscrowRecord[] = [
  {
    id: "ESC-7041-BZR",
    counterparty: "GB7X...4QL2 (Merchant)",
    amountLabel: "25.0000000 Pi",
    status: "LOCKED",
    windowLabel: "48h Buyer Protection Window",
  },
  {
    id: "ESC-6988-BZR",
    counterparty: "GC2B...9PO1 (Service Node)",
    amountLabel: "10.0000000 Pi",
    status: "RELEASED",
    windowLabel: "Settled",
  },
];

export default function EscrowConsole({
  governanceTier,
  hasRole,
  hasPassport = true,
  isFrozen = false,
}: EscrowConsoleProps) {
  const { pioneer, hasActiveRole: authHasRole } = useAuth();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const effectiveTier = normalizeTierLevel(governanceTier ?? pioneer?.tier ?? 1);
  const effectiveHasRole = hasRole ?? authHasRole;
  const effectiveFrozen = isFrozen || pioneer?.status === "FROZEN";

  const subject = {
    tier: effectiveTier,
    hasRole: effectiveHasRole,
    hasPassport,
    isFrozen: effectiveFrozen,
  };

  const viewAccess = canAccessSubSection("ESCROW_VIEW", subject);
  const executeAccess = canAccessSubSection("ESCROW_EXECUTE", subject);

  const handleAction = (escrowId: string, actionName: "Release" | "Refund") => {
    if (!executeAccess.allowed) return;
    setStatusMessage(`${actionName} queued for ${escrowId}`);
  };

  return (
    <section className="space-y-3 font-mono text-slate-100">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-cyan-400" />
          <div>
            <h1 className="text-xs font-bold uppercase tracking-wider text-zinc-100">
              Soroban Escrow Vault
            </h1>
            <p className="text-[10px] text-zinc-500">
              {GOVERNANCE_TIER_META[effectiveTier].shortLabel} • Execution:{" "}
              {executeAccess.allowed ? "ENABLED" : "READ-ONLY"}
            </p>
          </div>
        </div>
        <span className="rounded border border-cyan-800/70 bg-cyan-950/60 px-2 py-0.5 text-[9px] font-bold text-cyan-300">
          {viewAccess.allowed ? "LEDGER VISIBLE" : "LOCKED"}
        </span>
      </div>

      {!executeAccess.allowed && (
        <div className="rounded-xl border border-amber-800/70 bg-amber-950/30 p-3 text-[10px] text-amber-200 space-y-1">
          <div className="flex items-center justify-between gap-2 font-bold text-amber-300">
            <span className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-amber-400" />
              Escrow Execution Locked (View-Only Mode)
            </span>
            <span className="rounded border border-amber-700/70 bg-amber-950/80 px-1.5 py-0.5 text-[9px]">
              {executeAccess.requiredTierLabel}
            </span>
          </div>
          <p className="text-zinc-300">
            {executeAccess.reason ??
              "You can inspect escrow records, while release/refund execution requires an active role/passport and Tier 2+."}
          </p>
        </div>
      )}

      {statusMessage && (
        <div className="rounded-lg border border-emerald-800/70 bg-emerald-950/40 px-2.5 py-1.5 text-[11px] text-emerald-300">
          {statusMessage}
        </div>
      )}

      <div className="space-y-2.5">
        {SAMPLE_ESCROWS.map((row) => (
          <div
            key={row.id}
            className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 space-y-2 text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-100">{row.id}</span>
              <span
                className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                  row.status === "LOCKED"
                    ? "bg-amber-950/80 text-amber-300 border border-amber-800/60"
                    : "bg-emerald-950/80 text-emerald-300 border border-emerald-800/60"
                }`}
              >
                {row.status}
              </span>
            </div>

            <div className="text-[10px] text-zinc-400 flex items-center justify-between">
              <span>{row.counterparty}</span>
              <span className="text-cyan-300 font-bold">{row.amountLabel}</span>
            </div>

            <div className="flex items-center justify-between pt-1.5 border-t border-zinc-800/80 text-[10px]">
              <span className="flex items-center gap-1 text-zinc-500">
                <Clock className="h-3 w-3" />
                {row.windowLabel}
              </span>

              {row.status === "LOCKED" && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={!executeAccess.allowed}
                    onClick={() => handleAction(row.id, "Release")}
                    title={
                      executeAccess.allowed ? "Release funds" : executeAccess.reason
                    }
                    className="rounded border border-emerald-700 bg-emerald-950/60 px-2 py-0.5 font-bold text-emerald-300 hover:bg-emerald-900/60 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    {executeAccess.allowed ? "Release" : "Locked"}
                  </button>
                  <button
                    type="button"
                    disabled={!executeAccess.allowed}
                    onClick={() => handleAction(row.id, "Refund")}
                    title={
                      executeAccess.allowed ? "Refund funds" : executeAccess.reason
                    }
                    className="rounded border border-rose-800 bg-rose-950/50 px-2 py-0.5 font-bold text-rose-300 hover:bg-rose-900/60 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="h-3 w-3" />
                    {executeAccess.allowed ? "Refund" : "Locked"}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}