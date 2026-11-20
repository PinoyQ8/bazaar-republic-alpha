// J:\Project-Bazaar\bazaar-republic\bazaar-republic-alpha\app\mesh-scan\MeshBroadcaster.tsx

"use client";

import React, { useState } from "react";

function toWeiBigInt(amountStr: string): bigint | null {
  const trimmed = amountStr.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;

  const [wholePart, fracPart = ""] = trimmed.split(".");
  const paddedFrac = (fracPart + "0".repeat(18)).slice(0, 18);
  const combined = `${wholePart}${paddedFrac}`.replace(/^0+/, "") || "0";

  try {
    return BigInt(combined);
  } catch {
    return null;
  }
}

export default function MeshBroadcaster() {
  const [channelId, setChannelId] = useState(
    "0xf9384cc585faf9f0ad36bac8b15d3c0f77c0ef7a43bdb69893057e2fae48bb8b"
  );
  const [nonce, setNonce] = useState<number>(1);
  const [balanceA, setBalanceA] = useState<string>("90");
  const [balanceB, setBalanceB] = useState<string>("10");
  const [statusLog, setStatusLog] = useState<string>(
    "Ready to broadcast state update..."
  );
  const [loading, setLoading] = useState<boolean>(false);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const cleanChannelId = channelId.trim();
    const numericNonce = Number(nonce);
    const weiA = toWeiBigInt(balanceA);
    const weiB = toWeiBigInt(balanceB);

    if (!/^0x[0-9a-fA-F]{64}$/.test(cleanChannelId)) {
      setStatusLog("REJECTED: Channel ID must be a 32-byte 0x-prefixed hex string.");
      return;
    }

    if (!Number.isInteger(numericNonce) || numericNonce < 1) {
      setStatusLog("REJECTED: Nonce must be a positive integer.");
      return;
    }

    if (weiA === null || weiB === null) {
      setStatusLog("REJECTED: Invalid Pi balance format for Balance A or Balance B.");
      return;
    }

    setLoading(true);
    setStatusLog("Transmitting state update to E-Network node...");

    try {
      const payload = {
        signedState: {
          state: {
            channelId: cleanChannelId,
            nonce: numericNonce,
            balanceA: weiA.toString(),
            balanceB: weiB.toString(),
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

      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.success) {
        setStatusLog(`SUCCESS: ${data.message || "State update accepted."}`);
      } else {
        setStatusLog(`REJECTED: ${data?.error || `HTTP ${res.status}`}`);
      }
    } catch (err: any) {
      setStatusLog(`ERROR: ${err?.message || "Failed to reach node API."}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 shadow-2xl">
      <h2 className="text-xl font-bold mb-2 tracking-wide text-emerald-400">
        MESH STATE BROADCASTER
      </h2>
      <p className="text-xs text-zinc-400 mb-4">
        S23 Mobile Node L2 Channel Manager
      </p>

      <form onSubmit={handleBroadcast} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-1">
            Channel ID
          </label>
          <input
            type="text"
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-xs text-zinc-300 font-mono focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              Nonce
            </label>
            <input
              type="number"
              min={1}
              step={1}
              value={nonce}
              onChange={(e) => setNonce(Number(e.target.value))}
              className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-xs text-zinc-300 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              Bal A (Pi)
            </label>
            <input
              type="text"
              value={balanceA}
              onChange={(e) => setBalanceA(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-xs text-zinc-300 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              Bal B (Pi)
            </label>
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