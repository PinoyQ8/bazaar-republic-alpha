"use client";

import { useState, useEffect } from "react";

export default function WalletSecurityViewport() {
  const [vaultStatus, setVaultStatus] = useState("Active");
  const [timestamp, setTimestamp] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [signatures, setSignatures] = useState<number>(0);
  const [nodeId, setNodeId] = useState("node_alpha_x570");
  const [feedback, setFeedback] = useState("MESH Secure.");

  // Countdown timer logic for the 60s latency buffer
  useEffect(() => {
    if (vaultStatus === "PendingLock" && timestamp) {
      const interval = setInterval(() => {
        const elapsed = Math.floor(Date.now() / 1000) - timestamp;
        const remaining = 60 - elapsed;
        if (remaining <= 0) {
          setTimeLeft(0);
          setVaultStatus("Locked");
          setFeedback("Latency buffer expired. Treasury Vault Locked.");
          clearInterval(interval);
        } else {
          setTimeLeft(remaining);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [vaultStatus, timestamp]);

  // 1. Trigger 60-Second Latency Lock
  const triggerLatencyLock = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8080/api/treasury/latency-lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initiator_node: nodeId }),
      });
      const data = await res.json();
      setVaultStatus(data.current_state);
      setTimestamp(data.lock_timestamp);
      setTimeLeft(60);
      setFeedback(data.message);
    } catch {
      setFeedback("Connection error: Actix backend unreachable.");
    }
  };

  // 2. Trigger Instant Zero-Latency Lock
  const triggerInstantLock = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8080/api/treasury/instant-lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initiator_node: nodeId }),
      });
      const data = await res.json();
      setVaultStatus(data.current_state);
      setTimeLeft(0);
      setFeedback(data.message);
    } catch {
      setFeedback("Connection error: Actix backend unreachable.");
    }
  };

  // 3. Submit 3/5 Security Circle Consensus
  const submitConsensus = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8080/api/treasury/consensus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ node_id: nodeId }),
      });
      const data = await res.json();
      if (res.ok) {
        setVaultStatus(data.current_state);
        setSignatures(data.signatures_collected);
        setFeedback(data.message);
        if (data.current_state === "Active") {
          setTimeLeft(null);
          setTimestamp(null);
        }
      } else {
        setFeedback(data.error);
      }
    } catch {
      setFeedback("Connection error during consensus handshake.");
    }
  };

  return (
    <div className="max-w-[384px] mx-auto p-4 bg-black text-green-400 font-mono min-h-screen border border-green-800">
      <h1 className="text-lg font-bold border-b border-green-800 pb-2 mb-4">
        MESH SECURITY ADJUDICATOR
      </h1>

      <div className="mb-4 p-3 border border-dashed border-green-700">
        <p className="text-xs text-gray-400">TARGET: TREASURY VAULT (1B mBZR)</p>
        <p className="text-sm font-semibold mt-1">STATUS: <span className="text-white">{vaultStatus}</span></p>
        {timeLeft !== null && (
          <p className="text-xl text-yellow-400 font-bold mt-2">
            LOCKDOWN IN: {timeLeft}s
          </p>
        )}
      </div>

      <div className="space-y-3 mb-6">
        <button
          onClick={triggerLatencyLock}
          disabled={vaultStatus === "PendingLock"}
          className="w-full py-2 bg-yellow-900 border border-yellow-600 text-yellow-200 text-xs font-bold hover:bg-yellow-800 disabled:opacity-50"
        >
          INITIATE 60s LATENCY BUFFER
        </button>

        <button
          onClick={triggerInstantLock}
          className="w-full py-2 bg-red-900 border border-red-600 text-red-200 text-xs font-bold hover:bg-red-800"
        >
          INSTANT ZERO-LATENCY LOCK
        </button>
      </div>

      <div className="border-t border-green-800 pt-4 mb-4">
        <p className="text-xs text-gray-400 mb-2">3/5 SECURITY CIRCLE CONSENSUS</p>
        <input
          type="text"
          value={nodeId}
          onChange={(e) => setNodeId(e.target.value)}
          className="w-full p-2 bg-gray-900 border border-green-700 text-green-300 text-xs mb-2"
          placeholder="Enter Node ID"
        />
        <button
          onClick={submitConsensus}
          className="w-full py-2 bg-green-900 border border-green-600 text-green-200 text-xs font-bold hover:bg-green-800"
        >
          SUBMIT NODE SIGNATURE ({signatures}/3)
        </button>
      </div>

      <div className="p-2 bg-gray-950 border border-gray-800 text-[10px] text-gray-300">
        <span className="text-green-500 font-bold">LOG:</span> {feedback}
      </div>
    </div>
  );
}