// 🛡️ app/e-network/adjudicator/page.tsx
import VerificationSector from '@/app/components/mesh/VerificationSector';

export const metadata = {
  title: 'Adjudicator Console | E-Network',
  description: 'Elders verification and state management terminal.',
};

export default function AdjudicatorPage() {
  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center p-4 md:p-8 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-slate-900 via-black to-black">
      
      {/* 🛡️ CONSOLE HEADER */}
      <div className="w-full max-w-2xl text-center mb-8 font-mono">
        <h1 className="text-2xl md:text-3xl font-bold text-emerald-500 tracking-widest uppercase mb-2">
          Adjudicator Console
        </h1>
        <p className="text-xs md:text-sm text-slate-400">
          E-Network Clearance & State Management. Only Founders and Elders may alter registry truth.
        </p>
      </div>
      
      {/* 🛡️ MOUNT THE HUD */}
      <div className="w-full max-w-2xl">
        <VerificationSector />
      </div>

      {/* 🛡️ SECURITY FOOTER */}
      <div className="mt-8 text-center font-mono text-[10px] text-slate-600 uppercase tracking-widest">
        <p>Project Bazaar // MESH Protocol Active</p>
        <p>Uptime Shield: 92% // Neo-Sync Domain</p>
      </div>

    </main>
  );
}