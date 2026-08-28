"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTORS = [
  { name: "Academy", path: "/academy" },
  { name: "Vault", path: "/vault" },
  { name: "Protocol Forge", path: "/forge" },
  { name: "Security", path: "/security" },
  { name: "Governance", path: "/governance" },
  { name: "Treasury", path: "/treasury" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-neutral-800 p-6 flex flex-col justify-between h-screen sticky top-0">
      <div className="space-y-8">
        <h1 className="text-xl font-bold tracking-tighter uppercase text-white">Bazaar Republic</h1>
        <nav className="space-y-2">
          {SECTORS.map((sector) => {
            const isActive = pathname.startsWith(sector.path);
            
            return (
              <Link 
                key={sector.name} 
                href={sector.path}
                className={`block px-4 py-2 text-sm uppercase tracking-widest transition-all border-l-2 
                  ${isActive 
                    ? "bg-neutral-900 border-amber-500 text-white" 
                    : "border-transparent text-neutral-500 hover:text-amber-500 hover:border-neutral-700"
                  }`}
              >
                {sector.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="text-xs text-neutral-600 font-mono">v23.06.06 | MESH-SYNC</div>
    </aside>
  );
}