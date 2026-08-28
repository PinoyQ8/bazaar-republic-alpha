"use client";

import { useEffect } from "react";

interface HeartbeatParams {
  uid?: string;
  walletAddress?: string;
  intervalMs?: number; // Default 60 seconds
}

export function useNodeHeartbeat({ uid, walletAddress, intervalMs = 60000 }: HeartbeatParams) {
  useEffect(() => {
    if (!uid && !walletAddress) return;

    const sendHeartbeat = async () => {
      try {
        const response = await fetch("/api/node/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid, walletAddress, protocolVersion: "24" }),
        });

        const data = await response.json();
        if (!response.ok) {
          console.warn("⚠️ [HEARTBEAT] Node status warning:", data.message);
        }
      } catch (err) {
        console.error("❌ [HEARTBEAT] Network transmission error:", err);
      }
    };

    // Initial ping on mount
    sendHeartbeat();

    // Set recurring telemetry interval
    const timer = setInterval(sendHeartbeat, intervalMs);

    return () => clearInterval(timer);
  }, [uid, walletAddress, intervalMs]);
}