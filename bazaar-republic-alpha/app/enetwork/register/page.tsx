"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
// 🛡️ CRITICAL: Import the Ledger Action
import { registerServiceProvider } from "@/app/actions/enetworkActions";

export default function ProviderRegistrationSector() {
  const router = useRouter();
  const { pioneer } = useAuth(); // Assuming pioneer contains { uid, username, tier }
  const [isSyncing, setIsSyncing] = useState(false);
  const [formData, setFormData] = useState({
    serviceTitle: "",
    description: "",
    rateAmount: "",
    rateType: "hr"
  });

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.serviceTitle || !formData.rateAmount || isSyncing) return;

    setIsSyncing(true);
    console.log(`[MESH-BRIDGE] 🟢 Committing Provider Logic for ${pioneer?.username}...`);

    try {
      const fd = new FormData();
      // 🛡️ MESH-ALIGNMENT: Pass both ID and Username to satisfy the Mongoose Schema
      fd.append("pioneerId", pioneer?.uid || `TEMP-UID-${Date.now()}`); 
      fd.append("username", pioneer?.username || "UNKNOWN_NODE");
      fd.append("title", formData.serviceTitle);
      
      // Optional: If you update your Mongoose schema to include description later
      fd.append("description", formData.description); 
      
      // 🛡️ Combine amount and type into the single string our schema expects (e.g., "10.0 Pi / hr")
      const formattedRate = `${formData.rateAmount} Pi / ${formData.rateType}`;
      fd.append("rate", formattedRate);

      // Execute Server Action
      const result = await registerServiceProvider(fd);

      if (result.success) {
        router.push("/enetwork/dashboard");
      } else {
        throw new Error(result.message || "Registration Failed");
      }
    } catch (error) {
      console.error("[MESH-BRIDGE] 🚨 FATAL: Registration fracture.", error);
      alert("Registration failed. Check database connectivity.");
      setIsSyncing(false); // Reset so they can try again
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 animate-in slide-in-from-right duration-500">
      
      {/* 🛡️ VIEWPORT LOCK: max-w-sm aligns with S23 Ultra */}
      <div className="flex flex-col flex-1 w-full max-w-sm mx-auto h-screen relative">
        
        {/* 🧭 Sticky Header */}
        <div className="absolute top-0 left-0 right-0 z-10 px-4 py-4 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Link 
              href="/enetwork/dashboard" 
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="font-mono text-lg font-bold text-slate-100 uppercase tracking-tighter leading-none">
                Node Registration
              </h1>
              <div className="flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-[9px] font-mono text-emerald-500 tracking-widest uppercase">
                  Service Provider Setup
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 📝 Registration Form (Scrollable Workspace) */}
        <div className="flex-1 overflow-y-auto px-4 pt-24 pb-28 custom-scrollbar">
          
          {/* Node Identity Lock */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 mb-6 shadow-inner">
            <h2 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Operating Node</h2>
            <p className="text-sm font-mono font-bold text-emerald-400 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {pioneer?.username || "UNKNOWN_IDENTITY"}
            </p>
          </div>

          <form id="provider-form" onSubmit={handleRegistration} className="space-y-5">
            
            {/* Service Designation */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest pl-1">
                Service Designation
              </label>
              <input
                type="text"
                required
                maxLength={30}
                placeholder="e.g., Smart Contract Logic"
                value={formData.serviceTitle}
                onChange={(e) => setFormData({...formData, serviceTitle: e.target.value})}
                disabled={isSyncing}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all disabled:opacity-50"
              />
            </div>

            {/* Utility Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest pl-1">
                Utility Description <span className="text-slate-600">(Optional)</span>
              </label>
              <textarea
                rows={3}
                maxLength={120}
                placeholder="Define your MESH utility output..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                disabled={isSyncing}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none disabled:opacity-50 custom-scrollbar"
              />
            </div>

            {/* Exchange Rate */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest pl-1">
                Base Exchange Rate
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-emerald-500 font-bold">π</span>
                  <input
                    type="number"
                    required
                    min="0.1"
                    step="0.1"
                    placeholder="0.00"
                    value={formData.rateAmount}
                    onChange={(e) => setFormData({...formData, rateAmount: e.target.value})}
                    disabled={isSyncing}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-4 py-3 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all disabled:opacity-50"
                  />
                </div>
                <select
                  value={formData.rateType}
                  onChange={(e) => setFormData({...formData, rateType: e.target.value})}
                  disabled={isSyncing}
                  className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-emerald-500 transition-all appearance-none text-center cursor-pointer disabled:opacity-50"
                >
                  <option value="hr">/ hr</option>
                  <option value="task">/ task</option>
                </select>
              </div>
            </div>

            {/* Warning Matrix */}
            <div className="p-3 bg-emerald-950/20 border border-emerald-900/50 rounded-lg mt-6">
              <p className="text-[9px] font-mono text-emerald-500 leading-relaxed uppercase">
                Adjudicator Notice: False utility claims or failure to execute smart contracts will fracture your node rating and trigger DAO moderation.
              </p>
            </div>

          </form>
        </div>

        {/* 🚀 Sticky Execution Bridge */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-slate-950/90 border-t border-slate-800 backdrop-blur-md">
          <button
            type="submit"
            form="provider-form"
            disabled={!formData.serviceTitle || !formData.rateAmount || isSyncing}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold rounded-xl transition-all uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isSyncing ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Writing to Ledger...
              </>
            ) : (
              <>
                Commit Utility Logic
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}