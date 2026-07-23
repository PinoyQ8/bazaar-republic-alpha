"use client";

import { useState, useEffect } from "react";

export default function CitizenDashboard() {
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state from Master TS / localStorage on mount
  useEffect(() => {
    const cachedStatus = localStorage.getItem("MESH_PROVIDER_STATUS");
    if (cachedStatus === "VERIFIED_ACTIVE") {
      setIsVerified(true);
    }
  }, []);

  async function handleMeshVerification(g1Hex: string, g2Hex: string) {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/verify-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ g1_points: g1Hex, g2_points: g2Hex }),
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
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
        <div>
          <h2 className="text-lg font-bold text-white">E-Network Security Node</h2>
          <p className="text-sm text-zinc-400">
            Status: {isVerified ? "🔒 MESH Active & Verified" : "⚠️ Unverified Guest"}
          </p>
        </div>
        <div className={`px-3 py-1 rounded text-xs font-mono ${isVerified ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"}`}>
          {isVerified ? "SECURE" : "PENDING"}
        </div>
      </div>

      {!isVerified && (
        <button
          onClick={() => handleMeshVerification("YOUR_G1_HEX", "YOUR_G2_HEX")}
          disabled={loading}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
        >
          {loading ? "Simulating On-Chain Proof..." : "Authorize Provider via Zero-Knowledge Proof"}
        </button>
      )}

      {error && <p className="text-red-400 text-sm font-mono">{error}</p>}
    </div>
  );
}