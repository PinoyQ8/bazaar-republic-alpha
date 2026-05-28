"use client";

import React, { useState } from "react";
import { commitModuleSignature } from "@/app/actions/academyActions";

interface AcademyModule {
  id: string;
  title: string;
  description: string;
}

const MODULES: AcademyModule[] = [
  { id: "MESH_PROTO_01", title: "MESH Fundamentals", description: "Learn the core DAO governance and security architecture." },
  { id: "POS_OPERATIONS_02", title: "Merchant POS Operations", description: "Master the 3% DAO tax and merchant tax collection." },
  { id: "STAKING_V23_03", title: "DeFi Yield Mechanics", description: "Understand the DeFi Treasury and liquidity locking." }
];

export default function AcademyDashboard({ pioneerId }: { pioneerId: string }) {
  const [status, setStatus] = useState<string | null>(null);

  const handleCompleteModule = async (moduleId: string) => {
    setStatus(`Encrypting signature for ${moduleId}...`);
    
    const result = await commitModuleSignature(pioneerId, moduleId);
    
    if (result.success) {
      setStatus(`SUCCESS: ${result.message} | TS: ${result.newTrustScore}`);
    } else {
      setStatus(`FRACTURE: ${result.message}`);
    }
  };

  return (
    <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-lg font-mono text-zinc-100 space-y-6">
      <h2 className="text-emerald-400 font-bold uppercase tracking-widest text-sm">Sector 4: The Academy</h2>
      
      {MODULES.map((mod) => (
        <div key={mod.id} className="border-b border-zinc-900 pb-4">
          <h3 className="text-zinc-100 font-bold">{mod.title}</h3>
          <p className="text-xs text-zinc-500 mb-3">{mod.description}</p>
          <button 
            onClick={() => handleCompleteModule(mod.id)}
            className="text-xs bg-emerald-900 hover:bg-emerald-800 text-emerald-100 px-3 py-1 rounded border border-emerald-700"
          >
            SIGN & CLAIM YIELD
          </button>
        </div>
      ))}

      {status && (
        <div className="mt-4 p-3 bg-zinc-900 border border-zinc-700 text-emerald-400 text-xs rounded">
          {status}
        </div>
      )}
    </div>
  );
}