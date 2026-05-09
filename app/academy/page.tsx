import AcademyGateway from "../components/AcademyGateway";

export default function AcademyPage() {
  // 🛡️ Simulation: Toggle this to 'false' to test the Titanium Lock Screen.
  const hasBadge = true; 
  const currentPioneer = "Pioneer#1234";

  return (
    <main className="min-h-screen bg-black text-slate-200 p-4 pb-20">
      <div className="mb-8 pt-6">
        <h1 className="text-xs font-bold tracking-[0.5em] text-blue-500 uppercase mb-2">
          Sector: MESH Academy
        </h1>
        <div className="h-px w-full bg-linear-to-r from-blue-500/50 to-transparent" />
      </div>

      {/* 🛡️ THE FIREWALL */}
      <AcademyGateway isVerified={hasBadge} pioneerUid={currentPioneer}>
        
        {/* 📚 Internal Knowledge Forge */}
        <div className="space-y-4">
          <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl">
            <h3 className="text-[10px] font-bold text-white uppercase tracking-widest mb-2">Module 01: Node Security</h3>
            <p className="text-[9px] text-slate-500 uppercase leading-relaxed mb-4">
              Hard-coding the minimum viable security parameters for your local workstation.
            </p>
            <button className="w-full py-3 bg-blue-600/10 border border-blue-500 text-blue-400 text-[9px] font-bold uppercase tracking-widest rounded-xl hover:bg-blue-600 hover:text-white transition-all">
              Initialize Module
            </button>
          </div>

          <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl opacity-50">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Module 02: Sovereign Yield</h3>
            <p className="text-[9px] text-slate-600 uppercase leading-relaxed mb-4">
              Understanding Exit-Burn mechanics and Treasury absorption.
            </p>
            <button disabled className="w-full py-3 border border-slate-800 text-slate-600 text-[9px] font-bold uppercase tracking-widest rounded-xl">
              Requires Mod 01
            </button>
          </div>
        </div>

      </AcademyGateway>
    </main>
  );
}