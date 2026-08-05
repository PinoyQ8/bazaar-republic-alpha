// Location: /app/dashboard/components/BottomNav.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import { Shield, BookOpen, Network, Menu } from "lucide-react";

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { label: "VAULT", path: "/dashboard", icon: Shield },
    { label: "ACADEMY", path: "/dashboard/academy", icon: BookOpen },
    { label: "NETWORK", path: "/dashboard/network", icon: Network },
    { label: "MENU", path: "/dashboard/menu", icon: Menu },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 max-w-[384px] mx-auto bg-slate-950/90 backdrop-blur-md border-t border-cyan-500/20 px-4 py-2 font-mono">
      <div className="grid grid-cols-4 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;

          return (
            <button
              key={item.label}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center justify-center py-1.5 rounded-lg transition-all ${
                isActive 
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/40" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent"
              }`}
            >
              <Icon className="w-4 h-4 mb-1" />
              <span className="text-[9px] font-bold tracking-widest">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}