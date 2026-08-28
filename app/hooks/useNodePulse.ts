// PROJECT BAZAAR DAO - PROTOCOL 26.1
// HOOK: BACKGROUND NODE PULSE & TELEMETRY SYNC

"use client";

import { useEffect, useState, useRef, useCallback } from 'react';

export interface PulseState {
  status: 'SYNCED' | 'DEGRADED' | 'OFFLINE';
  latencyMs: number;
  latestLedger: number;
  lastPulseTime: number | null;
  errorCount: number;
}

export function useNodePulse(pioneerId?: string, isAuthenticated?: boolean) {
  const [pulse, setPulse] = useState<PulseState>({
    status: 'SYNCED', // Default optimistic sync to prevent UI flash
    latencyMs: 0,
    latestLedger: 4255231,
    lastPulseTime: null,
    errorCount: 0,
  });

  const isExecutingRef = useRef(false);

  const sendHeartbeat = useCallback(async () => {
    if (isExecutingRef.current) return;
    isExecutingRef.current = true;

    const activeUid =
      pioneerId ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('mesh_pioneer_uid') || localStorage.getItem('pioneer_id')
        : undefined);

    const isAuthed =
      isAuthenticated ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('mesh_session_active') === 'true'
        : false);

    const start = performance.now();

    try {
      // Primary: Query live telemetry route
      const res = await fetch('/api/mesh-scan', { cache: 'no-store' });
      const latency = Math.round(performance.now() - start);

      if (res.ok) {
        const data = await res.json();
        const telemetry = data.telemetry || {};
        const ledger = telemetry.latest_ledger || data.network?.latestLedger || 4255231;

        setPulse({
          status: 'SYNCED',
          latencyMs: latency,
          latestLedger: ledger,
          lastPulseTime: Date.now(),
          errorCount: 0,
        });
      } else {
        throw new Error(`Telemetry responded with status ${res.status}`);
      }
    } catch (error) {
      console.warn('[PULSE WARNING] Telemetry ping lag, engaging resilient lock:', error);
      setPulse((prev) => ({
        ...prev,
        status: !activeUid && !isAuthed ? 'OFFLINE' : prev.errorCount >= 3 ? 'DEGRADED' : 'SYNCED',
        latencyMs: Math.round(performance.now() - start),
        lastPulseTime: Date.now(),
        errorCount: prev.errorCount + 1,
      }));
    } finally {
      isExecutingRef.current = false;
    }
  }, [pioneerId, isAuthenticated]);

  useEffect(() => {
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 15000);
    return () => clearInterval(interval);
  }, [sendHeartbeat]);

  return pulse;
}