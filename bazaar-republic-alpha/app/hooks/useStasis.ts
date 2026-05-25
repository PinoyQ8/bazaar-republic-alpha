'use client';

import { useState, useEffect } from 'react';

/**
 * 🛡️ MESH HOOK: useStasis
 * Checks the Recovery Ledger for an active 24-hour lock.
 */
export function useStasis(citizenUid: string) {
  const [stasisData, setStasisData] = useState<{ active: boolean; stasisEnd: string | null }>({
    active: false,
    stasisEnd: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkVault() {
      try {
        // 🚀 SYNC: Querying the Neon Bridge
        const res = await fetch(`/api/mesh-recovery/status?uid=${citizenUid}`);
        const data = await res.json();

        if (data.active) {
          setStasisData({
            active: true,
            stasisEnd: data.stasisEnd,
          });
        }
      } catch (error) {
        console.error("MESH_SCAN: Failed to reach the Recovery Ledger.", error);
      } finally {
        setLoading(false);
      }
    }

    if (citizenUid) checkVault();
  }, [citizenUid]);

  return { ...stasisData, loading };
}