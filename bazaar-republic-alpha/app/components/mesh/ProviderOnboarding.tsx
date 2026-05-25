"use client";

import React, { useState } from 'react';
// 🛡️ INJECT THE AUTH BRIDGE
import { usePiAuth } from '@/app/components/mesh/PiAuthBridge';

export default function ProviderOnboarding() {
  const { pioneer, isAuthenticated, authenticateNode } = usePiAuth(); // 🛡️ PI AUTH HOOK
  const [formData, setFormData] = useState({ businessName: '', serviceCategory: 'MERCHANT' });
  const [manualAgreed, setManualAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<{ hash: string; status: string } | null>(null);

  const CURRENT_MANUAL_VERSION = "v1.0-MESH";

  const submitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    // 🛡️ SECURITY LOCK: Require Authentication
    if (!manualAgreed || !pioneer) return;
    
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/enetwork/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-mesh-pioneer-uid': pioneer.uid // 🛡️ DYNAMIC UID TRANSMISSION
        },
        body: JSON.stringify({
          ...formData,
          manualVersionAgreed: CURRENT_MANUAL_VERSION
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setReceipt({ hash: data.complianceHash, status: "PENDING_VERIFICATION" });
      } else {
        alert(`[REGISTRATION FRACTURE]: ${data.error}`);
      }
    } catch (err) {
      console.error("[PROVIDER_UI_PANIC]:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🛡️ AUTHENTICATION WALL
  if (!isAuthenticated) {
    return (
      <div className="p-8 text-center border border-emerald-900/50 bg-black rounded-lg">
        <p className="text-emerald-500 mb-4">Node Disconnected. Authenticate to begin Genesis.</p>
        <button onClick={authenticateNode} className="px-6 py-2 border border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-black uppercase tracking-widest font-bold">
          Initiate Handshake
        </button>
      </div>
    );
  }

  // ... (Keep your existing receipt and intake form UI)

  // 🛡️ VIEW STATE: INTAKE FORM
  return (
    <div className="p-6 border border-emerald-900/30 bg-black rounded-lg font-mono text-emerald-500 max-w-xl mx-auto shadow-[0_0_15px_rgba(4,120,87,0.1)]">
      <h2 className="text-lg font-bold uppercase tracking-widest mb-4 border-b border-emerald-900/50 pb-2">
        E-Network // Provider Gateway
      </h2>
      <form onSubmit={submitRegistration} className="space-y-5">
        
        <div>
          <label className="block text-xs uppercase text-slate-400 mb-1">Business / Node Name</label>
          <input 
            type="text"
            placeholder="e.g. Neo Logistics" 
            className="w-full bg-slate-900 p-3 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition-colors placeholder-slate-600"
            onChange={(e) => setFormData({...formData, businessName: e.target.value})}
            required
          />
        </div>

        <div>
          <label className="block text-xs uppercase text-slate-400 mb-1">Service Category</label>
          <select 
            className="w-full bg-slate-900 p-3 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition-colors"
            onChange={(e) => setFormData({...formData, serviceCategory: e.target.value})}
            value={formData.serviceCategory}
          >
            <option value="MERCHANT">Merchant / Retail</option>
            <option value="DEVELOPER">Smart Contract / Web3 Dev</option>
            <option value="LOGISTICS">Logistics / Supply Chain</option>
            <option value="CREATOR">Digital Content / Media</option>
          </select>
        </div>

        <div className="bg-slate-900/50 p-4 border border-slate-800 rounded flex items-start space-x-3">
          <input 
            type="checkbox" 
            id="manualAgreement"
            className="mt-1 w-4 h-4 accent-emerald-600 bg-slate-800 border-slate-600"
            onChange={(e) => setManualAgreed(e.target.checked)}
          />
          <label htmlFor="manualAgreement" className="text-xs text-slate-300 leading-relaxed cursor-pointer">
            I cryptographically sign and agree to the <span className="text-emerald-400 font-bold">Service Provider Manual ({CURRENT_MANUAL_VERSION})</span>. I understand that violating the MESH parameters will result in a degraded Reputation Score and potential node freeze.
          </label>
        </div>

        <button 
          type="submit"
          disabled={isSubmitting || !manualAgreed}
          className="w-full py-3 bg-emerald-800 text-black font-bold uppercase tracking-widest hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isSubmitting ? "Generating Compliance Hash..." : "Initialize Provider Node"}
        </button>
      </form>
    </div>
  );
}