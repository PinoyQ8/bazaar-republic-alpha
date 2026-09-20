'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useBazaarVault, EscrowDetails } from '@/hooks/useBazaarVault';

interface EscrowWidgetProps {
  orderId: string;
  consumerAddress: string;
}

export const OrderEscrowWidget: React.FC<EscrowWidgetProps> = ({ orderId, consumerAddress }) => {
  const { fetchEscrow, releaseEscrow } = useBazaarVault();
  const [escrow, setEscrow] = useState<EscrowDetails | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isQuerying, setIsQuerying] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const escrowId = `ESC_${orderId.replace(/-/g, '_')}`;

  const loadState = useCallback(async () => {
    setIsQuerying(true);
    setErrorMessage(null);
    try {
      const data = await fetchEscrow(escrowId);
      if (data) {
        setEscrow(data);
      } else {
        setErrorMessage(`Escrow record not found for ${escrowId}`);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to fetch escrow status');
    } finally {
      setIsQuerying(false);
    }
  }, [escrowId, fetchEscrow]);

  useEffect(() => {
    let isMounted = true;
    loadState();
    return () => {
      isMounted = false;
    };
  }, [escrowId]); // Only triggers when escrowId string changes

  const handleRelease = async () => {
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const hash = await releaseEscrow({
        escrowId,
        consumerAddress,
      });
      setTxHash(hash);
      await loadState();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Transaction failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (isQuerying) {
    return (
      <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-400 text-sm animate-pulse flex items-center space-x-3">
        <div className="w-4 h-4 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        <span>Querying Pi Testnet Protocol 28 ledger for {escrowId}...</span>
      </div>
    );
  }

  if (!escrow) {
    return (
      <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-300 text-sm space-y-2">
        <p className="font-semibold text-white">No active escrow found</p>
        <p className="text-xs text-zinc-400 font-mono">Target ID: {escrowId}</p>
        {errorMessage && <p className="text-xs text-red-400">{errorMessage}</p>}
        <button
          onClick={() => loadState()}
          className="mt-2 px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded"
        >
          Retry Query
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/80 shadow-lg space-y-4 text-white">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-base font-semibold text-white">Vault Escrow Status</h3>
          <p className="text-xs text-zinc-400 font-mono">Contract: CBM5...Q3RY</p>
        </div>
        <span
          className={`px-3 py-1 text-xs rounded-full font-bold uppercase tracking-wider ${
            escrow.status === 'Released'
              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
              : 'bg-amber-950 text-amber-400 border border-amber-800'
          }`}
        >
          {escrow.status}
        </span>
      </div>

      <div className="text-xs text-zinc-300 space-y-1.5 bg-zinc-950/60 p-4 rounded-lg border border-zinc-800/80">
        <div className="flex justify-between">
          <span className="text-zinc-400">Locked Amount:</span>
          <span className="font-mono font-medium text-white">
            {(Number(escrow.amount) / 10_000_000).toFixed(4)} Test-Pi
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">Protocol Version:</span>
          <span className="font-mono text-zinc-300">{escrow.protocol_version}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">Provider:</span>
          <span className="font-mono text-zinc-300 truncate max-w-55">
            {escrow.provider}
          </span>
        </div>
      </div>

      {escrow.status === 'Locked' && (
        <button
          onClick={handleRelease}
          disabled={actionLoading}
          className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 text-white font-medium text-sm rounded-lg transition shadow"
        >
          {actionLoading ? 'Releasing on Pi Testnet...' : 'Confirm Delivery & Release Funds'}
        </button>
      )}

      {txHash && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg">
          <p className="text-xs text-emerald-400 break-all font-mono">
            ✅ Tx Confirmed: {txHash}
          </p>
        </div>
      )}

      {errorMessage && <p className="text-xs text-red-400">{errorMessage}</p>}
    </div>
  );
};