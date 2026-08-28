// Location: app/academy/module-02/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import PioneerAuthGate from "@/app/components/PioneerAuthGate";
import { commitModuleSignature } from "@/app/actions/academyActions";
import { ShieldCheck, Loader2, ArrowLeft, Vote, Users, Lock, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Module02Governance() {
  const { pioneer } = useAuth();
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(
    typeof window !== "undefined" && localStorage.getItem("academy_module_02_cleared") === "true"
  );

  const handleModuleCompletion = async () => {
    const username = pioneer?.username || pioneer?.uid;

    if (!username) {
      setErrorMessage("Identity missing from RAM. Re-authenticate node.");
      return;
    }

    setIsSyncing(true);
    setErrorMessage(null);

    try {
      // Commit cryptographic clearance to the Ledger
      const response = await commitModuleSignature(username, "MODULE-02");

      if (response.success || response.message === "MODULE_ALREADY_SIGNED_AND_CLAIMED") {
        setIsCompleted(true);
        localStorage.setItem("academy_module_02_cleared", "true");
        router.push("/academy?v=FORCE_SYNC");
      } else {
        setErrorMessage(response.message || "Adjudicator rejected signature.");
        setIsSyncing(false);
      }
    } catch (err: any) {
      console.error("[MESH-SCAN] Module 02 Execution Fault:", err);
      setErrorMessage("Network fracture during DAO sync.");
      setIsSyncing(false);
    }
  };

  return (
    <PioneerAuthGate>
      <main className="w-full max-w-sm mx-auto p-4 pb-24 min-h-screen text-slate-100 font-mono selection:bg-blue-500/30">
        
        {/* TOP NAVIGATION BACK */}
        <div className="mb-4">
          <Link href="/academy" className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-blue-400 transition-colors uppercase tracking-widest">
            <ArrowLeft className="w-3 h-3" /> Back to Academy Hub
          </Link>
        </div>

        {/* MODULE HEADER */}
        <div className="mb-6 border-b border-slate-800 pb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-blue-400 font-bold tracking-widest uppercase">MODULE 02</span>
            <span className="text-[9px] px-2 py-0.5 rounded border border-blue-900 text-blue-400">DAO GOVERNANCE</span>
          </div>
          <h1 className="text-slate-100 font-bold text-sm tracking-wider uppercase">Stratified Consensus</h1>
        </div>

        {/* CONTENT BRIEFING */}
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
            <p className="text-[10px] text-slate-400 mb-2">
              Project Bazaar rejects centralized plutocracy. Governance power is mathematically distributed across <strong className="text-blue-400">5 Equal Strata (20% global weight each)</strong>.
            </p>
            <div className="space-y-1.5 pt-2 border-t border-slate-800 text-[10px]">
              <div className="flex justify-between text-slate-400"><span>Citizen Block:</span><span className="text-blue-400">20% Weight</span></div>
              <div className="flex justify-between text-slate-400"><span>Novice Block:</span><span className="text-blue-400">20% Weight</span></div>
              <div className="flex justify-between text-slate-400"><span>Academy Core:</span><span className="text-blue-400">20% Weight</span></div>
              <div className="flex justify-between text-slate-400"><span>Mesh Guardian:</span><span className="text-blue-400">20% Weight</span></div>
              <div className="flex justify-between text-slate-400"><span>Bazaar Founder:</span><span className="text-blue-400">20% Weight</span></div>
            </div>
          </div>

          <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-lg">
            <h4 className="text-[11px] font-bold text-blue-400 uppercase mb-1 flex items-center gap-1.5">
              <Vote className="w-3.5 h-3.5" /> Consensus Trigger Rule
            </h4>
            <p className="text-[10px] text-slate-400">
              When 4 out of 5 strata achieve an internal local majority (≥ 80% support), global protocol execution triggers automatically. No single whale can override the network.
            </p>
          </div>
        </div>

        {/* ERROR DISPLAY */}
        {errorMessage && (
          <div className="mt-4 p-3 bg-red-950/40 border border-red-900 text-red-400 text-[10px] rounded">
            [FRACTURE] {errorMessage}
          </div>
        )}

        {/* EXECUTION / CLAIM BUTTON */}
        <div className="mt-6">
          {isCompleted ? (
            <div className="w-full py-3 bg-blue-950/30 border border-blue-900 text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500" /> MODULE 02 CLEARED & LOGGED
            </div>
          ) : (
            <button
              onClick={handleModuleCompletion}
              disabled={isSyncing}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 text-[10px] font-bold uppercase tracking-wider rounded transition-colors flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.2)]"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> RECORDING TO LEDGER...
                </>
              ) : (
                "ACKNOWLEDGE & COMMIT SIGNATURE"
              )}
            </button>
          )}
        </div>

      </main>
    </PioneerAuthGate>
  );
}