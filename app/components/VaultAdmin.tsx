{/* 📊 PI NETWORK BRIDGE MONITOR */}
<div className="mt-4 p-4 bg-slate-900/40 border border-blue-900/30 rounded-xl backdrop-blur-md">
  {/* 🛡️ Header & Status */}
  <div className="flex justify-between items-center mb-3">
    <div className="flex items-center gap-2">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
      </span>
      <span className="text-[10px] font-bold tracking-[0.2em] text-blue-400 uppercase">E-Network Parity</span>
    </div>
    <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-white font-mono uppercase">1:1 Anchor</span>
  </div>

  {/* 🏛️ Parity Logic Display */}
  <div className="grid grid-cols-2 gap-2 mb-4">
    <div className="p-2 bg-black/40 border border-slate-800 rounded">
      <p className="text-[8px] text-slate-500 uppercase">Sovereign Ratio</p>
      <p className="text-[11px] font-bold text-slate-200 font-mono italic">1 BZR : 1 TestPi</p>
    </div>
    <div className="p-2 bg-black/40 border border-slate-800 rounded">
      <p className="text-[8px] text-slate-500 uppercase">Utility Scale</p>
      <p className="text-[11px] font-bold text-blue-500 font-mono italic">1:1000 mBZR</p>
    </div>
  </div>

  {/* 🛡️ Genesis Cap Progress (1B mBZR) */}
  <div className="space-y-1.5">
    <div className="flex justify-between items-end">
      <span className="text-[9px] text-slate-500 uppercase tracking-tighter">Genesis Cap Progress</span>
      <span className="text-[9px] text-blue-400 font-mono">0.001% of 1B</span>
    </div>
    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
      {/* 🛡️ Hard-coded to show 10k minted start (0.001%) */}
      <div className="h-full bg-linear-to-r from-blue-600 to-cyan-400 w-[0.001%]" />
    </div>
    <div className="flex justify-between text-[8px] text-slate-600 uppercase font-mono">
      <span>0 mBZR</span>
      <span>1,000,000,000 mBZR</span>
    </div>
  </div>
</div>