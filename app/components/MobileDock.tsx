"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext"; // 🛡️ IDENTITY UPLINK

export default function MobileDock() {
  const pathname = usePathname();
  
  // 🛡️ PULL ACTIVE IDENTITY STATE
  const context = useAuth() as any;
  const pioneer = context?.pioneer;
  const isHydrated = context?.isHydrated;

  // The immutable routing matrix
  const navItems = [
    { label: "[ 📜 ACADEMY ]", path: "/academy" },
    { label: "[ 🎛️ COMMAND ]", path: "/dashboard" },
    { label: "[ 🏦 VAULT ]", path: "/vault" }
  ];

  // 🛡️ SECURITY SHIELD: Lock dock if Handshake is pending or state is hydrating
  const isLocked = !isHydrated || !pioneer?.isAuthenticated;

  return (
    /* 🛡️ S23 VIEWPORT LOCK: max-w-[384px] centered with translation to align with main layout */
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[384px] bg-zinc-950 border-t border-zinc-800 z-50 md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.7)]">
      <div className="flex justify-around items-center p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          
          if (isLocked) {
            // INERT STATE: Handshake not complete. Routing physically bypassed.
            return (
              <span 
                key={item.path} 
                className="text-xs font-mono font-bold tracking-widest text-zinc-700 cursor-not-allowed opacity-50 select-none"
              >
                {item.label}
              </span>
            );
          }

          // ACTIVE STATE: Handshake verified.
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`text-xs font-mono font-bold tracking-widest transition-colors ${
                isActive 
                  ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" 
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}