// app/e-network/dashboard/loading.tsx
export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 p-4 justify-center items-center">
      <div className="animate-pulse space-y-4 w-full max-w-sm">
        <div className="h-12 bg-slate-900 rounded-lg"></div>
        <div className="h-32 bg-slate-900 rounded-xl"></div>
        <div className="h-32 bg-slate-900 rounded-xl"></div>
      </div>
      <p className="mt-4 font-mono text-[10px] text-emerald-500 uppercase tracking-widest animate-pulse">
        Synchronizing Ledger...
      </p>
    </div>
  );
}