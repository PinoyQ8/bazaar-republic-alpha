// components/mesh-scan/TelemetryHeader.tsx
import { ShieldCheck, Activity } from 'lucide-react';

export default function TelemetryHeader() {
  return (
    <header className="w-full flex flex-col bg-zinc-950 border-b border-emerald-900/50 px-4 py-3 shadow-sm">
      {/* Top Row: System Identity */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-emerald-500" />
          <h1 className="text-sm font-bold text-zinc-100 tracking-wider uppercase">
            Command Center
          </h1>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-900/30 px-2 py-0.5 rounded border border-emerald-800">
          Uptime: 91.59%
        </span>
      </div>

      {/* Bottom Row: MESH Telemetry */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800 w-full">
        <div className="flex items-center space-x-1.5 text-zinc-400">
          <Activity className="w-3.5 h-3.5" />
          <span className="text-[11px] font-mono uppercase tracking-widest">
            Protocol 26.1
          </span>
        </div>
        <div className="flex items-center space-x-1.5">
          {/* Pulsing indicator for active Sync */}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-mono text-zinc-300">
            SYNCED
          </span>
        </div>
      </div>
    </header>
  );
}