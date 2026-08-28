"use client";

import { useState, useEffect } from "react";

export default function CitizenDashboard() {
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill with the verified test vector for rapid testing
  const [g1Input, setG1Input] = useState<string>(
    "2a9dca26d5d9b7ecb0eedc3cadd6c864fb54fd3643ac886fc17627a68e1ac0c82430e5a21dfc325c2e3cfed72d8cce4d0a1c817215051e1ce8dbd12c34f72a4a2163499560bdcb24f17ddbbb7e4213e0a2caba440857a8ba5aef94bd1a6693902f2c8d3cc714ad3983198869188ffcd70ecc97573cc2e46bd1c70804abdc01be01f8da2250b6f8881098937559dd71058ac010037db3fc326199bcdc2f20555a091edb864764f7f6b99f8cdaa36b93cd04505377c6d312a8950e389a6c77524400000000000000000000000000000000000000000000000000000000000000050000000000000000000000000000000000000000000000000000000000000001"
  );
  const [g2Input, setG2Input] = useState<string>(
    "0303f0a4a6b0ecff5266a02c3592baf23a5effc43bde5cff04b5df05b0a30db43021f2ecf2fa1cc5708649e8dfde5508fef26f47ac68033fef357988f9abed6a1cfa2ed69cd00a3830e8908a68eb6757b3a9fad3a8e11e7d86c17c90b15972af1f076391b078b308cd74fa5e8379205efb3ca97e41a6dca4483e6caaeb9b191a" // Paste your full G2 hex here
  );

  useEffect(() => {
    const cachedStatus = localStorage.getItem("MESH_PROVIDER_STATUS");
    if (cachedStatus === "VERIFIED_ACTIVE") {
      setIsVerified(true);
    }
  }, []);

  async function handleMeshVerification(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/verify-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ g1_points: g1Input, g2_points: g2Input }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Verification sequence rejected.");
      }

      if (data.verified) {
        setIsVerified(true);
        localStorage.setItem("MESH_PROVIDER_STATUS", "VERIFIED_ACTIVE");
      } else {
        setError("Zero-knowledge proof validation failed on-chain.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 font-mono text-zinc-100">
      {/* Header Status Node */}
      <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
        <div>
          <h2 className="text-lg font-bold">E-Network Security Node</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Status: {isVerified ? "🔒 MESH Active & Verified" : "⚠️ Unverified Guest"}
          </p>
        </div>
        <div className={`px-3 py-1 rounded text-xs ${isVerified ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"}`}>
          {isVerified ? "SECURE" : "PENDING"}
        </div>
      </div>

      {/* Verification Form */}
      {!isVerified ? (
        <form onSubmit={handleMeshVerification} className="space-y-4 bg-zinc-900/50 p-6 border border-zinc-800 rounded-lg">
          <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">Zero-Knowledge Proof Injection</h3>
          
          <div>
            <label className="block text-xs text-zinc-400 mb-1">G1 Vector Hex</label>
            <textarea
              value={g1Input}
              onChange={(e) => setG1Input(e.target.value)}
              rows={3}
              className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">G2 Vector Hex</label>
            <textarea
              value={g2Input}
              onChange={(e) => setG2Input(e.target.value)}
              rows={3}
              className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded transition-colors text-sm"
          >
            {loading ? "Executing On-Chain Simulation..." : "Submit Proof & Verify Node"}
          </button>
        </form>
      ) : (
        <div className="p-6 bg-emerald-950/20 border border-emerald-500/30 rounded-lg text-center space-y-2">
          <h3 className="text-emerald-400 font-bold">Node Successfully Authorized</h3>
          <p className="text-xs text-zinc-400">The Soroban testnet contract confirmed your zero-knowledge proof.</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-950/30 border border-red-500/30 rounded text-red-400 text-xs">
          {error}
        </div>
      )}
    </div>
  );
}