"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function RepublicHeroSector() {
   const router = useRouter();
   
   // 🛡️ ROOT NODE BYPASS: Cast hook context to bypass missing context interface signatures
   const context = useAuth() as any;
   const pioneer = context.pioneer;
   const login = context.login;
   const isHydrated = context.isHydrated as boolean;
  
  const [isSyncing, setIsSyncing] = useState(false);

  const handleHandshake = async () => {
    setIsSyncing(true);
    try {
      if (pioneer.isAuthenticated) {
        router.push("/dashboard");
      } else {
        await new Promise(resolve => setTimeout(resolve, 800));
        await login("PioneerNode", "PIONEER");
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("[MESH-FRACTURE] Handshake Failed:", error);
      setIsSyncing(false);
    }
  };

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <span className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-4 font-mono text-slate-300">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl text-emerald-500 font-bold mb-4 tracking-widest uppercase">Project Bazaar</h1>
        <p className="text-slate-400 mb-8 leading-relaxed">
          The Academy Vault. Lock your stake. Secure the network. Forge the future.
        </p>

        <button 
          onClick={handleHandshake}
          disabled={isSyncing}
          className="bg-slate-900 border border-emerald-500/50 text-emerald-400 px-8 py-3 rounded uppercase tracking-widest hover:bg-emerald-950 hover:border-emerald-400 transition-all disabled:opacity-50"
        >
          {isSyncing 
            ? "EXECUTING HANDSHAKE..." 
            : pioneer.isAuthenticated 
              ? "ENTER COMMAND DASHBOARD" 
              : "INITIALIZE PI NODE"}
        </button>

        {pioneer.isAuthenticated && (
          <p className="mt-4 text-xs text-slate-500 tracking-wider">
            Identity Confirmed: <span className="text-slate-300">{pioneer.username || "PioneerNode"}</span>
          </p>
        )}
      </div>
    </div>
  );
}