import Link from "next/link";

export function Header() {
  return (
    <div className="absolute top-0 left-0 right-0 z-10 px-4 py-4 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-emerald-400 transition-all">
          ←
        </Link>
        <div>
          <h1 className="font-mono text-lg font-bold text-slate-100 uppercase leading-none">E-Network Hub</h1>
          <p className="text-[9px] font-mono text-emerald-500 uppercase mt-1">Provider Ledger Sync</p>
        </div>
      </div>
    </div>
  );
}