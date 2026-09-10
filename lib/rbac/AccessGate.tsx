// Location: components/rbac/AccessGate.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, Terminal, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface AccessGateProps {
  requiredRole: 'ECO_DEVELOPER' | 'DEFI_ARBITRAGEUR' | 'MESH_VALIDATOR' | 'GENESIS_ELDER';
  requiredModule?: string;
  children: React.ReactNode;
}

export default function AccessGate({ requiredRole, requiredModule = "01", children }: AccessGateProps) {
  const { pioneer } = useAuth();

  // Evaluate clearance
  const isQuarantined = 
  pioneer?.status === 'SUSPENDED' || 
  (pioneer as any)?.quarantineStatus === 'QUARANTINED' ||
  (pioneer as any)?.isFrozen;
  const isAuthorized = pioneer && !isQuarantined && pioneer.tier !== 'CITIZEN';

  if (!isAuthorized) {
    return (
      <div className="w-full p-4 rounded-xl border border-amber-900/60 bg-amber-950/20 text-amber-200 font-mono flex flex-col gap-3 my-2">
        <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
          {isQuarantined ? <ShieldAlert className="w-4 h-4 text-red-400" /> : <Lock className="w-4 h-4" />}
          <span>{isQuarantined ? "Protocol Quarantine" : "Clearance Required"}</span>
        </div>
        
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          {isQuarantined 
            ? "Your node failed the 85% Uptime Shield. Execution suspended until remedial Academy modules are cleared."
            : `Mainnet contract execution requires [${requiredRole}] certification.`}
        </p>

        <Link
          href={`/academy/module-${requiredModule}`}
          className="mt-1 w-full py-2.5 px-3 bg-amber-900/40 hover:bg-amber-800/60 border border-amber-700/50 rounded-lg text-center text-[10px] font-bold text-amber-300 uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>{isQuarantined ? "Begin Remedial Sequence" : `Complete Module ${requiredModule}`}</span>
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}