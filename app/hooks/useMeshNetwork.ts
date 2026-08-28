// Location: app/hooks/useMeshNetwork.ts
"use client";

import { useState, useEffect } from "react";
// 🛡️ RELATIVE PATH TO ROOT /lib
import { getActiveNetworkMode, getActivePublicKey, MESH_NETWORK_KEYS, NetworkMode } from "@/app/utils/mesh-contracts";

export function useMeshNetwork() {
  const [networkMode, setNetworkModeState] = useState<NetworkMode>("TESTNET");
  const [publicKey, setPublicKey] = useState<string>(MESH_NETWORK_KEYS.TESTNET);

  useEffect(() => {
    // Sync local state with storage on mount
    const syncNetwork = () => {
      const mode = getActiveNetworkMode();
      setNetworkModeState(mode);
      setPublicKey(getActivePublicKey());
    };

    syncNetwork();

    // Listen for custom event & cross-tab storage updates
    const handleNetworkChange = () => syncNetwork();
    window.addEventListener("mesh_network_change", handleNetworkChange);
    window.addEventListener("storage", handleNetworkChange);

    return () => {
      window.removeEventListener("mesh_network_change", handleNetworkChange);
      window.removeEventListener("storage", handleNetworkChange);
    };
  }, []);

  return {
    networkMode,
    publicKey,
    isMainnet: networkMode === "MAINNET",
    isTestnet: networkMode === "TESTNET",
  };
}