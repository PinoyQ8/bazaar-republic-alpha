// Location: components/MeshMobileNav.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Store,
  GraduationCap,
  Activity,
  ArrowRight,
  Shield,
  CreditCard,
  Package,
  LayoutDashboard,
  Scale,
} from 'lucide-react';

export default function MeshMobileNav() {
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Lock background scroll when the command drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.touchAction = 'auto';
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.touchAction = 'auto';
    };
  }, [isDrawerOpen]);

  const toggleDrawer = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setIsDrawerOpen((prev) => !prev);
  };

  const isActive = (path: string) =>
    pathname === path || (path !== '/dashboard' && pathname?.startsWith(path));

  return (
    <>
      {/* 1. Command Drawer Overlay */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-xl animate-in fade-in pt-6 px-6 pb-[calc(max(env(safe-area-inset-bottom),24px)+6rem)] overflow-y-auto h-dvh">
          {/* Drawer Header */}
          <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-3">
            <span className="font-mono text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
              <Shield size={14} /> MESH COMMAND HUB
            </span>
            <button
              type="button"
              onClick={toggleDrawer}
              className="text-zinc-400 hover:text-white p-2 rounded-lg bg-zinc-900 border border-zinc-800 transition"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex flex-col gap-5 font-mono text-xs">
            {/* Commerce Section */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider px-1">
                Commerce & POS
              </span>
              <div className="grid gap-1.5">
                <Link
                  href="/dashboard/marketplace"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-zinc-200 hover:text-amber-400 flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-2.5">
                    <Store size={15} className="text-amber-400" />
                    <span>Marketplace</span>
                  </div>
                  <ArrowRight size={14} className="text-zinc-600" />
                </Link>

                <Link
                  href="/pos"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-zinc-200 hover:text-amber-400 flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-2.5">
                    <CreditCard size={15} className="text-purple-400" />
                    <span>Merchant POS Terminal</span>
                  </div>
                  <ArrowRight size={14} className="text-zinc-600" />
                </Link>

                <Link
                  href="/orders/TEST_UI_02"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-zinc-200 hover:text-amber-400 flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-2.5">
                    <Package size={15} className="text-blue-400" />
                    <span>Order Vault Tracker</span>
                  </div>
                  <ArrowRight size={14} className="text-zinc-600" />
                </Link>
              </div>
            </div>

            {/* Protocol & Ledger Section */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider px-1">
                Protocol & Governance
              </span>
              <div className="grid gap-1.5">
                <Link
                  href="/mesh/escrow"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-zinc-200 hover:text-cyan-400 flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-2.5">
                    <Activity size={15} className="text-cyan-400" />
                    <span>Soroban Escrow Grid</span>
                  </div>
                  <ArrowRight size={14} className="text-zinc-600" />
                </Link>

                <Link
                  href="/dashboard/assembly"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-zinc-200 hover:text-rose-400 flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-2.5">
                    <Scale size={15} className="text-rose-400" />
                    <span>DAO Assembly Arbitration</span>
                  </div>
                  <ArrowRight size={14} className="text-zinc-600" />
                </Link>

                <Link
                  href="/dashboard"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-zinc-200 hover:text-emerald-400 flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard size={15} className="text-emerald-400" />
                    <span>Node Telemetry Dashboard</span>
                  </div>
                  <ArrowRight size={14} className="text-zinc-600" />
                </Link>
              </div>
            </div>

            {/* Ecosystem & Training */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider px-1">
                Network Education
              </span>
              <Link
                href="/academy"
                onClick={() => setIsDrawerOpen(false)}
                className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-zinc-200 hover:text-emerald-400 flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2.5">
                  <GraduationCap size={15} className="text-emerald-400" />
                  <span>Academy Grid</span>
                </div>
                <ArrowRight size={14} className="text-zinc-600" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 2. Anchored Bottom Bar (S23 Safe-Area & Android Nav Clearance) */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800/90 bg-slate-950/95 backdrop-blur-md shadow-[0_-4px_24px_rgba(0,0,0,0.85)] pb-[max(env(safe-area-inset-bottom),24px)]"
      >
        <div className="flex justify-between items-center max-w-[384px] mx-auto px-5 pt-2.5 pb-1.5">
          {/* Marketplace / Shop */}
          <Link
            href="/dashboard/marketplace"
            onClick={() => setIsDrawerOpen(false)}
            className={`flex-1 flex flex-col items-center gap-1 py-1 transition-colors ${
              isActive('/dashboard/marketplace') && !isDrawerOpen
                ? 'text-amber-400'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Store size={20} />
            <span className="font-mono text-[9px] uppercase tracking-wider">Market</span>
          </Link>

          {/* On-chain Escrow */}
          <Link
            href="/mesh/escrow"
            onClick={() => setIsDrawerOpen(false)}
            className={`flex-1 flex flex-col items-center gap-1 py-1 transition-colors ${
              isActive('/mesh/escrow') && !isDrawerOpen
                ? 'text-cyan-400'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Activity size={20} />
            <span className="font-mono text-[9px] uppercase tracking-wider">Escrow</span>
          </Link>

          {/* Academy */}
          <Link
            href="/academy"
            onClick={() => setIsDrawerOpen(false)}
            className={`flex-1 flex flex-col items-center gap-1 py-1 transition-colors ${
              isActive('/academy') && !isDrawerOpen
                ? 'text-emerald-400'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <GraduationCap size={20} />
            <span className="font-mono text-[9px] uppercase tracking-wider">Academy</span>
          </Link>

          {/* Full Command Drawer Button */}
          <button
            type="button"
            onClick={toggleDrawer}
            className={`flex-1 flex flex-col items-center gap-1 py-1 transition-colors cursor-pointer ${
              isDrawerOpen ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Menu size={20} />
            <span className="font-mono text-[9px] uppercase tracking-wider">Menu</span>
          </button>
        </div>
      </nav>
    </>
  );
}