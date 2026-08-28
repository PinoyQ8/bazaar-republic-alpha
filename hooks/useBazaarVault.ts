// Location: hooks/useBazaarVault.ts
'use client';

import { useState, useCallback } from 'react';
import { VaultEscrowRecord } from '@/types/bazaar-vault';

export function useBazaarVault() {
  const [escrow, setEscrow] = useState<VaultEscrowRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isSigningBiometric, setIsSigningBiometric] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const parseApiResponse = async (res: Response) => {
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await res.text();
      throw new Error(`Server returned non-JSON response (${res.status}): ${text.slice(0, 80)}...`);
    }
    return res.json();
  };

  // 1. Fetch On-Chain Escrow State (Checks /api/vault, falls back gracefully)
  const fetchVault = useCallback(async (escrowId: string) => {
    if (!escrowId) return null;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/vault?escrowId=${encodeURIComponent(escrowId)}`);
      const data = await parseApiResponse(res);

      if (!res.ok || (!data.found && !data.vault)) {
        setEscrow(null);
        if (!res.ok) setError(data.error || 'Failed to fetch vault state');
        return null;
      }

      const activeVault = data.vault || data;
      setEscrow(activeVault);
      return activeVault;
    } catch (err: any) {
      setError(err.message || 'Network error querying vault ledger');
      setEscrow(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Direct Release Action
  const releaseFunds = useCallback(
    async (escrowId: string, consumerAddress?: string, secretKey?: string) => {
      setLoading(true);
      setError(null);
      setTxHash(null);

      try {
        const activeConsumer = consumerAddress || escrow?.consumer;
        if (!activeConsumer) {
          throw new Error('Consumer address required to release escrow.');
        }

        const res = await fetch('/api/vault', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'RELEASE',
            escrowId,
            consumerAddress: activeConsumer,
            secretKey,
          }),
        });

        const data = await parseApiResponse(res);
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to release escrow funds.');
        }

        const hash = data.result?.hash || data.txHash || 'SETTLED_ON_CHAIN';
        setTxHash(hash);
        await fetchVault(escrowId);
        return hash;
      } catch (err: any) {
        setError(err.message || 'Release transaction failed');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [escrow, fetchVault]
  );

  // 3. Biometric Passkey / Knox Release
  const releaseFundsBiometric = useCallback(
    async (escrowId: string, consumerAddress: string) => {
      setIsSigningBiometric(true);
      setError(null);
      setTxHash(null);

      try {
        if (typeof window === 'undefined' || !window.PublicKeyCredential) {
          throw new Error('WebAuthn / Biometric Secure Enclave not supported in this browser.');
        }

        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        const assertion = (await navigator.credentials.get({
          publicKey: {
            challenge,
            rpId: window.location.hostname,
            userVerification: 'preferred',
            timeout: 60000,
          },
        })) as PublicKeyCredential;

        if (!assertion) {
          throw new Error('Biometric passkey authentication cancelled.');
        }

        const response = assertion.response as AuthenticatorAssertionResponse;
        const signaturePayload = {
          credentialId: assertion.id,
          clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(response.clientDataJSON))),
          authenticatorData: btoa(String.fromCharCode(...new Uint8Array(response.authenticatorData))),
          signature: btoa(String.fromCharCode(...new Uint8Array(response.signature))),
        };

        const res = await fetch('/api/vault', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'RELEASE',
            escrowId,
            consumerAddress,
            biometricSignature: signaturePayload,
          }),
        });

        const data = await parseApiResponse(res);
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'On-chain biometric release failed.');
        }

        const confirmedHash = data.result?.hash || data.txHash || 'SETTLED_ON_CHAIN';
        setTxHash(confirmedHash);
        await fetchVault(escrowId);
        return confirmedHash;
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          setError('Biometric verification cancelled.');
        } else {
          setError(err.message || 'Biometric settlement failed.');
        }
        throw err;
      } finally {
        setIsSigningBiometric(false);
      }
    },
    [fetchVault]
  );

  // 4. Raise DAO Dispute
  const disputeEscrow = useCallback(
    async (escrowId: string, callerAddress?: string, secretKey?: string) => {
      setLoading(true);
      setError(null);

      try {
        const address = callerAddress || escrow?.consumer;
        const res = await fetch('/api/vault', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'DISPUTE',
            escrowId,
            consumerAddress: address,
            secretKey,
          }),
        });

        const data = await parseApiResponse(res);
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to flag escrow dispute.');
        }

        const hash = data.result?.hash || data.txHash || 'DISPUTED_ON_CHAIN';
        setTxHash(hash);
        await fetchVault(escrowId);
        return hash;
      } catch (err: any) {
        setError(err.message || 'Dispute execution failed');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [escrow, fetchVault]
  );

  // 5. Timelock Clawback / Refund
  const refundFunds = useCallback(
    async (escrowId: string, initiatorAddress?: string, secretKey?: string) => {
      setLoading(true);
      setError(null);

      try {
        const address = initiatorAddress || escrow?.consumer;
        const res = await fetch('/api/vault', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'REFUND',
            escrowId,
            consumerAddress: address,
            secretKey,
          }),
        });

        const data = await parseApiResponse(res);
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to execute refund.');
        }

        const hash = data.result?.hash || data.txHash || 'REFUNDED_ON_CHAIN';
        setTxHash(hash);
        await fetchVault(escrowId);
        return hash;
      } catch (err: any) {
        setError(err.message || 'Refund execution failed');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [escrow, fetchVault]
  );

  return {
    escrow,
    loading,
    isSigningBiometric,
    error,
    txHash,
    fetchVault,
    releaseFunds,
    releaseFundsBiometric,
    disputeEscrow,
    refundFunds,
  };
}