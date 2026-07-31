import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AcademyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 🛡️ THE DOUBLE-LOCK: Server-side Vault Check
  const cookieStore = await cookies();
  const session = cookieStore.get("mesh_session_token");

  if (!session) {
    redirect("/");
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-950 font-mono">
      {/* 🛠️ SECTOR SIDEBAR: Navigation & Progress */}
      <aside className="w-64 border-r border-slate-900 bg-slate-900/30 backdrop-blur-md flex flex-col">
        <div className="p-6 border-b border-slate-900">
          <h2 className="text-xs font-bold text-blue-500 uppercase tracking-widest">Academy Modules</h2>
          <p className="text-[10px] text-slate-500 italic">v23 Mainnet Readiness</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <AcademyLink href="/academy" label="00: Genesis Node" active />
          <AcademyLink href="/academy/module-01" label="01: MESH Protocol" />
          <AcademyLink href="/academy/module-02" label="02: DAO Governance" />
          <AcademyLink href="/academy/module-03" label="03: Soroban Forge" />
          <div className="pt-4 opacity-30">
            <AcademyLink href="#" label="04: Mainnet Sync" disabled />
          </div>
        </nav>

        <div className="p-4 border-t border-slate-900 bg-slate-950/50">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
            <span className="text-[10px] text-slate-300 uppercase">Uptime: 92%</span>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full w-[15%]"></div>
          </div>
        </div>
      </aside>

      {/* 🚀 THE MISSION THEATER */}
      <section className="flex-1 flex flex-col relative overflow-hidden">
        {/* TOP HUD: Status Bar */}
        <header className="h-12 border-b border-slate-900 bg-slate-900/20 flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-slate-500 uppercase">Sector: Academy Alpha</span>
            <span className="text-[10px] text-blue-900 font-bold">//</span>
            <span className="text-[10px] text-slate-300 uppercase font-bold tracking-tighter">Current Mission: Handshake Protocol</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[9px] px-2 py-0.5 rounded border border-blue-900 text-blue-400 font-bold">NODE_ACTIVE</span>
          </div>
        </header>

        {/* CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-8 lg:p-12 relative">
          {/* Background Grid Accent */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>
          
          <div className="max-w-4xl mx-auto relative z-10">
            {children}
          </div>
        </main>
      </section>
    </div>
  );
}

// 🛡️ INTERNAL COMPONENT: Nav Links
function AcademyLink({ href, label, active = false, disabled = false }: { href: string; label: string; active?: boolean; disabled?: boolean }) {
  return (
    <Link 
      href={disabled ? "#" : href}
      className={`block px-4 py-2 text-xs font-mono transition-all border rounded-md ${
        active 
          ? "bg-blue-600/10 border-blue-600/50 text-blue-400 shadow-[inset_0_0_10px_rgba(37,99,235,0.1)]" 
          : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      {label}
    </Link>
  );
}