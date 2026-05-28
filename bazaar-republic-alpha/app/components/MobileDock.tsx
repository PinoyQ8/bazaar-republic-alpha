"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileDock() {
  const pathname = usePathname();

  // The immutable routing matrix
  const navItems = [
    { label: "[ 📜 ACADEMY ]", path: "/academy" },
    { label: "[ 🎛️ COMMAND ]", path: "/dashboard" },
    { label: "[ 🏦 VAULT ]", path: "/vault" }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full bg-zinc-950 border-t border-zinc-800 z-50 md:hidden">
      <div className="flex justify-around items-center p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
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