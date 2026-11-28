// Location: app/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import VaultDashboard from "@/components/VaultDashboard";

const FALLBACK_NODE_ADDRESS =
  "GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3";

export default function BazaarEscrowNode() {
  const [consumerAddress, setConsumerAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-detect existing Pioneer session in browser storage
  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored =
      localStorage.getItem("mesh_pioneer_uid") ||
      localStorage.getItem("pi_uid") ||
      localStorage.getItem("pi_auth_user");

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const resolved = parsed?.uid || parsed?.walletAddress || stored;
        setConsumerAddress(typeof resolved === "string" ? resolved : stored);
      } catch {
        setConsumerAddress(stored);
      }
    }
  }, []);

  // Authenticate or initialize Pioneer Node identity
  const handleConnect = async () => {
    if (isConnecting) return;

    try {
      setIsConnecting(true);
      setError(null);

      let activeAddress: string | null = null;
      if (typeof window !== "undefined") {
        activeAddress =
          localStorage.getItem("mesh_pioneer_uid") ||
          localStorage.getItem("pi_uid");
      }

      if (!activeAddress) {
        activeAddress = FALLBACK_NODE_ADDRESS;
        if (typeof window !== "undefined") {
          localStorage.setItem("mesh_pioneer_uid", activeAddress);
        }
      }

      setConsumerAddress(activeAddress);
      console.log("Pioneer Node Synchronized:", activeAddress);
    } catch (err: any) {
      setError(err?.message || "Failed to establish MESH link.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("mesh_pioneer_uid");
      localStorage.removeItem("pi_uid");
      localStorage.removeItem("pi_auth_user");
    }
    setConsumerAddress(null);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-black text-white p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl text-center mb-6">
        <h1 className="text-3xl font-bold tracking-widest text-gray-200">
          BAZAAR REPUBLIC
        </h1>
        <p className="text-gray-500 font-mono text-sm mt-1">
          Escrow Protocol v1.0 [Protocol 28 // Pi Testnet]
        </p>
      </div>

      {!consumerAddress ? (
        <div className="w-full max-w-md p-6 border border-gray-800 rounded-lg text-center bg-gray-900 space-y-4">
          <p className="text-gray-400 text-sm">
            Initialize the Sovereign MESH Bridge to interact with the Protocol 28
            Vault.
          </p>

          <button
            type="button"
            onClick={handleConnect}
            disabled={isConnecting}
            className={`w-full font-bold py-3 px-4 rounded transition-colors ${
              isConnecting
                ? "bg-emerald-900 text-gray-300 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-500 text-black shadow-lg"
            }`}
          >
            {isConnecting
              ? "Synchronizing Pioneer Node..."
              : "Initialize Pi Node"}
          </button>

          <div className="pt-3 border-t border-gray-800 text-xs font-mono text-gray-400 flex justify-between items-center">
            <span>Passkey Security:</span>
            <Link
              href="/mesh/harness"
              className="text-emerald-400 hover:underline hover:text-emerald-300"
            >
              Samsung Knox Harness →
            </Link>
          </div>

          {error && (
            <p className="text-red-500 mt-2 text-sm font-mono">{error}</p>
          )}
        </div>
      ) : (
        <div className="w-full max-w-2xl space-y-4">
          <div className="p-3 border border-emerald-800 bg-emerald-950/20 rounded flex items-center justify-between">
            <p className="text-emerald-500 font-mono text-sm">
              Shield Active: {consumerAddress.slice(0, 6)}...
              {consumerAddress.slice(-4)}
            </p>
            <button
              type="button"
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