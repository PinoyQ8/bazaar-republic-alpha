// 🛡️ app/enetwork/directory/page.tsx
import PublicDirectory from '@/app/components/mesh/PublicDirectory';

export const metadata = {
  title: 'Global Directory | E-Network',
  description: 'Browse verified Service Providers active on the MESH Protocol.',
};

export default function DirectoryPage() {
  return (
    <main className="min-h-screen bg-black flex flex-col items-center p-4 md:p-8 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-slate-900 via-black to-black">
      
      {/* 🛡️ DIRECTORY HEADER */}
      <div className="w-full max-w-4xl text-center mb-8 mt-4 font-mono">
        <h1 className="text-2xl md:text-3xl font-bold text-emerald-500 tracking-widest uppercase mb-2 drop-shadow-[0_0_8px_rgba(4,120,87,0.5)]">
          Public Directory
        </h1>
        <p className="text-xs md:text-sm text-slate-400 max-w-2xl mx-auto">
          The verifiable ledger of all active Service Providers. These Real Pioneers have passed Adjudicator clearance and are cryptographically sealed within the E-Network.
        </p>
      </div>
      
      {/* 🛡️ MOUNT THE RADAR */}
      <div className="w-full max-w-4xl">
        <PublicDirectory />
      </div>

      {/* 🛡️ SECURITY FOOTER */}
      <div className="mt-12 text-center font-mono text-[10px] text-slate-600 uppercase tracking-widest">
        <p>Project Bazaar // MESH Protocol Active</p>
        <p>Zero-Knowledge Data Shield: Online</p>
      </div>

    </main>
  );
}