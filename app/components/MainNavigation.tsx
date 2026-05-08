"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
// 🛡️ MESH UPGRADE: Injecting React State for the Mobile Node
import React, { useState } from "react";
import BazaarLogo from "./BazaarLogo";

export default function MainNavigation() {
  const pathname = usePathname();
  // 🛡️ THE S23 STATE CONTROLLER: Tracks if the mobile menu is active
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "REPUBLIC", path: "/" },
    { name: "ACADEMY", path: "/academy" },
    { name: "GOVERNANCE", path: "/governance" },
  ];

  // 🛡️ TOUCH BYPASS: Closes the menu automatically after a Pioneer clicks a link
  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-blue-900/30 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* 🛡️ LEFT: The Identity Anchor */}
          <Link href="/" className="flex items-center gap-4 group transition-transform active:scale-95" onClick={handleLinkClick}>
            <BazaarLogo size="sm" />
            <span className="font-mono font-bold text-xl tracking-widest text-slate-100 group-hover:text-blue-400 transition-colors">
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
                  className={`font-mono text-sm tracking-widest transition-all ${
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
            {/* 🛡️ NETWORK STATUS: Visible on all devices */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
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
              {/* SVG logic changes from a 'Hamburger' to an 'X' when open */}
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
                  className={`block px-3 py-4 rounded-md font-mono text-base tracking-widest transition-all ${
                    isActive
                      ? "bg-blue-900/20 text-blue-400 border-l-2 border-blue-500"
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            
            {/* Mobile-only network indicator */}
            <div className="sm:hidden mt-4 pt-4 border-t border-slate-800 px-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                  mBZR Testnet Active
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}