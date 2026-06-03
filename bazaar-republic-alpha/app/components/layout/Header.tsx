import { Activity, ShieldCheck, Menu } from "lucide-react";

export function Header() {
  return (
    // Absolute positioning locks it to the top of the S23 Viewport wrapper
    <header className="absolute top-0 left-0 w-full z-50 bg-neutral-950/95 backdrop-blur-sm border-b border-amber-500/30 px-4 py-4 font-mono shadow-md">
      
      {/* Top Row: Branding & Navigation Toggle */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center space-x-2">
          <div className="bg-amber-500/10 p-1 rounded border border-amber-500/30">
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <h1 className="text-sm font-bold tracking-widest text-amber-400 uppercase">
            BaZaAr rEpubLiC
          </h1>
        </div>
        <button className="text-neutral-400 hover:text-amber-500 transition-colors focus:outline-none">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom Row: MESH Telemetry & Uptime Shield */}
      <div className="flex justify-between items-center text-[9px] text-neutral-400 uppercase tracking-widest font-bold">
        
        {/* Network Status Ping */}
        <div className="flex items-center space-x-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>MESH ONLINE</span>
        </div>

        {/* Security / Node Metrics */}
        <div className="flex items-center space-x-1.5 bg-neutral-900 border border-neutral-800 px-2 py-1 rounded">
          <ShieldCheck className="w-3 h-3 text-amber-600" />
          <span>UPTIME: 92%</span>
        </div>
        
      </div>
      
    </header>
  );
}