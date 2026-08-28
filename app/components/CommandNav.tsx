"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function CommandNav() {
  const pathname = usePathname();

  // 🛡️ THE ROUTER LOGIC: Determines which sector is currently active
  const isActive = (path: string) => pathname === path || pathname?.startsWith(`${path}/`);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      {/* 🛡️ S23 VIEWPORT LOCK: Mirrors the 384px width of your application */}
      <nav className="w-full max-w-[384px] bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 flex justify-around items-center p-3 pointer-events-auto pb-safe">
        
        {/* BRIDGE 1: HOME/VAULT */}
        <Link href="/" className={`flex flex-col items-center p-2 transition-colors ${isActive("/") && pathname === "/" ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-400"}`}>
          <span className="text-[10px] font-bold uppercase tracking-widest">Hub</span>
        </Link>

        {/* BRIDGE 2: ALPHA TRACK */}
        <Link href="/alpha-track" className={`flex flex-col items-center p-2 transition-colors ${isActive("/alpha-track") ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-400"}`}>
          <span className="text-[10px] font-bold uppercase tracking-widest">Alpha</span>
        </Link>

        {/* BRIDGE 3: MESH ACADEMY */}
        <Link href="/academy" className={`flex flex-col items-center p-2 transition-colors ${isActive("/academy") ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-400"}`}>
          <span className="text-[10px] font-bold uppercase tracking-widest">Academy</span>
        </Link>

      </nav>
    </div>
  );
}