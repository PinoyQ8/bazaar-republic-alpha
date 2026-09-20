// Location: hooks/useBazaarVault.ts
'use client';

import { useState, useCallback, useMemo } from 'react';
import { EscrowStatus } from '@/types/bazaar-vault';

export interface EscrowDetails {
  consumer: string;
  provider: string;
  amount: string | bigint | number;
  status: EscrowStatus;
  protocol_version: number;
  token_contract?: string;
  expires_at?: string | number | null;
}

export function useBazaarVault() {
  const [escrow, setEscrow] = useState<EscrowDetails | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Core Ledger Query
  const fetchEscrow = useCallback(async (escrowId: string) => {
    if (!escrowId || !escrowId.trim()) return null;
    setLoading(true);
    setError(null);

    try {
      const cleanId = escrowId.trim().replace(/-/g, '_');
      const res = await fetch(`/api/vault?escrowId=${cleanId}`);
      const data = await res.json();

      if (!res.ok || !data.found) {
        setEscrow(null);
        setError(data.error || `Escrow '${cleanId}' not found on ledger.`);
        return null;
      }

      const vaultData: EscrowDetails = data.vault;
      setEscrow(vaultData);
      return vaultData;
    } catch (err: any) {
      const msg = err?.message || 'Failed to fetch escrow status';
      setError(msg);
      setEscrow(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Lock Funds Mutation
  const lockEscrow = useCallback(async (params: {
    escrowId: string;
    consumerAddress: string;
    providerAddress: string;
    amount: string | number;
    timelockHours?: number;
    secretKey?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'LOCK',
          escrowId: params.escrowId,
          consumerAddress: params.consumerAddress,
          providerAddress: params.providerAddress,
          amount: params.amount.toString(),
          timelockHours: params.timelockHours,
          secretKey: params.secretKey,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Lock failed');

      setTxHash(data.txHash);
      return data.txHash;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Release Funds Mutation
  const releaseFunds = useCallback(async (escrowId: string, consumerAddress?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RELEASE',
          escrowId,
          consumerAddress,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Release failed');

      setTxHash(data.txHash);
      await fetchEscrow(escrowId);
      return data.txHash;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchEscrow]);

  // Refund / Clawback Mutation
  const refundFunds = useCallback(async (escrowId: string, consumerAddress?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REFUND',
          escrowId,
          consumerAddress,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Refund failed');

      setTxHash(data.txHash);
      await fetchEscrow(escrowId);
      return data.txHash;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchEscrow]);

  // Dispute Mutation
  const disputeEscrow = useCallback(async (escrowId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DISPUTE',
          escrowId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Dispute failed');

      setTxHash(data.txHash);
      await fetchEscrow(escrowId);
      return data.txHash;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchEscrow]);

  // Memoized adapter wrappers to prevent re-render cascades
  const releaseEscrow = useCallback(
    (params: { escrowId: string; consumerAddress?: string }) =>
      releaseFunds(params.escrowId, params.consumerAddress),
    [releaseFunds]
  );

  const refundEscrow = useCallback(
    (params: { escrowId: string; consumerAddress?: string }) =>
      refundFunds(params.escrowId, params.consumerAddress),
    [refundFunds]
  );

  return {
    // Reactive State
    escrow,
    loading,
    error,
    txHash,

    // Query methods
    fetchEscrow,
    fetchVault: fetchEscrow,

    // Mutation methods
    lockEscrow,
    lockVault: lockEscrow,
    releaseFunds,
    releaseEscrow,
    refundFunds,
    refundEscrow,
    disputeEscrow,
  };
}