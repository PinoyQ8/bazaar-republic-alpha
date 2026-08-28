// Location: hooks/useVault.ts
'use client';

import { useState, useCallback } from 'react';
import { VaultEscrowRecord } from '@/types/bazaar-vault';

export function useVault() {
  const [escrow, setEscrow] = useState<VaultEscrowRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  // 1. Fetch On-Chain Escrow State via API Relayer
  const fetchVault = useCallback(async (escrowId: string): Promise<VaultEscrowRecord | null> => {
    if (!escrowId) return null;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/vault?escrowId=${encodeURIComponent(escrowId)}`);
      const data = await res.json();

      if (!res.ok || !data.found) {
        setEscrow(null);
        if (!res.ok) setError(data.error || 'Failed to fetch vault state');
        return null;
      }

      setEscrow(data.vault);
      return data.vault;
    } catch (err: any) {
      setError(err?.message || 'Network error querying vault ledger');
      setEscrow(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. Execute On-Chain Release Action
  const releaseFunds = useCallback(
    async (escrowId: string, consumerAddress: string, secretKey?: string) => {
      setIsLoading(true);
      setError(null);
      setTxHash(null);

      try {
        const res = await fetch('/api/vault', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'RELEASE',
            escrowId,
            consumerAddress,
            secretKey,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to release escrow funds.');
        }

        const hash = data.txHash || 'SETTLED_ON_CHAIN';
        setTxHash(hash);
        await fetchVault(escrowId);
        return hash;
      } catch (err: any) {
        setError(err.message || 'Release transaction failed');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchVault]
  );

  return {
    escrow,
    isLoading,
    error,
    txHash,
    fetchVault,
    releaseFunds,
  };
}