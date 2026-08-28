'use client';

import { useEffect, useRef, useCallback } from 'react';

export interface NodeHeartbeatOptions {
  nodeId?: string;
  pioneerId?: string;
  role?: string;
  intervalMs?: number;
}

export function useNodeHeartbeat(
  optionsOrNodeId: NodeHeartbeatOptions | string = 'Node-001-X570-Taichi',
  legacyIntervalMs: number = 60000
) {
  const options: NodeHeartbeatOptions =
    typeof optionsOrNodeId === 'string'
      ? { nodeId: optionsOrNodeId, intervalMs: legacyIntervalMs }
      : optionsOrNodeId;

  const {
    nodeId = 'Node-001-X570-Taichi',
    pioneerId = 'usr_pioneer_mommydors',
    role = 'PRIMARY_VALIDATOR',
    intervalMs = 60000,
  } = options;

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const sendHeartbeat = useCallback(async () => {
    try {
      await fetch('/api/node-telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId,
          pioneerId,
          role,
          timestamp: new Date().toISOString(),
          uptimeShield: 92.4,
          status: 'ONLINE',
        }),
      });
    } catch {
      // Telemetry heartbeat fails silently without blocking UI
    }
  }, [nodeId, pioneerId, role]);

  useEffect(() => {
    sendHeartbeat();
    timerRef.current = setInterval(sendHeartbeat, intervalMs);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [sendHeartbeat, intervalMs]);
}
