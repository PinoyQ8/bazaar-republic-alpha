// 🛡️ LOCKED RELATIVE ROUTING
import SecurityCircle from "../components/SecurityCircle";
import AttritionLog from "../components/AttritionLog";

export default function RegistryPage() {
  return (
    <main className="min-h-screen bg-black text-slate-200 p-4 pb-20">
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

      {/* 📊 TELEMETRY FOOTER */}
      <div className="fixed bottom-0 left-0 w-full bg-black/80 backdrop-blur-md border-t border-slate-800 z-50">
        <AttritionLog />
      </div>
    </main>
  );
}