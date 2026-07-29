"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Home, GraduationCap, Activity, FileText, Database } from "lucide-react";

export default function MeshMobileNav() {
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);

  // Helper to check if a route is active
  const isActive = (path: string) => pathname?.startsWith(path);

  return (
    <>
      {/* 🛡️ THE COMMAND DRAWER (Overlay) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-40 flex flex-col bg-neutral-950/95 backdrop-blur-xl animate-in fade-in pb-20 pt-10 px-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-8 border-b border-neutral-800 pb-4">
            <span className="font-mono text-sm font-black text-amber-500 tracking-widest uppercase">
              Command Center
            </span>
            <button onClick={toggleDrawer} className="text-neutral-400 hover:text-white">
              <X size={28} />
            </button>
          </div>

          <div className="flex flex-col gap-6">
            {/* Academy Deep Links */}
            <div className="space-y-3">
              <h3 className="font-mono text-[10px] text-neutral-500 tracking-widest uppercase">Academy Modules</h3>
              <Link onClick={toggleDrawer} href="/academy/module-01" className="flex items-center gap-3 text-neutral-300 hover:text-emerald-400 font-mono text-sm">
                <FileText size={16} /> Module 01: Protocol Basics
              </Link>
              <Link onClick={toggleDrawer} href="/academy/module-02" className="flex items-center gap-3 text-neutral-300 hover:text-emerald-400 font-mono text-sm">
                <FileText size={16} /> Module 02: Node Deployment
              </Link>
              <Link onClick={toggleDrawer} href="/academy/module-03" className="flex items-center gap-3 text-neutral-300 hover:text-emerald-400 font-mono text-sm">
                <FileText size={16} /> Module 03: DAO Quorum
              </Link>
              <Link onClick={toggleDrawer} href="/academy/dao-architecture" className="flex items-center gap-3 text-neutral-300 hover:text-amber-400 font-mono text-sm mt-2">
                <Database size={16} /> DAO Architecture Logic
              </Link>
            </div>

            {/* Dashboard Deep Links */}
            <div className="space-y-3 pt-4 border-t border-neutral-900">
              <h3 className="font-mono text-[10px] text-neutral-500 tracking-widest uppercase">DAO Governance</h3>
              <Link onClick={toggleDrawer} href="/dashboard/proposals" className="flex items-center gap-3 text-neutral-300 hover:text-emerald-400 font-mono text-sm">
                <Activity size={16} /> Active Proposals
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 🛡️ THE BOTTOM NAVIGATION BAR (S23 Viewport Anchored) */}
      <nav className="fixed bottom-0 w-full z-50 border-t border-neutral-900 bg-neutral-950/90 backdrop-blur-md shadow-[0_-4px_30px_rgba(0,0,0,0.8)] pb-safe">
        <div className="flex justify-between items-center max-w-md mx-auto px-6 py-3">
          
          <Link href="/dashboard" className={`flex flex-col items-center gap-1 ${isActive("/dashboard") && !isActive("/dashboard/network") ? "text-amber-500" : "text-neutral-500 hover:text-neutral-300"}`}>
            <Home size={22} />
            <span className="font-mono text-[9px] tracking-wider uppercase">Vault</span>
          </Link>

          <Link href="/academy" className={`flex flex-col items-center gap-1 ${isActive("/academy") ? "text-emerald-500" : "text-neutral-500 hover:text-neutral-300"}`}>
            <GraduationCap size={22} />
            <span className="font-mono text-[9px] tracking-wider uppercase">Academy</span>
          </Link>

          <Link href="/dashboard/network" className={`flex flex-col items-center gap-1 ${isActive("/dashboard/network") ? "text-emerald-500" : "text-neutral-500 hover:text-neutral-300"}`}>
            <Activity size={22} />
            <span className="font-mono text-[9px] tracking-wider uppercase">Network</span>
          </Link>

          <button onClick={toggleDrawer} className={`flex flex-col items-center gap-1 ${isDrawerOpen ? "text-white" : "text-neutral-500 hover:text-neutral-300"}`}>
            <Menu size={22} />
            <span className="font-mono text-[9px] tracking-wider uppercase">Menu</span>
          </button>

        </div>
      </nav>
    </>
  );
}