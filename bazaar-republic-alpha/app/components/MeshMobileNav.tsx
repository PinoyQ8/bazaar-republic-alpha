// Location: app/components/MeshMobileNav.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Home, GraduationCap, Activity, FileText, Database, Terminal } from "lucide-react";

export default function MeshMobileNav() {
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // 🛡️ MESH PATCH: Viewport Scroll-Lock Shield
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none"; 
    } else {
      document.body.style.overflow = "unset";
      document.body.style.touchAction = "auto";
    }

    return () => {
      document.body.style.overflow = "unset";
      document.body.style.touchAction = "auto";
    };
  }, [isDrawerOpen]);

  // 🛡️ THE FIX: Separate toggle (for buttons) from close (for Next.js Links)
  const toggleDrawer = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setIsDrawerOpen(!isDrawerOpen);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false); // Pure state change. Does not kill Next.js routing.
  };

  const isActive = (path: string) => pathname?.startsWith(path);

  return (
    <>
      {/* 🛡️ THE COMMAND DRAWER (Overlay) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-40 flex flex-col bg-neutral-950/95 backdrop-blur-xl animate-in fade-in pb-20 pt-10 px-6 overflow-y-auto h-dvh">
          <div className="flex justify-between items-center mb-8 border-b border-neutral-800 pb-4">
            <span className="font-mono text-sm font-black text-amber-500 tracking-widest uppercase">
              Command Center
            </span>
            <button 
              type="button" 
              onClick={toggleDrawer} 
              className="text-neutral-400 hover:text-white transition-colors p-1"
            >
              <X size={28} />
            </button>
          </div>

          <div className="flex flex-col gap-6">
            {/* Academy Deep Links */}
            <div className="space-y-3">
              <h3 className="font-mono text-[10px] text-neutral-500 tracking-widest uppercase">Academy Modules</h3>
              <Link onClick={closeDrawer} href="/academy/module-01" className="flex items-center gap-3 text-neutral-300 hover:text-emerald-400 font-mono text-sm">
                <FileText size={16} /> Module 01: Protocol Basics
              </Link>
              <Link onClick={closeDrawer} href="/academy/module-02" className="flex items-center gap-3 text-neutral-300 hover:text-emerald-400 font-mono text-sm">
                <FileText size={16} /> Module 02: Node Deployment
              </Link>
              <Link onClick={closeDrawer} href="/academy/module-03" className="flex items-center gap-3 text-neutral-300 hover:text-emerald-400 font-mono text-sm">
                <FileText size={16} /> Module 03: DAO Quorum
              </Link>
              <Link onClick={closeDrawer} href="/academy/dao-architecture" className="flex items-center gap-3 text-neutral-300 hover:text-amber-400 font-mono text-sm mt-2">
                <Database size={16} /> Module 04: DAO Architecture Logic
              </Link>
            </div>
            {/* Dashboard Deep Links */}
            <div className="space-y-3 pt-4 border-t border-neutral-900">
              <h3 className="font-mono text-[10px] text-neutral-500 tracking-widest uppercase">DAO Governance</h3>
              <Link onClick={closeDrawer} href="/dashboard/proposals" className="flex items-center gap-3 text-neutral-300 hover:text-emerald-400 font-mono text-sm">
                <Activity size={16} /> Active Proposals
              </Link>
            </div>

            {/* 🛡️ NEO PROTOCOL: MESH-SCAN PAYOUT UPLINK */}
            <div className="space-y-3 pt-4 border-t border-neutral-900">
              <h3 className="font-mono text-[10px] text-green-600 tracking-widest uppercase animate-pulse">System Operations</h3>
              <Link onClick={closeDrawer} href="/mesh-scan" className="flex items-center gap-3 text-green-500 hover:text-green-400 font-mono text-sm font-bold bg-green-950/20 border border-green-900/50 p-2 rounded-sm transition-all active:scale-95">
                <Terminal size={16} /> MESH-SCAN (PAYOUTS)
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 🛡️ THE BOTTOM NAVIGATION BAR (S23 Viewport Anchored) */}
      <nav className="fixed bottom-0 w-full z-50 border-t border-neutral-900 bg-neutral-950/90 backdrop-blur-md shadow-[0_-4px_30px_rgba(0,0,0,0.8)] pb-safe">
        <div className="flex justify-between items-center max-w-md mx-auto px-6 py-3">
          
          <Link href="/dashboard" onClick={closeDrawer} className={`flex flex-col items-center gap-1 ${isActive("/dashboard") && !isActive("/dashboard/network") ? "text-amber-500" : "text-neutral-500 hover:text-neutral-300"}`}>
            <Home size={22} />
            <span className="font-mono text-[9px] tracking-wider uppercase">Vault</span>
          </Link>

          <Link href="/academy" onClick={closeDrawer} className={`flex flex-col items-center gap-1 ${isActive("/academy") ? "text-emerald-500" : "text-neutral-500 hover:text-neutral-300"}`}>
            <GraduationCap size={22} />
            <span className="font-mono text-[9px] tracking-wider uppercase">Academy</span>
          </Link>

          <Link href="/dashboard/network" onClick={closeDrawer} className={`flex flex-col items-center gap-1 ${isActive("/dashboard/network") ? "text-emerald-500" : "text-neutral-500 hover:text-neutral-300"}`}>
            <Activity size={22} />
            <span className="font-mono text-[9px] tracking-wider uppercase">Network</span>
          </Link>

          <button 
            type="button" 
            onClick={toggleDrawer} 
            className={`flex flex-col items-center gap-1 ${isDrawerOpen ? "text-white" : "text-neutral-500 hover:text-neutral-300"}`}
          >
            <Menu size={22} />
            <span className="font-mono text-[9px] tracking-wider uppercase">Menu</span>
          </button>

        </div>
      </nav>
    </>
  );
}