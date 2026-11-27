"use client";

import React, { useMemo, useState } from "react";
import { FilePlus2, Lock, Send } from "lucide-react";
import {
  canPerformGovernanceAction,
  GOVERNANCE_TIER_META,
  GovernanceAction,
  GovernanceTierLevel,
  normalizeTierLevel,
} from "@/app/lib/governance/tierRbac";

export type ProposalDomainScope =
  | "CITIZEN_MUTUAL_AID"
  | "MERCHANT_COMMERCE"
  | "LIQUIDITY_VAULT"
  | "INFRA_DEPIN"
  | "CORE_PROTOCOL"
  | "FOUNDER_OVERSIGHT";

interface DomainOption {
  value: ProposalDomainScope;
  label: string;
  chamber:
    | "CITIZEN"
    | "MERCHANT"
    | "SERVICE_PROVIDER"
    | "GENESIS_100"
    | "FOUNDER";
  requiredTier: GovernanceTierLevel;
  action: GovernanceAction;
  defaultParameter: string;
  requiresFounder?: boolean;
}

const DOMAIN_OPTIONS: DomainOption[] = [
  {
    value: "CITIZEN_MUTUAL_AID",
    label: "Citizen & Mutual Aid",
    chamber: "CITIZEN",
    requiredTier: 1,
    action: "CREATE_CITIZEN_PROPOSAL",
    defaultParameter: "MUTUAL_AID_ALLOCATION",
  },
  {
    value: "MERCHANT_COMMERCE",
    label: "Merchant & Commerce",
    chamber: "MERCHANT",
    requiredTier: 2,
    action: "CREATE_MERCHANT_PROPOSAL",
    defaultParameter: "MARKETPLACE_ESCROW_FEE_BPS",
  },
  {
    value: "LIQUIDITY_VAULT",
    label: "Liquidity & Staking Vault",
    chamber: "MERCHANT",
    requiredTier: 3,
    action: "CREATE_LIQUIDITY_PROPOSAL",
    defaultParameter: "STAKER_POL_SPLIT_BPS",
  },
  {
    value: "INFRA_DEPIN",
    label: "DePIN Node & TTL Keepers",
    chamber: "SERVICE_PROVIDER",
    requiredTier: 4,
    action: "CREATE_INFRA_PROPOSAL",
    defaultParameter: "UPTIME_SHIELD_MIN_PCT",
  },
  {
    value: "CORE_PROTOCOL",
    label: "Core Protocol & Genesis 100",
    chamber: "GENESIS_100",
    requiredTier: 5,
    action: "CREATE_CORE_PROPOSAL",
    defaultParameter: "EPOCH_SETTLEMENT_RULES",
  },
  {
    value: "FOUNDER_OVERSIGHT",
    label: "Founder Hold & Constitutional Freeze",
    chamber: "FOUNDER",
    requiredTier: 5,
    action: "EMERGENCY_VETO_FREEZE",
    defaultParameter: "FOUNDER_HOLD_MODIFY_WINDOW_HOURS",
    requiresFounder: true,
  },
];

export interface ProposalSubmissionFormProps {
  governanceTier?: GovernanceTierLevel | number | string;
  proposerUid?: string;
  isFounder?: boolean;
  hasPassport?: boolean;
  isFrozen?: boolean;
  hasRole?: boolean;
  onSubmitted?: (created: unknown) => void;
}

export default function ProposalSubmissionForm({
  governanceTier = 1,
  proposerUid = "",
  isFounder = false,
  hasPassport = true,
  isFrozen = false,
  hasRole = true,
  onSubmitted,
}: ProposalSubmissionFormProps) {
  const tier = normalizeTierLevel(governanceTier);
  const tierMeta = GOVERNANCE_TIER_META[tier];

  const [domain, setDomain] = useState<ProposalDomainScope>("CITIZEN_MUTUAL_AID");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetParameter, setTargetParameter] = useState("MUTUAL_AID_ALLOCATION");
  const [proposedValue, setProposedValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const selectedDomain = useMemo(
    () => DOMAIN_OPTIONS.find((d) => d.value === domain) ?? DOMAIN_OPTIONS[0],
    [domain]
  );

  const permission = useMemo(() => {
    const base = canPerformGovernanceAction(tier, selectedDomain.action, {
      hasPassport,
      isFrozen,
      hasRole,
    });
    if (!base.allowed) return base;
    if (selectedDomain.requiresFounder && !isFounder) {
      return {
        allowed: false,
        reason:
          "Restricted to active BAZAAR_FOUNDER or verified post-succession FOUNDER_DESCENDANT.",
      };
    }
    return base;
  }, [tier, selectedDomain, hasPassport, isFrozen, hasRole, isFounder]);

  const handleDomainChange = (nextDomain: ProposalDomainScope) => {
    setDomain(nextDomain);
    const meta = DOMAIN_OPTIONS.find((d) => d.value === nextDomain);
    if (meta) {
      setTargetParameter(meta.defaultParameter);
    }
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!permission.allowed) {
      setErrorMsg(permission.reason || "Submission blocked by governance RBAC.");
      return;
    }

    if (title.trim().length < 4 || description.trim().length < 10) {
      setErrorMsg("Provide a clear title (4+ chars) and rationale (10+ chars).");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/governance/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          domain: selectedDomain.value,
          assignedChamber: selectedDomain.chamber,
          originTierLevel: tier,
          proposerUid: proposerUid || undefined,
          targetParameter: targetParameter.trim() || null,
          proposedValue: proposedValue.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || data?.success === false) {
        throw new Error(
          data?.message || data?.error || `Proposal rejected (${res.status})`
        );
      }

      setSuccessMsg(
        `Proposal queued (${data?.proposal?.status || "SUBMITTED"}) in ${selectedDomain.chamber} chamber.`
      );
      setTitle("");
      setDescription("");
      setProposedValue("");
      onSubmitted?.(data);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to submit governance proposal."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-zinc-100 font-mono space-y-3.5"
    >
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
        <div className="flex items-center gap-1.5">
          <FilePlus2 size={14} className="text-cyan-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider">
            Submit DAO Proposal
          </h2>
        </div>
        <span
          className={`rounded border px-1.5 py-0.5 text-[9px] font-bold ${tierMeta.badgeClass}`}
        >
          {isFounder ? "FOUNDER" : tierMeta.shortLabel}
        </span>
      </div>

      <div className="space-y-1">
        <label className="block text-[10px] uppercase tracking-wider text-zinc-400">
          Chamber &amp; Domain Scope
        </label>
        <select
          value={domain}
          onChange={(e) => handleDomainChange(e.target.value as ProposalDomainScope)}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-2 text-xs text-zinc-100 focus:border-cyan-500 focus:outline-none"
        >
          {DOMAIN_OPTIONS.map((opt) => {
            const unlocked =
              tier >= opt.requiredTier && (!opt.requiresFounder || isFounder);
            return (
              <option key={opt.value} value={opt.value}>
                {opt.label} [{opt.chamber}] (Req: T{opt.requiredTier}
                {opt.requiresFounder ? " + Founder" : ""}
                {unlocked ? "" : " • LOCKED"})
              </option>
            );
          })}
        </select>
      </div>

      {!permission.allowed && (
        <div className="rounded-lg border border-amber-700/70 bg-amber-950/40 p-2.5 text-[10px] text-amber-200 flex items-start gap-2">
          <Lock size={12} className="shrink-0 mt-0.5 text-amber-400" />
          <span>{permission.reason}</span>
        </div>
      )}

      <div className="space-y-1">
        <label className="block text-[10px] uppercase tracking-wider text-zinc-400">
          Proposal Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Mutual Aid Cap or 72h Hold Review"
          disabled={!permission.allowed || submitting}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-[10px] uppercase tracking-wider text-zinc-400">
          Rationale &amp; Scope
        </label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe parameter impact, chamber quorum, and constitutional safeguards..."
          disabled={!permission.allowed || submitting}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="block text-[10px] uppercase tracking-wider text-zinc-400">
            Target Parameter
          </label>
          <input
            type="text"
            value={targetParameter}
            onChange={(e) => setTargetParameter(e.target.value)}
            disabled={!permission.allowed || submitting}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-[11px] text-zinc-200 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-[10px] uppercase tracking-wider text-zinc-400">
            Proposed Value (Opt.)
          </label>
          <input
            type="text"
            value={proposedValue}
            onChange={(e) => setProposedValue(e.target.value)}
            placeholder="e.g., 5000"
            disabled={!permission.allowed || submitting}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-[11px] text-zinc-200 placeholder:text-zinc-600 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
          />
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-lg border border-red-800/80 bg-red-950/50 px-3 py-2 text-[11px] text-red-200">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="rounded-lg border border-emerald-800/80 bg-emerald-950/40 px-3 py-2 text-[11px] text-emerald-200">
          {successMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={!permission.allowed || submitting}
        className="w-full rounded-lg bg-cyan-500 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 disabled:bg-zinc-800 disabled:text-zinc-500 flex items-center justify-center gap-1.5 transition cursor-pointer disabled:cursor-not-allowed"
      >
        {permission.allowed ? <Send size={12} /> : <Lock size={12} />}
        <span>
          {submitting
            ? "Submitting Proposal..."
            : permission.allowed
              ? `Submit [${selectedDomain.chamber}] Proposal`
              : `Locked (${selectedDomain.chamber})`}
        </span>
      </button>
    </form>
  );
}
