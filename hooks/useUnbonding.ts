'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/context/WalletContext';
import { Client as UnbondingClient } from '@/src/contracts/mesh_unbounding/src/index';

const UNBOUNDING_ID = process.env.NEXT_PUBLIC_UNBOUNDING_CONTRACT_ID || '';
const RPC_URL = process.env.NEXT_PUBLIC_STELLAR_RPC_URL || 'http://localhost:8000/rpc';
const NETWORK_PASSPHRASE = process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE || 'Standalone Network ; February 2017';

export interface UnbondingQueueItem {
  id: bigint;
  amount: bigint;
  requestedAt: number;
  unlockTimestamp: number;
  claimed: boolean;
}

export function useUnbonding() {
  const { account, signTransaction, isConnected } = useWallet();
  const [userQueue, setUserQueue] = useState<UnbondingQueueItem[]>([]);
  const [maturedAmount, setMaturedAmount] = useState<bigint>(BigInt(0));
  const [totalUnbonding, setTotalUnbonding] = useState<bigint>(BigInt(0));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const activeAddress = account?.publicKey || account?.address;

  const getClient = useCallback(() => {
    if (!UNBOUNDING_ID) throw new Error('Unbonding contract ID is not configured');
    return new UnbondingClient({
      contractId: UNBOUNDING_ID,
      rpcUrl: RPC_URL,
      networkPassphrase: NETWORK_PASSPHRASE,
      publicKey: activeAddress ?? undefined,
      signTransaction: async (xdr: string) => {
        const signedTxXdr = await signTransaction(xdr);
        return {
          signedTxXdr,
          signerAddress: activeAddress,
        };
      },
    });
  }, [activeAddress, signTransaction]);

  const refreshUnbondingData = useCallback(async () => {
    if (!UNBOUNDING_ID) return;
    setIsLoading(true);
    setError(null);

    try {
      const client = getClient();

      const totalRes = await client.get_total_unbonding();
      const totalVal = typeof totalRes === 'object' && 'result' in (totalRes as any) ? (totalRes as any).result : totalRes;
      setTotalUnbonding(BigInt(totalVal?.toString() || '0'));

      if (activeAddress) {
        const queueRes = await client.get_user_queue({ user: activeAddress });
        const queueData = (typeof queueRes === 'object' && 'result' in (queueRes as any) ? (queueRes as any).result : queueRes) || [];

        const formattedQueue: UnbondingQueueItem[] = queueData.map((item: any) => ({
          id: BigInt(item.id?.toString() || '0'),
          amount: BigInt(item.amount?.toString() || '0'),
          requestedAt: Number(item.requested_at || 0),
          unlockTimestamp: Number(item.unlock_timestamp || 0),
          claimed: Boolean(item.claimed),
        }));
        setUserQueue(formattedQueue);

        const maturedRes = await client.get_matured_amount({ user: activeAddress });
        const maturedVal = typeof maturedRes === 'object' && 'result' in (maturedRes as any) ? (maturedRes as any).result : maturedRes;
        setMaturedAmount(BigInt(maturedVal?.toString() || '0'));
      } else {
        setUserQueue([]);
        setMaturedAmount(BigInt(0));
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to synchronize unbonding state');
    } finally {
      setIsLoading(false);
    }
  }, [activeAddress, getClient]);

  useEffect(() => {
    refreshUnbondingData();
  }, [refreshUnbondingData, isConnected]);

  const startUnbonding = async (amountStroops: bigint, cooldownSec: number) => {
    if (!activeAddress) throw new Error('Wallet not connected');
    setIsLoading(true);
    setError(null);

    try {
      const client = getClient();
      const tx = await client.start_unbonding({
        from: activeAddress,
        amount: amountStroops,
        cooldown_sec: BigInt(cooldownSec),
      });

      const res = typeof tx === 'object' && 'signAndSend' in tx ? await tx.signAndSend() : tx;
      await refreshUnbondingData();
      return res;
    } catch (err: any) {
      const msg = String(err?.message || err);
      if (msg.includes('Contract, #4') || msg.includes('InvalidCooldown')) {
        setError('Cooldown duration is below minimum security threshold.');
      } else {
        setError(msg);
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const claimMatured = async () => {
    if (!activeAddress) throw new Error('Wallet not connected');
    setIsLoading(true);
    setError(null);

    try {
      const client = getClient();
      const tx = await client.claim_matured({ to: activeAddress });
      const res = typeof tx === 'object' && 'signAndSend' in tx ? await tx.signAndSend() : tx;
      await refreshUnbondingData();
      return res;
    } catch (err: any) {
      const msg = String(err?.message || err);
      if (msg.includes('Contract, #5') || msg.includes('NoMaturedRequests')) {
        setError('No matured unbonding requests ready for claim.');
      } else {
        setError(msg);
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    userQueue,
    maturedAmount,
    totalUnbonding,
    isLoading,
    error,
    startUnbonding,
    claimMatured,
    refreshUnbondingData,
  };
}
