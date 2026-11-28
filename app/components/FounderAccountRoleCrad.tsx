// Location: components/FounderAccountRoleCard.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Crown, Lock, RefreshCw, ShieldCheck } from "lucide-react";
import { useAuth, type NodeTier } from "@/app/context/AuthContext";

export default function FounderAccountRoleCard() {
  const {
    pioneer,
    isHydrated,
    syncSessionFromServer,
    switchFounderRole,
  } = useAuth();

  const [selectedTier, setSelectedTier] = useState<NodeTier>("BAZAAR_FOUNDER");
  const [selectedRole, setSelectedRole] = useState<string>("FOUNDER");
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync local dropdowns and AuthContext from bzr-db on mount
  useEffect(() => {
    if (!isHydrated || !pioneer?.uid) return;
    syncSessionFromServer(pioneer.uid).then((synced) => {
      if (synced) {
        setSelectedTier(synced.tier);
        setSelectedRole(synced.role);
      }
    });
  }, [isHydrated, pioneer?.uid, syncSessionFromServer]);

  const handleApplyRole = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      const updated = await switchFounderRole({
        targetTier: selectedTier,
        requestedRole: selectedRole,
        allowDevOverride: process.env.NODE_ENV !== "production",
      });
      setSelectedTier(updated.tier);
      setSelectedRole(updated.role);
      setStatusMsg(`Active state synced: ${updated.tier} (${updated.role})`);
    } catch (err: any) {
      setErrorMsg(err?.message || "ROLE_UPDATE_FAILED");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestoreFounder = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      const restored = await switchFounderRole({
        targetTier: "BAZAAR_FOUNDER",
        requestedRole: "FOUNDER",
        allowDevOverride: process.env.NODE_ENV !== "production",
      });
      setSelectedTier(restored.tier);
      setSelectedRole(restored.role);
      setStatusMsg("Founder clearance restored across bzr-db & session.");
    } catch (err: any) {
      setErrorMsg(err?.message || "RESTORE_FOUNDER_FAILED");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-amber-800/50 bg-zinc-950/90 p-3.5 font-mono text-xs text-slate-100 space-y-3">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <div className="flex items-center gap-1.5 font-bold text-amber-300">
          <Crown className="h-4 w-4 text-amber-400" />
          <span>Founder Account Tier & Role</span>
        </div>
        <span className="rounded border border-emerald-800/60 bg-emerald-950/40 px-2 py-0.5 text-[10px] text-emerald-300">
          LIVE DB + SESSION
        </span>
      </div>

      <p className="text-[11px] text-zinc-400">
        Switch your active PioneerNode tier and chamber role in bzr-db to test both UI gates and backend API enforcement end-to-end.
      </p>

      <div className="space-y-2">
        <label className="block space-y-1 text-[11px] text-zinc-400">
          <span>Account Tier Level</span>
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value as NodeTier)}
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-slate-100"
          >
            <option value="CITIZEN">Tier 1 • CITIZEN</option>
            <option value="NOVICE">Tier 2 • NOVICE</option>
            <option value="ACADEMY_CORE">Tier 3 • ACADEMY_CORE</option>
            <option value="MESH_GUARDIAN">Tier 4 • MESH_GUARDIAN</option>
            <option value="BAZAAR_FOUNDER">Tier 5 / Chamber 1 • BAZAAR_FOUNDER</option>
          </select>
        </label>

        <label className="block space-y-1 text-[11px] text-zinc-400">
          <span>Chamber & Access Role</span>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-slate-100"
          >
            <option value="NONE">NONE (Unassigned Role Lock Test)</option>
            <option value="CITIZEN">CITIZEN (Chamber 5: Citizen)</option>
            <option value="MERCHANT">MERCHANT (Chamber 3: Merchant)</option>
            <option value="SERVICE_PROVIDER">SERVICE_PROVIDER (Chamber 4: Service)</option>
            <option value="GENESIS">GENESIS (Chamber 2: Genesis)</option>
            <option value="FOUNDER">BAZAAR_FOUNDER (Chamber 1: Founder)</option>
          </select>
        </label>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-1.5 rounded border border-rose-800/60 bg-rose-950/40 px-2.5 py-1.5 text-[11px] text-rose-300">
          <Lock className="h-3.5 w-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {statusMsg && (
        <p className="text-[11px] text-emerald-400">{statusMsg}</p>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          disabled={submitting}
          onClick={handleApplyRole}
          className="inline-flex items-center gap-1.5 rounded border border-cyan-700/70 bg-cyan-950/60 px-3 py-1.5 text-[11px] font-bold text-cyan-200 hover:bg-cyan-900/60 disabled:opacity-50"
        >
          {submitting ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ShieldCheck className="h-3.5 w-3.5" />
          )}
          <span>Apply Role</span>
        </button>

        <button
          type="button"
          disabled={submitting}
          onClick={handleRestoreFounder}
          className="inline-flex items-center gap-1.5 rounded border border-amber-700/70 bg-amber-950/60 px-3 py-1.5 text-[11px] font-bold text-amber-200 hover:bg-amber-900/60 disabled:opacity-50"
        >
          <Crown className="h-3.5 w-3.5" />
          <span>Restore Founder</span>
        </button>
      </div>
    </div>
  );
}