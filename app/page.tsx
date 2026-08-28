"use client";

import { useState } from "react";
import { connectFreighter } from "@/lib/freighter";
import VaultDashboard from "@/components/VaultDashboard";

export default function BazaarEscrowNode() {
  const [consumerAddress, setConsumerAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      const pubKey = await connectFreighter();

      if (!pubKey) {
        throw new Error("Freighter connection rejected or address unavailable.");
      }

      setConsumerAddress(pubKey);
      console.log("Node Synchronized:", pubKey);
    } catch (err: any) {
      setError(err?.message || "Failed to establish MESH link with Freighter.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setConsumerAddress(null);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-black text-white p-4 md:p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold text-center mb-2 tracking-widest text-gray-200">
        BAZAAR REPUBLIC
      </h1>
      <p className="text-gray-500 mb-8 font-mono text-sm">Escrow Protocol v1.0 [Testnet]</p>

      {!consumerAddress ? (
        <div className="w-full max-w-md p-6 border border-gray-800 rounded-lg text-center bg-gray-900">
          <p className="text-gray-400 mb-6">Initialize the MESH Bridge to interact with the ledger.</p>
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className={`w-full font-bold py-3 px-4 rounded transition-colors ${
              isConnecting
                ? "bg-blue-800 text-gray-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {isConnecting ? "Synchronizing Bridge..." : "Sync Freighter Wallet"}
          </button>
          {error && <p className="text-red-500 mt-4 text-sm font-mono">⚠️ {error}</p>}
        </div>
      ) : (
        <div className="w-full max-w-2xl space-y-4">
          <div className="p-3 border border-green-800 bg-green-900/20 rounded flex items-center justify-between">
            <p className="text-green-500 font-mono text-sm">
              Shield Active: {consumerAddress.slice(0, 6)}...{consumerAddress.slice(-4)}
            </p>
            <button
              onClick={handleDisconnect}
              className="text-xs font-mono text-gray-400 hover:text-red-400 transition-colors"
            >
              [Disconnect Node]
            </button>
          </div>

          <VaultDashboard consumerPubKey={consumerAddress} />
        </div>
      )}
    </main>
  );
}