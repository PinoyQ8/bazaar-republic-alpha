"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Lock, Terminal, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

export default function LoginNode() {
  const [pioneerId, setPioneerId] = useState("");
  const [passkey, setPasskey] = useState("");
  const [status, setStatus] = useState<"IDLE" | "AUTHENTICATING" | "SUCCESS" | "ERROR">("IDLE");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  const handleHandshake = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("AUTHENTICATING");
    setErrorMessage("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pioneerId, passkey }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Adjudicator Intercept: Invalid Credentials.");
      }

      setStatus("SUCCESS");
      
      // 🚀 The Bridge: Auto-route to Governance after successful handshake
      setTimeout(() => {
        router.push("/governance");
      }, 1000);

    } catch (error: any) {
      setStatus("ERROR");
      setErrorMessage(error.message);
    }
  };

  return (
    <main className="min-h-screen bg-black flex items-center justify-center font-mono p-4">
      <div className="bg-neutral-950 p-8 border border-neutral-800 rounded-lg w-full max-w-md shadow-2xl shadow-black/80">
        
        {/* HEADER */}
        <div className="flex flex-col items-center justify-center mb-8 border-b border-amber-900/50 pb-6">
          <Shield className="w-12 h-12 text-amber-500 mb-4" />
          <h1 className="text-2xl font-bold tracking-widest text-amber-500 uppercase">Project Bazaar</h1>
          <p className="text-neutral-500 text-sm tracking-widest mt-1">THE MESH PROTOCOL</p>
        </div>

        {/* AUTH FORM */}
        <form onSubmit={handleHandshake} className="space-y-6">
          
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm text-neutral-400 uppercase tracking-wider">
              <Terminal className="w-4 h-4" />
              <span>Pioneer ID</span>
            </label>
            <input
              type="text"
              value={pioneerId}
              onChange={(e) => setPioneerId(e.target.value)}
              disabled={status === "AUTHENTICATING" || status === "SUCCESS"}
              className="w-full bg-neutral-900 border border-neutral-700 rounded px-4 py-3 text-amber-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all disabled:opacity-50"
              placeholder="e.g., PinoyQ8"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm text-neutral-400 uppercase tracking-wider">
              <Lock className="w-4 h-4" />
              <span>Cryptographic Passkey</span>
            </label>
            <input
              type="password"
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
              disabled={status === "AUTHENTICATING" || status === "SUCCESS"}
              className="w-full bg-neutral-900 border border-neutral-700 rounded px-4 py-3 text-amber-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all disabled:opacity-50"
              placeholder="Enter Passkey"
              required
            />
          </div>

          {/* TELEMETRY FEEDBACK */}
          {status === "ERROR" && (
            <div className="flex items-center space-x-2 text-red-500 bg-red-950/20 border border-red-900/50 p-3 rounded text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {status === "SUCCESS" && (
            <div className="flex items-center space-x-2 text-emerald-500 bg-emerald-950/20 border border-emerald-900/50 p-3 rounded text-sm">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <span>Handshake Verified. Opening Bridge...</span>
            </div>
          )}

          {/* IGNITION BUTTON */}
          <button
            type="submit"
            disabled={status === "AUTHENTICATING" || status === "SUCCESS"}
            className="w-full bg-amber-600 hover:bg-amber-500 text-black font-bold uppercase tracking-widest py-3 rounded transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "AUTHENTICATING" ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Initiating...</span>
              </>
            ) : status === "SUCCESS" ? (
              <span>Node Active</span>
            ) : (
              <span>Establish Link</span>
            )}
          </button>

        </form>
      </div>
    </main>
  );
}