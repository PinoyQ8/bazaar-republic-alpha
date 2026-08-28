// Location: components/MeshMobileNav.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Home, GraduationCap, Activity, ArrowRight, Shield } from 'lucide-react';

export default function MeshMobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isDrawerOpen]);

  const toggleDrawer = () => setIsDrawerOpen((prev) => !prev);
  const isActive = (path: string) => pathname === path || (path !== '/dashboard' && pathname?.startsWith(path));

  return (
    <>
      {/* 1. Command Drawer Overlay */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-xl animate-in fade-in pb-24 pt-8 px-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-3">
            <span className="font-mono text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
              <Shield size={14} /> MESH COMMAND
            </span>
            <button
              type="button"
              onClick={toggleDrawer}
              className="text-zinc-400 hover:text-white p-2 rounded-lg bg-zinc-900 border border-zinc-800"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex flex-col gap-2 font-mono text-xs">
            <Link
              href="/dashboard"
              onClick={() => setIsDrawerOpen(false)}
              className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-zinc-200 hover:text-amber-400 flex items-center justify-between"
            >
              <span>Node Dashboard</span>
              <ArrowRight size={14} />
            </Link>
            <Link
              href="/mesh/escrow"
              onClick={() => setIsDrawerOpen(false)}
              className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-zinc-200 hover:text-amber-400 flex items-center justify-between"
            >
              <span>Escrow Vault</span>
              <ArrowRight size={14} />
            </Link>
            <Link
              href="/academy"
              onClick={() => setIsDrawerOpen(false)}
              className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-zinc-200 hover:text-emerald-400 flex items-center justify-between"
            >
              <span>Academy Grid</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* 2. Anchored Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800 bg-slate-950/90 backdrop-blur-md shadow-lg pb-safe">
        <div className="flex justify-between items-center max-w-[384px] mx-auto px-6 py-2.5">
          <Link
            href="/dashboard"
            onClick={() => setIsDrawerOpen(false)}
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive('/dashboard') && !isDrawerOpen ? 'text-amber-400' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Home size={20} />
            <span className="font-mono text-[9px] uppercase tracking-wider">Vault</span>
          </Link>

          <Link
            href="/academy"
            onClick={() => setIsDrawerOpen(false)}
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive('/academy') && !isDrawerOpen ? 'text-emerald-400' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <GraduationCap size={20} />
            <span className="font-mono text-[9px] uppercase tracking-wider">Academy</span>
          </Link>

          <Link
            href="/mesh/escrow"
            onClick={() => setIsDrawerOpen(false)}
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive('/mesh/escrow') && !isDrawerOpen ? 'text-cyan-400' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Activity size={20} />
            <span className="font-mono text-[9px] uppercase tracking-wider">Escrow</span>
          </Link>

          <button
            type="button"
            onClick={toggleDrawer}
            className={`flex flex-col items-center gap-1 transition-colors ${
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
