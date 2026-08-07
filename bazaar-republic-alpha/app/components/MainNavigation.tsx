// Location: app/components/MainNavigation.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import BazaarLogo from "./BazaarLogo";
import MasterMeshSwitch from "./MasterMeshSwitch"; // 🛡️ Import the Master Control Grid

export default function MainNavigation() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSwitchOpen, setIsSwitchOpen] = useState(false); // 🎛️ Toggles the control modal/drawer on desktop

  const navLinks = [
    { name: "REPUBLIC", path: "/" },
    { name: "ACADEMY", path: "/academy" },
    { name: "GOVERNANCE", path: "/governance" },
  ];

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
    setIsSwitchOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-blue-900/30 bg-slate-950/80 backdrop-blur-md font-mono">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* 🛡️ LEFT: The Identity Anchor */}
          <Link href="/" className="flex items-center gap-4 group transition-transform active:scale-95" onClick={handleLinkClick}>
            <BazaarLogo size="sm" />
            <span className="font-bold text-xl tracking-widest text-slate-100 group-hover:text-blue-400 transition-colors">
              BAZAAR<span className="text-blue-600">.DAO</span>
            </span>
          </Link>

          {/* 🛡️ DESKTOP SECTOR: Hidden on S23, Visible on X570 */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.path;
              return (
                <Link
                  key={link.name}
                  href={link.path}
                  className={`text-sm tracking-widest transition-all ${
                    isActive 
                      ? "text-blue-400 border-b-2 border-blue-500 pb-1" 
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            {/* 🛡️ DESKTOP CONTROL BUTTON: Toggles the Master Switch Panel */}
            <div className="hidden md:block relative">
              <button
                onClick={() => setIsSwitchOpen(!isSwitchOpen)}
                className="px-3 py-1.5 bg-blue-950/40 border border-blue-800 text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded hover:bg-blue-900/40 transition-colors flex items-center gap-1.5"
              >
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                MESH GRID
              </button>

              {/* Desktop Floating Control Panel */}
              {isSwitchOpen && (
                <div className="absolute right-0 mt-2 z-50">
                  <MasterMeshSwitch />
                </div>
              )}
            </div>

            {/* 🛡️ NETWORK STATUS: Visible on all devices */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] text-slate-400 uppercase tracking-widest">
                mBZR Active
              </span>
            </div>

            {/* 🛡️ THE HAMBURGER ICON: Visible ONLY on S23/Mobile */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-blue-400 hover:bg-slate-900 focus:outline-none transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Open Main Menu</span>
              {!isMobileMenuOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 🛡️ S23 DROPDOWN VAULT: The mobile menu that slides down */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-blue-900/30 bg-slate-950/95 backdrop-blur-xl">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => {
              const isActive = pathname === link.path;
              return (
                <Link
                  key={link.name}
                  href={link.path}
                  onClick={handleLinkClick}
                  className={`block px-3 py-4 rounded-md text-base tracking-widest transition-all ${
                    isActive
                      ? "bg-blue-900/20 text-blue-400 border-l-2 border-blue-500"
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            
            {/* 🎛️ EMBEDDED MASTER MESH SWITCH FOR S23 MOBILE NODES */}
            <div className="mt-4 pt-4 border-t border-slate-800 px-2">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 px-1">Terminal Matrix Controls</p>
              <MasterMeshSwitch />
            </div>

            {/* Mobile-only network indicator */}
            <div className="mt-4 pt-4 border-t border-slate-800 px-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-slate-400 uppercase tracking-widest">
                  mBZR Active Node
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}