// Location: app/demo/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Crown,
  GraduationCap,
  Layers,
  Lock,
  RotateCcw,
  Scale,
  Server,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  GOVERNANCE_TIER_META,
  normalizeTierLevel,
} from "@/app/lib/governance/tierRbac";

const DEMO_SECTORS = [
  {
    step: 0,
    code: "01",
    title: "E-Network Market & PPP",
    subtitle: "Non-custodial P2P storefronts & native Pi checkout",
    href: "/dashboard/marketplace",
    icon: ShoppingBag,
    accent: "text-cyan-400 border-cyan-800/70 bg-cyan-950/30",
  },
  {
    step: 1,
    code: "02",
    title: "48h Timelocked Escrow",
    subtitle: "Soroban Protocol 28 vaults & 5-Elder VRF disputes",
    href: "/mesh/escrow",
    icon: Lock,
    accent: "text-emerald-400 border-emerald-800/70 bg-emerald-950/30",
  },
  {
    step: 2,
    code: "03",
    title: "Staking & Genesis LP Vault",
    subtitle: "1 PI : 1,000 mBZR peg & 70/30 epoch fee splits",
    href: "/dashboard",
    icon: Wallet,
    accent: "text-amber-400 border-amber-800/70 bg-amber-950/30",
  },
  {
    step: 3,
    code: "04",
    title: "MESH Academy (Open)",
    subtitle: "Transparent community curriculum & 4-gate onboarding",
    href: "/academy",
    icon: GraduationCap,
    accent: "text-sky-400 border-sky-800/70 bg-sky-950/30",
  },
  {
    step: 4,
    code: "05",
    title: "Genesis DAO & 5 Chambers",
    subtitle: "Multi-tier proposals, quorums & Elder adjudication",
    href: "/governance",
    icon: Scale,
    accent: "text-purple-400 border-purple-800/70 bg-purple-950/30",
  },
  {
    step: 5,
    code: "06",
    title: "SoloHost DePIN Node",
    subtitle: "Sandboxed local container & 92% Uptime Shield",
    href: "/mesh/node",
    icon: Server,
    accent: "text-teal-400 border-teal-800/70 bg-teal-950/30",
  },
];

const STORAGE_KEY = "bazaar_demo_step";

export default function DemoShowcaseHomepage() {
  const router = useRouter();
  const { pioneer, isFounder } = useAuth();
  const tierLevel = normalizeTierLevel(pioneer?.tier ?? 1);
  const tierMeta = GOVERNANCE_TIER_META[tierLevel];

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [visitedSteps, setVisitedSteps] = useState<number[]>([0]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.sessionStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      const parsed = Number(saved);
      if (!Number.isNaN(parsed) && parsed >= 0 && parsed < DEMO_SECTORS.length) {
        setActiveIndex(parsed);
      }
    }
  }, []);

  const selectStep = (index: number) => {
    const clamped = Math.max(0, Math.min(DEMO_SECTORS.length - 1, index));
    setActiveIndex(clamped);
    setVisitedSteps((prev) => (prev.includes(clamped) ? prev : [...prev, clamped]));
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(STORAGE_KEY, String(clamped));
    }
  };

  const handleResetTour = () => {
    setActiveIndex(0);
    setVisitedSteps([0]);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(STORAGE_KEY, "0");
    }
  };

  const currentSector = DEMO_SECTORS[activeIndex];

  return (
    <main className="w-full max-w-[384px] mx-auto min-h-dvh bg-[#020617] text-slate-100 p-4 pb-24 font-mono space-y-4 overflow-x-hidden">
      {/* Top Status Strip */}
      <header className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-slate-100">
              Bazaar Republic
            </div>
            <div className="text-[10px] text-slate-400">
              Guided Demo Flow • {activeIndex + 1}/{DEMO_SECTORS.length}
            </div>
          </div>
        </div>
        <span
          className={`rounded border px-2 py-0.5 text-[9px] font-bold ${tierMeta.badgeClass}`}
        >
          {tierMeta.shortLabel}
        </span>
      </header>

      {/* Hero Card */}
      <section className="rounded-2xl border border-cyan-900/60 bg-linear-to-b from-slate-900/90 to-slate-950 p-4 space-y-3 shadow-xl">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-700/60 bg-amber-950/40 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
          <Sparkles className="h-3 w-3" />
          <span>PI NETWORK + SOROBAN L2 MESH</span>
        </div>

        <h1 className="text-base font-bold leading-snug text-white">
          Non-Custodial P2P Commerce, Escrow & Sovereign DAO Governance
        </h1>

        <p className="text-[11px] leading-relaxed text-slate-400">
          Controlled walkthrough controller linking marketplace commerce, 48h
          escrow, staking vaults, open Academy modules, DAO governance, and
          SoloHost telemetry.
        </p>

        {/* Active Step Controller */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 space-y-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-cyan-400 font-bold">
              ACTIVE STAGE: {currentSector.code}
            </span>
            <button
              type="button"
              onClick={handleResetTour}
              className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          </div>

          <div className="text-xs font-bold text-white">
            {currentSector.title}
          </div>
          <div className="text-[10px] text-slate-400">
            {currentSector.subtitle}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => selectStep(activeIndex - 1)}
              disabled={activeIndex === 0}
              className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-[10px] text-slate-300 disabled:opacity-40 flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Prev</span>
            </button>

            <button
              type="button"
              onClick={() => {
                selectStep(activeIndex);
                router.push(currentSector.href);
              }}
              className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-2 px-3 text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Open {currentSector.code}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => selectStep(activeIndex + 1)}
              disabled={activeIndex === DEMO_SECTORS.length - 1}
              className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-[10px] text-slate-300 disabled:opacity-40 flex items-center gap-1"
            >
              <span>Next</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </section>

      {/* Active Session Strip */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 flex items-center justify-between text-[10px]">
        <div className="space-y-0.5 min-w-0">
          <div className="text-slate-400 flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>
              Pioneer:{" "}
              <strong className="text-slate-200">
                {pioneer?.username || "Guest Observer"}
              </strong>
            </span>
          </div>
          <div className="text-slate-500 truncate">
            Role: {pioneer?.role || "NONE"} • Status: {pioneer?.status || "SYNCING"}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href="/menu"
            className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-[10px] text-slate-300"
          >
            Menu
          </Link>
          {isFounder && (
            <Link
              href="/founder"
              className="rounded-lg border border-amber-700/70 bg-amber-950/40 px-2 py-1.5 text-[10px] font-bold text-amber-300 flex items-center gap-1"
            >
              <Crown className="h-3 w-3 text-amber-400" />
              <span>Founder</span>
            </Link>
          )}
        </div>
      </section>

      {/* 6-Step Guided Walkthrough List */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-cyan-400" />
            <span>Walkthrough Sequence</span>
          </h2>
          <Link
            href="/academy"
            className="text-[10px] text-cyan-400 flex items-center gap-1"
          >
            <BookOpen className="h-3 w-3" />
            <span>Academy</span>
          </Link>
        </div>

        <div className="space-y-2">
          {DEMO_SECTORS.map((sector) => {
            const Icon = sector.icon;
            const isCurrent = sector.step === activeIndex;
            const isVisited = visitedSteps.includes(sector.step);

            return (
              <div
                key={sector.code}
                className={`rounded-xl border p-3 transition-colors ${
                  isCurrent
                    ? "border-cyan-500/80 bg-slate-900"
                    : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between gap-2.5">
                  <button
                    type="button"
                    onClick={() => selectStep(sector.step)}
                    className="flex items-center gap-2.5 min-w-0 text-left flex-1"
                  >
                    <div
                      className={`h-8 w-8 rounded-lg border flex items-center justify-center shrink-0 ${sector.accent}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                        <span>STEP {sector.code}</span>
                        {isVisited && (
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        )}
                      </div>
                      <div className="text-xs font-bold text-slate-100 truncate">
                        {sector.title}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {sector.subtitle}
                      </div>
                    </div>
                  </button>

                  <Link
                    href={sector.href}
                    onClick={() => selectStep(sector.step)}
                    className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-[10px] font-bold text-cyan-300 hover:border-cyan-600 shrink-0"
                  >
                    Go →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer Compliance & Transparency */}
      <footer className="border-t border-slate-800/80 pt-3 flex items-center justify-between text-[10px] text-slate-500">
        <span>PinoyQ8/bazaar-republic-alpha</span>
        <div className="flex items-center gap-3">
          <Link href="/privacy" className="text-emerald-400 underline">
            Privacy
          </Link>
          <Link href="/terms" className="text-emerald-400 underline">
            Terms
          </Link>
        </div>
      </footer>
    </main>
  );
}