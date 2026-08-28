// J:\Project-Bazaar\bazaar-republic\bazaar-republic-alpha\app\mesh-scan\MeshBroadcaster.tsx

"use client";

import React, { useState } from "react";

export default function MeshBroadcaster() {
  const [channelId, setChannelId] = useState("0xf9384cc585faf9f0ad36bac8b15d3c0f77c0ef7a43bdb69893057e2fae48bb8b");
  const [nonce, setNonce] = useState(1);
  const [balanceA, setBalanceA] = useState("90");
  const [balanceB, setBalanceB] = useState("10");
  const [statusLog, setStatusLog] = useState<string>("Ready to broadcast state update...");
  const [loading, setLoading] = useState(false);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusLog("Transmitting state update to E-Network node...");

    try {
      // Mocked payload structure mirroring our validated cryptographic client test
      const payload = {
        signedState: {
          state: {
            channelId,
            nonce: Number(nonce),
            balanceA: BigInt(Number(balanceA) * 1e18).toString(), // Convert to Wei format
            balanceB: BigInt(Number(balanceB) * 1e18).toString(),
          },
          sigA: "0xcd76bc967b5dc47106mockedsignatureaproof...",
          sigB: "0xacd9b5f314bbc8e27emockedsignaturebproof...",
        },
        pioneerA_Address: "0x16A1B5569e6b65A03e418eb279E7BAeadD9590de",
        pioneerB_Address: "0x882cBD426Fc0A97fA7520873e2e10Bbd753d0F96",
      };

      const res = await fetch("/api/mesh/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatusLog(`SUCCESS ✅: ${data.message}`);
      } else {
        setStatusLog(`REJECTED 🛡️: ${data.error}`);
      }
    } catch (err: any) {
      setStatusLog(`ERROR ❌: ${err.message || "Failed to reach node API."}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 shadow-2xl">
      <h2 className="text-xl font-bold mb-2 tracking-wide text-emerald-400">⚡ MESH STATE BROADCASTER</h2>
      <p className="text-xs text-zinc-400 mb-4">S23 Mobile Node L2 Channel Channel Manager</p>

      <form onSubmit={handleBroadcast} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-1">Channel ID</label>
          <input
            type="text"
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-xs text-zinc-300 font-mono focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Nonce</label>
            <input
              type="number"
              value={nonce}
              onChange={(e) => setNonce(Number(e.target.value))}
              className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-xs text-zinc-300 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Bal A (Pi)</label>
            <input
              type="text"
              value={balanceA}
              onChange={(e) => setBalanceA(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-xs text-zinc-300 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Bal B (Pi)</label>
            <input
              type="text"
              value={balanceB}
              onChange={(e) => setBalanceB(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-xs text-zinc-300 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 text-zinc-950 font-bold text-xs uppercase tracking-wider rounded transition-colors"
        >
          {loading ? "Transmitting..." : "Broadcast State Update"}
        </button>
      </form>

      <div className="mt-4 p-3 bg-zinc-950 border border-zinc-800 rounded font-mono text-xs">
        <span className="text-zinc-500 block mb-1">Telemetry Status:</span>
        <span className="text-emerald-400 break-all">{statusLog}</span>
      </div>
    </div>
  );
}