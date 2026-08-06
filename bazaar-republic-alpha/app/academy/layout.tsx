// Location: app/academy/layout.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AcademyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ☢️ NUCLEAR SERVER-SIDE BYPASS FOR X570 WORKSTATION
  const isLocalDev = process.env.NODE_ENV === 'development';

  if (!isLocalDev) {
    // 🛡️ THE DOUBLE-LOCK: Server-side Vault Check (Executes ONLY in Vercel/Production)
    const cookieStore = await cookies();
    const session = cookieStore.get("mesh_session_token");

    if (!session) {
      redirect("/");
    }
  }

  return (
    // 🚨 CRITICAL FIX: Removed "flex" to prevent side-by-side row crushing
    <div className="min-h-screen bg-slate-950 font-mono">
      
      {/* 🚀 THE MISSION THEATER (100% Mobile Width) */}
      <section className="flex flex-col relative w-full min-h-screen">
        
        {/* TOP HUD: Status Bar */}
        <header className="h-12 border-b border-slate-900 bg-slate-900/20 flex items-center justify-between px-4 sticky top-0 z-50 backdrop-blur-md">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-[10px] text-slate-500 uppercase shrink-0">Sector: Alpha</span>
            <span className="text-[10px] text-blue-900 font-bold shrink-0">//</span>
            <span className="text-[10px] text-slate-300 uppercase font-bold tracking-tighter truncate">
              Mission: Protocol
            </span>
          </div>
          <div className="flex items-center shrink-0 ml-2">
            <span className="text-[9px] px-2 py-0.5 rounded border border-blue-900 text-blue-400 font-bold">
              NODE_ACTIVE
            </span>
          </div>
        </header>

        {/* CONTENT AREA */}
        <main className="flex-1 relative w-full">
          {/* Background Grid Accent */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>
          
          <div className="relative z-10 w-full h-full">
            {children}
          </div>
        </main>

      </section>
    </div>
  );
}