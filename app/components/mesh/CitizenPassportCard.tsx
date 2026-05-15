'use client';

interface PassportProps {
  username: string;
  mbzrWeight: number;
  trustScore: number; // 0 to 100
  status: 'ACTIVE' | 'STASIS' | 'REVOKED';
  issuedAt: string;
}

export default function CitizenPassportCard({ username, mbzrWeight, trustScore, status, issuedAt }: PassportProps) {
  
  // 🛡️ STATUS ADJUDICATOR LOGIC
  const getStatusColor = () => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]';
      case 'STASIS': return 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]';
      case 'REVOKED': return 'bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]';
      default: return 'bg-zinc-500';
    }
  };

  return (
    <div className="relative w-full max-w-85 border border-amber-600/30 bg-black p-5 text-white font-mono uppercase tracking-wide">
      
      {/* 🏁 PASSPORT HEADER */}
      <div className="flex justify-between items-center mb-6 pb-2 border-b border-zinc-800">
        <h2 className="text-xs text-amber-500 tracking-[0.2em]">Republic Passport</h2>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-400">{status}</span>
          <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`} />
        </div>
      </div>

      {/* 👤 CITIZEN IDENTITY */}
      <div className="mb-6">
        <p className="text-[10px] text-zinc-500 mb-1">PIONEER ID</p>
        <p className="text-xl font-bold tracking-widest text-zinc-100">@{username}</p>
      </div>

      {/* ⚖️ MESH METRICS GRID */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-zinc-900/50 p-3 border-l-2 border-amber-600">
          <p className="text-[9px] text-zinc-500 mb-1">GOVERNANCE WEIGHT</p>
          <p className="text-lg font-bold text-amber-500">{mbzrWeight.toLocaleString()} <span className="text-xs">mBZR</span></p>
        </div>
        
        <div className="bg-zinc-900/50 p-3 border-l-2 border-emerald-600">
          <p className="text-[9px] text-zinc-500 mb-1">TRUST SCORE</p>
          <p className={`text-lg font-bold ${trustScore >= 80 ? 'text-emerald-500' : trustScore >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
            {trustScore.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* 📜 LEDGER FOOTER */}
      <div className="flex justify-between items-end mt-4 pt-4 border-t border-zinc-800">
        <div>
          <p className="text-[8px] text-zinc-600">ISSUED DATE</p>
          <p className="text-[10px] text-zinc-400">{new Date(issuedAt).toLocaleDateString()}</p>
        </div>
        <div className="text-right">
          <p className="text-[8px] text-zinc-600">MESH VERIFIED</p>
          <p className="text-[10px] text-amber-600/50">🛡️ 92% SHIELD</p>
        </div>
      </div>

      {/* BACKGROUND DECORATION */}
      <div className="absolute top-0 right-0 -z-10 w-32 h-32 bg-amber-600/5 rounded-full blur-3xl mix-blend-screen pointer-events-none" />
    </div>
  );
}