"use client";

import React, { useEffect, useState } from "react";
import { Crown, RotateCcw, Save, ShieldCheck } from "lucide-react";
import { useAuth, NodeTier } from "@/context/AuthContext";

const TIER_CHOICES: Array<{ value: NodeTier; label: string; desc: string }> = [
  {
    value: "CITIZEN",
    label: "Tier 1 • CITIZEN",
    desc: "Baseline consumer & mutual-aid access",
  },
  {
    value: "NOVICE",
    label: "Tier 2 • NOVICE",
    desc: "Module 01 cleared • Merchant/escrow entry",
  },
  {
    value: "ACADEMY_CORE",
    label: "Tier 3 • ACADEMY_CORE",
    desc: "Modules 01–02 • Staking & liquidity vault actions",
  },
  {
    value: "MESH_GUARDIAN",
    label: "Tier 4 • MESH_GUARDIAN",
    desc: "SoloHost validator, RPC relays & node pulse controls",
  },
  {
    value: "BAZAAR_FOUNDER",
    label: "Tier 5 / Chamber 1 • BAZAAR_FOUNDER",
    desc: "Full Founder oversight, Hold & Modify & emergency freeze",
  },
];

const ROLE_CHOICES: Array<{ value: string; label: string }> = [
  { value: "BAZAAR_FOUNDER", label: "BAZAAR_FOUNDER (Chamber 1: Founder)" },
  { value: "GENESIS_ELDER", label: "GENESIS_ELDER (Chamber 2: Genesis 100)" },
  { value: "MERCHANT", label: "MERCHANT (Chamber 3: Merchant)" },
  {
    value: "MESH_VALIDATOR",
    label: "MESH_VALIDATOR (Chamber 4: Service Provider)",
  },
  { value: "PIONEER", label: "PIONEER (Chamber 5: Citizen)" },
  { value: "NONE", label: "NONE (Unassigned Role Lock Test)" },
];

export default function FounderAccountSettingsCard() {
  const { pioneer, login } = useAuth();

  const [selectedTier, setSelectedTier] = useState<NodeTier>(
    pioneer?.tier || "BAZAAR_FOUNDER"
  );
  const [selectedRole, setSelectedRole] = useState<string>(
    pioneer?.role || "BAZAAR_FOUNDER"
  );
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (pioneer?.tier) setSelectedTier(pioneer.tier);
    if (pioneer?.role) setSelectedRole(pioneer.role);
  }, [pioneer?.tier, pioneer?.role]);

  const applyAccountRole = async (tierToApply: NodeTier, roleToApply: string) => {
    const activeUid =
      pioneer?.uid || "5f747bc9-1302-4135-a40d-af7880174f16";

    setSaving(true);
    setErrorMsg(null);
    setStatusMsg(null);

    try {
      const res = await fetch("/api/founder/account-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: activeUid,
          username: pioneer?.username || "PinoyQ8",
          tier: tierToApply,
          role: roleToApply,
        }),
      });

      const data = await res.json();
      if (!res.ok || data?.success === false) {
        throw new Error(data?.error || `Failed (${res.status})`);
      }

      login({
        uid: activeUid,
        username: pioneer?.username || "PinoyQ8",
        tier: tierToApply,
        role: roleToApply,
        status: "ACTIVE",
        trustScore: pioneer?.trustScore ?? 100,
      });

      setSelectedTier(tierToApply);
      setSelectedRole(roleToApply);
      setStatusMsg(`Synced DB & session to ${tierToApply} (${roleToApply}).`);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to update account role."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-amber-700/60 bg-zinc-950 p-4 text-zinc-100 font-mono space-y-3.5">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
        <div className="flex items-center gap-1.5">
          <Crown size={14} className="text-amber-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-300">
            Founder Account Tier & Role
          </h2>
        </div>
        <span className="rounded border border-amber-700/60 bg-amber-950/40 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
          LIVE DB + SESSION
        </span>
      </div>

      <p className="text-[10px] text-zinc-400 leading-relaxed">
        Switch your active <span className="text-zinc-200">PioneerNode</span>{" "}
        tier and chamber role in <span className="text-zinc-200">bzr-db</span>{" "}
        to test both UI gates and backend API enforcement end-to-end.
      </p>

      <div className="space-y-1">
        <label className="block text-[10px] uppercase tracking-wider text-zinc-400">
          Account Tier Level
        </label>
        <select
          value={selectedTier}
          onChange={(e) => setSelectedTier(e.target.value as NodeTier)}
          disabled={saving}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-2 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none"
        >
          {TIER_CHOICES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <span className="block text-[10px] text-zinc-500">
          {TIER_CHOICES.find((t) => t.value === selectedTier)?.desc}
        </span>
      </div>

      <div className="space-y-1">
        <label className="block text-[10px] uppercase tracking-wider text-zinc-400">
          Chamber & Access Role
        </label>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          disabled={saving}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-2 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none"
        >
          {ROLE_CHOICES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {errorMsg && (
        <div className="rounded-lg border border-red-800/80 bg-red-950/50 px-3 py-2 text-[11px] text-red-200">
          {errorMsg}
        </div>
      )}

      {statusMsg && (
        <div className="rounded-lg border border-emerald-800/80 bg-emerald-950/40 px-3 py-2 text-[11px] text-emerald-200 flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          disabled={saving}
          onClick={() => void applyAccountRole(selectedTier, selectedRole)}
          className="rounded-lg bg-amber-400 py-2 px-3 text-xs font-bold text-zinc-950 hover:bg-amber-300 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Save size={12} />
          <span>{saving ? "Syncing..." : "Apply Role"}</span>
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={() =>
            void applyAccountRole("BAZAAR_FOUNDER", "BAZAAR_FOUNDER")
          }
          className="rounded-lg border border-zinc-700 bg-zinc-900 py-2 px-3 text-xs font-bold text-zinc-200 hover:bg-zinc-800 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <RotateCcw size={12} />
          <span>Restore Founder</span>
        </button>
      </div>
    </section>
  );
}
