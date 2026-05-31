// 🛡️ LOCKED RELATIVE ROUTING
import Link from "next/link";
import SecurityCircle from "../components/SecurityCircle";
import AttritionLog from "../components/AttritionLog";
import NodeMonitor from "@/app/components/mesh/node-monitor";

export default function RegistryPage() {
  return (
    <main className="min-h-screen bg-black text-slate-200 p-4 pb-52"> {/* 🛡️ Note: Padding increased for expanded footer */}
      {/* 🛰️ SECTOR HEADER */}
      <div className="mb-8 pt-6">
        <h1 className="text-xs font-bold tracking-[0.5em] text-blue-500 uppercase mb-2">
          Sector: Genesis Registry
        </h1>
        
        <div className="h-px w-full bg-linear-to-r from-blue-500/50 to-transparent" />
        
        <p className="text-[9px] text-slate-500 mt-4 uppercase leading-relaxed">
          Verify your Security Circle standing to synchronize your node with the Bazaar Republic.
        </p>
      </div>

      {/* 🛡️ ONBOARDING INTERFACE */}
      <SecurityCircle />

      {/* 🟢 LIVE V23 MAINNET TELEMETRY BRIDGE */}
      <div className="mt-8 mb-4">
        <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-2">
          Validated Infrastructure Node
        </div>
        <NodeMonitor />
      </div>

      {/* 📊 TELEMETRY FOOTER & LEGAL LINKS */}
      <div className="fixed bottom-0 left-0 w-full bg-black/80 backdrop-blur-md border-t border-slate-800 z-50">
        <AttritionLog />
        
        {/* 🔗 LEGAL ARCHITECTURE LINKS */}
        <div className="flex justify-center gap-6 py-3 text-[9px] font-mono text-slate-600 uppercase border-t border-slate-800/50">
          <Link href="/terms" className="hover:text-blue-500 transition-colors">Terms of the Republic</Link>
          <Link href="/privacy" className="hover:text-green-500 transition-colors">Privacy Protocol</Link>
        </div>
      </div>
    </main>
  );
}