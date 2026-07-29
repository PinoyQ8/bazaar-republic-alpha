"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Zap, Lock, Unlock, CheckCircle, AlertTriangle } from "lucide-react";
import { commitModuleSignature } from "@/app/actions/academyActions";

export default function Module02LogicGate() {
  const router = useRouter();
  const [uid, setUid] = useState<string>("PinoyQ8_Dev");
  const [isSyncing, setIsSyncing] = useState(false);
  const [gateUnlocked, setGateUnlocked] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quiz State
  const [answers, setAnswers] = useState({ q1: "", q2: "" });

  useEffect(() => {
    // 🛡️ Anchor to the local MESH identity
    const storedAuth = localStorage.getItem("pi_auth_user");
    if (storedAuth) {
      setUid(JSON.parse(storedAuth).uid);
    }
  }, []);

  // 🧠 The Logic Gate Validator
  const verifyLogic = () => {
    setErrorMsg(null);
    if (!answers.q1 || !answers.q2) {
      setErrorMsg("ADJUDICATOR HALT: All parameters must be defined.");
      return;
    }
    
    // Correct answers hard-coded to MESH protocol rules
    if (answers.q1 !== "B" || answers.q2 !== "C") {
      setErrorMsg("ADJUDICATOR HALT: Logic fracture detected. Review DAO consensus rules.");
      return;
    }

    setGateUnlocked(true);
  };

  // 🔐 The Signature Payload
  const handleSignature = async () => {
    setIsSyncing(true);
    try {
      const res = await commitModuleSignature(uid, "MODULE-02");
      if (res.success) {
        console.log(`[MESH-BRIDGE] ✅ ${res.message}`);
        router.push("/academy");
      } else {
        setErrorMsg(`FRACTURE: ${res.message}`);
        setIsSyncing(false);
      }
    } catch (err: any) {
      setErrorMsg(`SYSTEM PANIC: ${err.message}`);
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-neutral-200 font-mono p-4 animate-in fade-in duration-500">
      
      {/* 🧭 Header */}
      <header className="border-b border-emerald-900/50 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-black text-emerald-500 tracking-widest uppercase flex items-center gap-2">
              <Shield size={24} /> Module 02
            </h1>
            <p className="text-[10px] text-neutral-500 tracking-widest mt-1 uppercase">
              Consensus & Voting Power (VP)
            </p>
          </div>
          <button onClick={() => router.push("/academy")} className="text-[10px] px-2 py-1 border border-neutral-700 text-neutral-400 rounded hover:text-emerald-400">
            ABORT
          </button>
        </div>
      </header>

      {/* 📖 The Briefing */}
      <div className="space-y-4 mb-8">
        <div className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-lg shadow-[0_0_15px_rgba(0,0,0,0.5)] text-xs text-neutral-300 leading-relaxed">
          <h3 className="text-emerald-500 font-bold tracking-widest uppercase mb-2">Protocol Briefing</h3>
          <p className="mb-2">In the Bazaar Republic, governance is mathematically enforced. 1 Node does NOT equal 1 Vote.</p>
          <p className="mb-2 border-l-2 border-emerald-500 pl-2 py-1 bg-emerald-950/20">
            <span className="text-emerald-400 font-bold">Rule 1:</span> Your Active Voting Power (VP) is a dynamically calculated weight derived from your <strong className="text-amber-400">TrustScore (0.3x)</strong> and your <strong className="text-amber-400">Staked Fuel (0.5x)</strong>.
          </p>
          <p className="border-l-2 border-emerald-500 pl-2 py-1 bg-emerald-950/20">
            <span className="text-emerald-400 font-bold">Rule 2:</span> A proposal requires an <strong className="text-blue-400">80% Supermajority</strong> of cast VP to pass. 51% is considered network instability and is rejected by the Adjudicator.
          </p>
        </div>
      </div>

      {/* 🧠 Logic Gate Test */}
      {!gateUnlocked ? (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Lock size={16} className="text-red-500" />
            <h2 className="text-sm font-bold text-neutral-300 tracking-widest uppercase">Logic Gate Verification</h2>
          </div>

          {/* Question 1 */}
          <div className="space-y-2">
            <p className="text-xs text-amber-500 font-bold">01. How does the Adjudicator calculate your Voting Power (VP)?</p>
            <div className="flex flex-col gap-2">
              <label className={`flex items-center gap-3 p-3 border rounded text-xs transition-all cursor-pointer ${answers.q1 === 'A' ? 'border-amber-500 bg-amber-950/30' : 'border-neutral-800 bg-neutral-900/30 hover:border-neutral-600'}`}>
                <input type="radio" name="q1" value="A" className="hidden" onChange={(e) => setAnswers({...answers, q1: e.target.value})} />
                <div className={`w-3 h-3 rounded-full border ${answers.q1 === 'A' ? 'bg-amber-500 border-amber-500' : 'border-neutral-600'}`}></div>
                1 Node always equals 1 Vote.
              </label>
              <label className={`flex items-center gap-3 p-3 border rounded text-xs transition-all cursor-pointer ${answers.q1 === 'B' ? 'border-amber-500 bg-amber-950/30' : 'border-neutral-800 bg-neutral-900/30 hover:border-neutral-600'}`}>
                <input type="radio" name="q1" value="B" className="hidden" onChange={(e) => setAnswers({...answers, q1: e.target.value})} />
                <div className={`w-3 h-3 rounded-full border ${answers.q1 === 'B' ? 'bg-amber-500 border-amber-500' : 'border-neutral-600'}`}></div>
                It is a blend of TrustScore and Staked Fuel.
              </label>
            </div>
          </div>

          {/* Question 2 */}
          <div className="space-y-2">
            <p className="text-xs text-amber-500 font-bold">02. What is the minimum threshold for a network upgrade proposal to pass?</p>
            <div className="flex flex-col gap-2">
              <label className={`flex items-center gap-3 p-3 border rounded text-xs transition-all cursor-pointer ${answers.q2 === 'A' ? 'border-amber-500 bg-amber-950/30' : 'border-neutral-800 bg-neutral-900/30 hover:border-neutral-600'}`}>
                <input type="radio" name="q2" value="A" className="hidden" onChange={(e) => setAnswers({...answers, q2: e.target.value})} />
                <div className={`w-3 h-3 rounded-full border ${answers.q2 === 'A' ? 'bg-amber-500 border-amber-500' : 'border-neutral-600'}`}></div>
                51% Simple Majority
              </label>
              <label className={`flex items-center gap-3 p-3 border rounded text-xs transition-all cursor-pointer ${answers.q2 === 'C' ? 'border-amber-500 bg-amber-950/30' : 'border-neutral-800 bg-neutral-900/30 hover:border-neutral-600'}`}>
                <input type="radio" name="q2" value="C" className="hidden" onChange={(e) => setAnswers({...answers, q2: e.target.value})} />
                <div className={`w-3 h-3 rounded-full border ${answers.q2 === 'C' ? 'bg-amber-500 border-amber-500' : 'border-neutral-600'}`}></div>
                80% Supermajority
              </label>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-950/40 border border-red-900 text-red-400 text-[10px] tracking-widest uppercase flex items-center gap-2 rounded">
              <AlertTriangle size={14} /> {errorMsg}
            </div>
          )}

          <button onClick={verifyLogic} className="w-full py-3 bg-neutral-800 border border-neutral-700 text-neutral-300 rounded text-xs font-bold tracking-widest uppercase hover:bg-neutral-700 hover:text-white transition-all">
            Verify Logic
          </button>
        </div>
      ) : (
        
        /* 🔐 The Cryptographic Lock-In (Success State) */
        <div className="p-6 bg-emerald-950/20 border border-emerald-900/50 rounded-lg flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95 duration-500">
          <Unlock size={32} className="text-emerald-500" />
          <div>
            <h2 className="text-sm font-bold text-emerald-400 tracking-widest uppercase">Logic Gate Cleared</h2>
            <p className="text-[10px] text-neutral-400 tracking-widest mt-1">Consensus knowledge verified.</p>
          </div>
          
          <div className="w-full h-px bg-emerald-900/50 my-2"></div>
          
          <button 
            onClick={handleSignature}
            disabled={isSyncing}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-black font-black text-xs tracking-widest uppercase rounded flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)]"
          >
            {isSyncing ? (
              <>SYNCING VAULT...</>
            ) : (
              <><Zap size={16} /> COMMIT SIGNATURE (+15 FUEL)</>
            )}
          </button>
          
          {errorMsg && <p className="text-red-500 text-[10px] mt-2 tracking-widest uppercase">{errorMsg}</p>}
        </div>
      )}
      
    </div>
  );
}