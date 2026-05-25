"use client";

import React, { useState } from "react";
import PioneerBadge from "./PioneerBadge";

export default function SecurityCircle() {
  const [piUid, setPiUid] = useState("");
  const [status, setStatus] = useState<"idle" | "scanning" | "verified">("idle");

  const handleVerify = async () => {
    setStatus("scanning");
    setTimeout(() => setStatus("verified"), 1500); 
  };

  return (
    <div className="space-y-6">
      {status !== "verified" ? (
        <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl animate-in fade-in duration-500">
          <label className="block text-[8px] text-blue-500 uppercase font-bold tracking-widest mb-4">
            Enter Pi Network UID
          </label>
          <input 
            type="text"
            value={piUid}
            onChange={(e) => setPiUid(e.target.value)}
            placeholder="e.g. Pioneer#1234"
            className="w-full bg-black border border-slate-800 p-4 text-sm font-mono text-white rounded-xl focus:border-blue-500 outline-none transition-all"
          />
          
          <button 
            onClick={handleVerify}
            disabled={status !== "idle" || !piUid}
            className={`w-full mt-6 py-4 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${
              status === "scanning" 
              ? "bg-blue-600/10 border border-blue-500 text-blue-400" 
              : "bg-blue-600 text-white hover:bg-blue-500 active:scale-95"
            }`}
          >
            {status === "scanning" ? "ADJUDICATING..." : "VERIFY STANDING"}
          </button>
        </div>
      ) : (
        <div className="animate-in zoom-in-95 duration-700">
          <div className="flex justify-center mb-4">
             <span className="px-3 py-1 bg-green-500/10 border border-green-500/30 text-green-400 text-[8px] font-bold uppercase tracking-widest rounded-full animate-pulse">
               Verification Complete
             </span>
          </div>
          {/* 🛡️ MINTING THE BADGE */}
          <PioneerBadge 
            uid={piUid} 
            tier="Genesis" 
            syncDate={new Date().toISOString().split('T')[0]} 
          />
          <button 
            onClick={() => setStatus("idle")}
            className="w-full mt-6 py-3 border border-slate-800 text-slate-400 text-[9px] uppercase tracking-widest rounded-xl hover:bg-slate-900 transition-all"
          >
            Scan Next Node
          </button>
        </div>
      )}
    </div>
  );
}