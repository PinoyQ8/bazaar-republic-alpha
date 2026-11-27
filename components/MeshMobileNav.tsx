// Location: components/MeshMobileNav.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Store,
  ShieldCheck,
  Coins,
  GraduationCap,
  Landmark,
  Menu,
  Crown,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  GovernanceSubSectionKey,
  GovernanceTierLevel,
  isFounderSubject,
  normalizeTierLevel,
} from "@/app/lib/governance/tierRbac";

export interface MeshMobileNavItem {
  key: "market" | "escrow" | "staking" | "academy" | "genesis" | "founder" | "menu";
  label: string;
  href: string;
  matchPrefixes?: string[];
  description: string;
  subSectionKey: GovernanceSubSectionKey;
  minTier?: GovernanceTierLevel;
  founderOnly?: boolean;
  icon: (active: boolean) => React.ReactNode;
}

export interface MeshMobileNavProps {
  governanceTier?: GovernanceTierLevel | string;
  hasRole?: boolean;
  isFounder?: boolean;
  role?: string;
  showActiveContextBar?: boolean;
}

export const MESH_NAV_ITEMS: MeshMobileNavItem[] = [
  {
    key: "market",
    label: "Market",
    href: "/dashboard/marketplace",
    matchPrefixes: ["/dashboard/marketplace", "/marketplace"],
    description: "Public catalog & commerce (Inventory locked until Role + Tier 2+)",
    subSectionKey: "MARKET_CATALOG",
    minTier: 1,
    icon: (active) => (
      <Store className={`h-4 w-4 ${active ? "text-cyan-400" : "text-zinc-400"}`} />
    ),
  },
  {
    key: "escrow",
    label: "Escrow",
    href: "/mesh/escrow",
    matchPrefixes: ["/mesh/escrow", "/escrow"],
    description: "Soroban escrow locks, release/refund settlement & dispute flow",
    subSectionKey: "ESCROW_VIEW",
    minTier: 1,
    icon: (active) => (
      <ShieldCheck className={`h-4 w-4 ${active ? "text-cyan-400" : "text-zinc-400"}`} />
    ),
  },
  {
    key: "staking",
    label: "Staking",
    href: "/dashboard",
    matchPrefixes: ["/dashboard"],
    description: "1,000 Pi Genesis LP Vault, epoch fees & validator telemetry (Vault T3+)",
    subSectionKey: "STAKING_METRICS",
    minTier: 1,
    icon: (active) => (
      <Coins className={`h-4 w-4 ${active ? "text-emerald-400" : "text-zinc-400"}`} />
    ),
  },
  {
    key: "academy",
    label: "Academy",
    href: "/academy",
    matchPrefixes: ["/academy"],
    description: "Onboarding modules, DAO tracks & passport tier progression",
    subSectionKey: "ACADEMY_MODULES",
    minTier: 1,
    icon: (active) => (
      <GraduationCap className={`h-4 w-4 ${active ? "text-cyan-400" : "text-zinc-400"}`} />
    ),
  },
  {
    key: "genesis",
    label: "Genesis",
    href: "/governance",
    matchPrefixes: ["/governance"],
    description: "Two-stage chamber proposals, quorum & Elder governance",
    subSectionKey: "GOVERNANCE_VIEW",
    minTier: 1,
    icon: (active) => (
      <Landmark className={`h-4 w-4 ${active ? "text-indigo-400" : "text-zinc-400"}`} />
    ),
  },
  {
    key: "founder",
    label: "Founder",
    href: "/founder",
    matchPrefixes: ["/founder"],
    description: "72h Hold & Modify veto, emergency freezes & heir succession",
    subSectionKey: "FOUNDER_CONSOLE",
    founderOnly: true,
    icon: (active) => (
      <Crown className={`h-4 w-4 ${active ? "text-amber-400" : "text-amber-500/80"}`} />
    ),
  },
  {
    key: "menu",
    label: "Menu",
    href: "/menu",
    matchPrefixes: ["/menu"],
    description: "Pioneer session info, passkeys & secondary protocol links",
    subSectionKey: "GOVERNANCE_VIEW",
    minTier: 1,
    icon: (active) => (
      <Menu className={`h-4 w-4 ${active ? "text-cyan-400" : "text-zinc-400"}`} />
    ),
  },
];

function isItemActive(pathname: string, item: MeshMobileNavItem): boolean {
  if (
    item.key === "staking" &&
    (pathname === "/dashboard/marketplace" ||
      pathname.startsWith("/dashboard/marketplace/"))
  ) {
    return false;
  }

  const prefixes = item.matchPrefixes ?? [item.href];
  return prefixes.some(
    (prefix) =>
      pathname === prefix || (prefix !== "/" && pathname.startsWith(`${prefix}/`))
  );
}

export default function MeshMobileNav({
  governanceTier,
  hasRole,
  isFounder,
  role,
  showActiveContextBar = false,
}: MeshMobileNavProps) {
  const pathname = usePathname();
  const { pioneer, hasActiveRole, isFounder: authIsFounder } = useAuth();

  const effectiveRole = role ?? pioneer?.role;
  const effectiveTier = normalizeTierLevel(governanceTier ?? pioneer?.tier ?? 1);
  void (hasRole ?? hasActiveRole);

  const hasFounderRole =
    isFounder ??
    (role || governanceTier
      ? isFounderSubject({ isFounder, role: effectiveRole ?? String(governanceTier ?? "") })
      : authIsFounder);

  const visibleItems = MESH_NAV_ITEMS.filter((item) => {
    if (item.founderOnly) {
      return hasFounderRole;
    }
    if (item.key === "market") {
      return true;
    }
    const requiredTier = item.minTier ?? 1;
    return effectiveTier >= requiredTier;
  });

  const activeItem = visibleItems.find((item) => isItemActive(pathname, item));

  return (
    <nav
      aria-label="Mesh Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
    >
      <div className="w-full max-w-[384px] bg-slate-950/95 backdrop-blur-md border-t border-slate-900 px-2 pt-1.5 pb-[max(env(safe-area-inset-bottom,0px),24px)] flex flex-col items-stretch pointer-events-auto shadow-2xl">
        {showActiveContextBar && activeItem && (
          <div className="border-b border-zinc-800/70 bg-zinc-900/50 px-2.5 py-1 text-[9px] font-mono text-zinc-400 truncate">
            <strong className="text-cyan-300 uppercase">{activeItem.label}:</strong>{" "}
            {activeItem.description}
          </div>
        )}

        <div className="w-full px-1 py-1 flex items-center justify-between gap-0.5">
          {visibleItems.map((item) => {
            const active = isItemActive(pathname, item);

            return (
              <Link
                key={item.key}
                href={item.href}
                title={`${item.label} — ${item.description}`}
                className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-0.5 rounded-lg transition-colors ${
                  active
                    ? "bg-zinc-900/90 text-zinc-100"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40"
                }`}
              >
                <div className="relative flex items-center justify-center">
                  {item.icon(active)}
                  {item.founderOnly && (
                    <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-amber-400" />
                  )}
                </div>
                <span
                  className={`text-[9px] leading-tight mt-0.5 truncate w-full text-center tracking-tight ${
                    active
                      ? item.founderOnly
                        ? "text-amber-400 font-bold"
                        : "text-cyan-300 font-bold"
                      : item.founderOnly
                        ? "text-amber-500/80 font-medium"
                        : "text-zinc-400 font-medium"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}