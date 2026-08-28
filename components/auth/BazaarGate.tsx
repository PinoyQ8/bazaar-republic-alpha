"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BazaarGate() {
  const [acceptedSecurity, setAcceptedSecurity] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const router = useRouter();

  const handlePiAuth = async () => {
    try {
      const Pi = (window as any).Pi;
      const scopes = ['username', 'uid'];

      const authResult = await Pi.authenticate(scopes, async (auth: any) => {
        setStatus("Verifying Identity with Ledger...");
        
        // 🛡️ HANDSHAKE: Send token to your Gatekeeper API
        const response = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken: auth.accessToken }),
        });

        const data = await response.json();

        if (data.success) {
          setStatus("GATE_OPEN: Welcome, Pioneer.");
          router.push("/e-network/dashboard");
        } else {
          // 🛡️ GOVERNANCE LOCK: Catch Frozens/Sanctions here
          setStatus(`GATE_CLOSED: ${data.message}`);
        }
      }, (err: any) => {
        setStatus(`FRACTURE: ${err.message}`);
      });
    } catch (err) {
      setStatus("FRACTURE: Pi SDK Not Detected.");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-black border border-emerald-900 rounded-sm font-mono">
      {/* 🛡️ SECURITY MANIFEST */}
      <div className="mb-6 border-b border-emerald-900 pb-4">
        <h3 className="text-amber-500 font-bold uppercase tracking-widest text-[10px]">🛡️ BAZAAR MESH SECURITY NOTICE</h3>
        <ul className="mt-3 text-[9px] text-emerald-600 space-y-1">
          <li>1. 🌐 VERIFY URL: mesh-academy-alpha.vercel.app</li>
          <li>2. 🔑 KEY SOVEREIGNTY: We never request passphrases.</li>
          <li>3. 🛑 PROTOCOL ISOLATION: Avoid rogue nodes.</li>
        </ul>
        <div className="mt-4 flex items-center space-x-2 text-[10px] text-white">
          <input 
            type="checkbox" 
            checked={acceptedSecurity} 
            onChange={() => setAcceptedSecurity(!acceptedSecurity)}
            className="accent-emerald-600"
          />
          <label>I UNDERSTAND THE MESH PROTOCOL</label>
        </div>
      </div>

      {/* 🛡️ AUTH TRIGGER */}
      <button 
        onClick={handlePiAuth}
        disabled={!acceptedSecurity}
        className={`w-full py-3 text-[10px] uppercase tracking-wider font-bold transition-all ${
          acceptedSecurity 
            ? "bg-emerald-600 text-white hover:bg-emerald-500" 
            : "bg-slate-900 text-slate-700 cursor-not-allowed"
        }`}
      >
        {status || "Validate Identity via Pi"}
      </button>
    </div>
  );
}