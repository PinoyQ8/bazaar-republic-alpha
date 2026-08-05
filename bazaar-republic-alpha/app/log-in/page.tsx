"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Lock, Terminal, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext"; // 🛡️ Import the master context

export default function LoginNode() {
  const [pioneerId, setPioneerId] = useState("");
  const [passkey, setPasskey] = useState("");
  const [status, setStatus] = useState<"IDLE" | "AUTHENTICATING" | "SUCCESS" | "ERROR">("IDLE");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const { login } = useAuth(); // 🛡️ Pull the context login method

  const handleHandshake = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("AUTHENTICATING");
    setErrorMessage("");

    try {
      // 🛡️ MESH LOCAL VALIDATION PROTOCOL
      // Enforcing master founder parameters or client-side check
      if (!pioneerId.trim() || !passkey.trim()) {
        throw new Error("Adjudicator Intercept: Missing Pioneer credentials.");
      }

      // Simulate cryptographic calculation delay
      await new Promise((resolve) => setTimeout(resolve, 600));

      // 🛡️ Forge the Session State in localStorage & Context
      login({
        username: pioneerId,
        uid: pioneerId,
        tier: pioneerId.toLowerCase().includes("founder") ? "BAZAAR_FOUNDER" : "MESH_GUARDIAN",
        status: "ACTIVE",
        isAuthenticated: true,
      });

      setStatus("SUCCESS");
      
      // 🚀 The Bridge: Auto-route to Dashboard/Governance after successful handshake
      setTimeout(() => {
        router.push("/dashboard");
      }, 800);

    } catch (error: any) {
      setStatus("ERROR");
      setErrorMessage(error.message || "Cryptographic Handshake Failed.");
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