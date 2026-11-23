// Location: hooks/useNodeHeartbeat.ts
"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface NodeHeartbeatOptions {
  uid?: string;
  walletAddress?: string;
  nodeId?: string;
  pioneerId?: string;
  role?: string;
  protocolVersion?: string;
  uptimeShield?: number;
  intervalMs?: number;
}

export interface HeartbeatTelemetryState {
  isPulsing: boolean;
  lastHeartbeatAt: string | null;
  nodeStatus: string;
  uptimeShield: number;
  trustScore: number;
  warning: string | null;
}

const TARGET_UPTIME_SHIELD = 92.0;
const MINIMUM_SLA_FLOOR = 90.0;

export function useNodeHeartbeat(
  optionsOrNodeId: NodeHeartbeatOptions | string = "Node-001-X570-Taichi",
  legacyIntervalMs: number = 60000
): HeartbeatTelemetryState & { triggerPulse: () => Promise<void> } {
  const options: NodeHeartbeatOptions =
    typeof optionsOrNodeId === "string"
      ? { nodeId: optionsOrNodeId, intervalMs: legacyIntervalMs }
      : optionsOrNodeId;

  const {
    uid,
    walletAddress,
    nodeId = "Node-001-X570-Taichi",
    pioneerId,
    role = "PRIMARY_VALIDATOR",
    protocolVersion = "28",
    uptimeShield = TARGET_UPTIME_SHIELD,
    intervalMs = 60000,
  } = options;

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [state, setState] = useState<HeartbeatTelemetryState>({
    isPulsing: false,
    lastHeartbeatAt: null,
    nodeStatus: "STANDBY",
    uptimeShield,
    trustScore: 100,
    warning: null,
  });

  const targetIdentifier = uid || pioneerId || walletAddress || nodeId;

  const triggerPulse = useCallback(async () => {
    if (!targetIdentifier) return;

    setState((prev) => ({ ...prev, isPulsing: true }));
    try {
      const response = await fetch("/api/node/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: uid || pioneerId || targetIdentifier,
          nodeId,
          walletAddress,
          role,
          protocolVersion,
          uptimeShield,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const msg = data?.message || data?.error || `HTTP ${response.status}`;
        setState((prev) => ({
          ...prev,
          isPulsing: false,
          nodeStatus: data?.status || "DEGRADED",
          warning: msg,
        }));
        return;
      }

      const resolvedShield =
        typeof data?.uptimeShield === "number" ? data.uptimeShield : uptimeShield;
      const belowFloorWarning =
        resolvedShield < MINIMUM_SLA_FLOOR
          ? `SLA Floor Alert: ${resolvedShield.toFixed(1)}% < ${MINIMUM_SLA_FLOOR.toFixed(1)}% floor`
          : null;

      setState({
        isPulsing: false,
        lastHeartbeatAt: data?.lastHeartbeat || new Date().toISOString(),
        nodeStatus: data?.status || "ACTIVE",
        uptimeShield: resolvedShield,
        trustScore: typeof data?.trustScore === "number" ? data.trustScore : 100,
        warning: belowFloorWarning,
      });
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error ? err.message : "Heartbeat transport error";
      setState((prev) => ({
        ...prev,
        isPulsing: false,
        warning: errMsg,
      }));
    }
  }, [
    targetIdentifier,
    uid,
    pioneerId,
    nodeId,
    walletAddress,
    role,
    protocolVersion,
    uptimeShield,
  ]);

  useEffect(() => {
    if (!targetIdentifier) return;

    triggerPulse();
    timerRef.current = setInterval(triggerPulse, intervalMs);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [targetIdentifier, intervalMs, triggerPulse]);

  return {
    ...state,
    triggerPulse,
  };
}