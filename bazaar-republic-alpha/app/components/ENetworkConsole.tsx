// Location: /app/components/ENetworkConsole.tsx
"use client";

import { useRouter } from "next/navigation";

export default function ENetworkConsole() {
  const router = useRouter();

  return (
    <div className="p-4 bg-neutral-900 border border-amber-900/50 rounded-lg space-y-4 font-mono text-neutral-300">
      <div className="border-b border-amber-900/40 pb-2">
        <h2 className="text-sm font-bold text-amber-500 uppercase tracking-widest">
          E-Network Command Console
        </h2>
        <p className="text-[10px] text-neutral-500">Routing & Terminal Matrix</p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <button
          onClick={() => router.push('/e-network/dashboard')}
          className="w-full py-2 bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 border border-amber-600/50 text-xs font-bold rounded uppercase tracking-wider text-left px-3 flex justify-between items-center"
        >
          <span>Dashboard Sector</span>
          <span className="text-[9px] text-neutral-500">/e-network/dashboard</span>
        </button>

        <button
          onClick={() => router.push('/e-network/adjudicator')}
          className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 text-xs font-bold rounded uppercase tracking-wider text-left px-3 flex justify-between items-center"
        >
          <span>Adjudicator Console</span>
          <span className="text-[9px] text-neutral-500">/e-network/adjudicator</span>
        </button>
      </div>
    </div>
  );
}