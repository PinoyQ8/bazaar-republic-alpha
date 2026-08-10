// PROJECT BAZAAR DAO - PROTOCOL 26.1
// HOOK: BACKGROUND NODE PULSE & TELEMETRY SYNC

"use client";

import { useEffect, useState, useRef } from 'react';

interface PulseState {
  status: 'SYNCED' | 'DEGRADED' | 'OFFLINE';
  latencyMs: number;
  latestLedger: number;
  lastPulseTime: number | null;
  errorCount: number;
}

export function useNodePulse(pioneerId: string | undefined, isAuthenticated: boolean) {
  const [pulse, setPulse] = useState<PulseState>({
    status: 'OFFLINE',
    latencyMs: 0,
    latestLedger: 0,
    lastPulseTime: null,
    errorCount: 0,
  });

  const isExecutingRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !pioneerId) {
      setPulse((prev) => ({ ...prev, status: 'OFFLINE' }));
      return;
    }

    const sendHeartbeat = async () => {
      if (isExecutingRef.current) return;
      isExecutingRef.current = true;

      try {
        const response = await fetch('/api/mesh/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pioneerId,
            clientTimestamp: Date.now(),
            nodeVersion: '26.1',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setPulse({
            status: data.status || 'SYNCED',
            latencyMs: data.latencyMs || 0,
            latestLedger: data.latestLedger || 0,
            lastPulseTime: Date.now(),
            errorCount: 0,
          });
        } else {
          setPulse((prev) => ({
            ...prev,
            status: 'DEGRADED',
            errorCount: prev.errorCount + 1,
          }));
        }
      } catch (error) {
        console.warn('[PULSE WARNING] Heartbeat missed:', error);
        setPulse((prev) => ({
          ...prev,
          status: prev.errorCount >= 2 ? 'OFFLINE' : 'DEGRADED',
          errorCount: prev.errorCount + 1,
        }));
      } finally {
        isExecutingRef.current = false;
      }
    };

    // Initial heartbeat on mount/auth
    sendHeartbeat();

    // 30-second interval pulse loop
    const interval = setInterval(sendHeartbeat, 30000);

    return () => clearInterval(interval);
  }, [pioneerId, isAuthenticated]);

  return pulse;
}