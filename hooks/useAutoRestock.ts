// Location: hooks/useAutoRestock.ts
'use client';

import { useState, useCallback } from 'react';

export interface RestockOrderParams {
  merchantAddress: string;
  supplierAddress: string;
  mbzrAmount: bigint; // Total mBZR allocated (1 Pi = 1,000 mBZR)
  escrowId: string;
  durationLedgers?: number; // Defaults to ~48h (34,560 ledgers @ ~5s)
  sku?: string;
  quantity?: number;
}

export interface RestockExecutionResult {
  success: boolean;
  txHash: string;
  unlockedPi: string;
  escrowId: string;
  exitTariffPi?: number;
}

function bufferToBase64Url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function useAutoRestock() {
  const [isPromptingBiometric, setIsPromptingBiometric] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>('IDLE');
  const [error, setError] = useState<string | null>(null);

  const executeAutoRestock = useCallback(
    async (params: RestockOrderParams): Promise<RestockExecutionResult> => {
      const {
        merchantAddress,
        supplierAddress,
        mbzrAmount,
        escrowId,
        durationLedgers = 34560,
        sku = 'WHOLESALE_RESTOCK_BATCH',
        quantity = 1,
      } = params;

      setIsPromptingBiometric(true);
      setError(null);
      setStatusText('INITIALIZING_SECURITY_ENCLAVE');

      try {
        if (mbzrAmount <= 0n) {
          throw new Error('Invalid mBZR amount: allocation must be greater than 0.');
        }

        // Convert mBZR (BigInt) to precise decimal Pi string (1 Pi = 1,000 mBZR)
        const piValueNumeric = Number(mbzrAmount) / 1000;
        const cleanEscrowId = escrowId.replace(/-/g, '_');

        // 1. Build Deterministic Challenge Hash
        const rawPayload = `${cleanEscrowId}:${merchantAddress}:${supplierAddress}:${mbzrAmount.toString()}`;
        const encoder = new TextEncoder();
        const payloadHash = await window.crypto.subtle.digest('SHA-256', encoder.encode(rawPayload));
        const challengeBuffer = new Uint8Array(payloadHash);

        setStatusText('AWAITING_BIOMETRIC_TOUCH');

        let biometricPayload: {
          credentialId: string;
          rawId: string;
          clientDataJSON: string;
          authenticatorData: string;
          signature: string;
        } | null = null;

        const isSecure = typeof window !== 'undefined' && window.isSecureContext;

        // 2. Hardware Enclave Authentication (FIDO2 / Knox Passkey)
        if (isSecure && 'credentials' in navigator && Boolean(navigator.credentials?.get)) {
          const assertion = (await navigator.credentials.get({
            publicKey: {
              challenge: challengeBuffer,
              rpId: window.location.hostname || 'localhost',
              userVerification: 'required',
              timeout: 60000,
            },
          })) as PublicKeyCredential | null;

          if (!assertion) {
            throw new Error('Biometric passkey authorization was aborted.');
          }

          const assertionResponse = assertion.response as AuthenticatorAssertionResponse;
          biometricPayload = {
            credentialId: assertion.id,
            rawId: bufferToBase64Url(assertion.rawId),
            clientDataJSON: bufferToBase64Url(assertionResponse.clientDataJSON),
            authenticatorData: bufferToBase64Url(assertionResponse.authenticatorData),
            signature: bufferToBase64Url(assertionResponse.signature),
          };
        } else {
          // 🛡️ Fallback for LAN testing on mobile (http://192.168.8.108:3000)
          console.warn('[MESH-AUTH] Insecure context (LAN IP) detected. Generating cryptographic dev attestation.');
          biometricPayload = {
            credentialId: `knox-s23-${Math.random().toString(36).substring(2, 9)}`,
            rawId: bufferToBase64Url(challengeBuffer),
            clientDataJSON: bufferToBase64Url(new TextEncoder().encode(rawPayload)),
            authenticatorData: bufferToBase64Url(new TextEncoder().encode('knox_hardware_enclave_sim')),
            signature: bufferToBase64Url(challengeBuffer),
          };
        }

        setIsPromptingBiometric(false);
        setIsSubmitting(true);
        setStatusText('RELAYING_ATOMIC_SOROBAN_CALL');

        // Convert ledgers (~5s each) to explicit duration_secs for Soroban
        const durationSecs = durationLedgers * 5;

        // 3. Dispatch to Wholesale Pipeline
        const res = await fetch('/api/mesh/wholesale/auto-restock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            retailerUid: merchantAddress,
            supplierAddress,
            sku,
            quantity,
            totalPiAmount: piValueNumeric,
            durationSecs,
            channelTicketId: `TKT_${cleanEscrowId}`,
            passkeyAssertion: biometricPayload,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'On-chain auto-restock transaction failed.');
        }

        setStatusText('SETTLED_ON_CHAIN');

        return {
          success: true,
          txHash: data.txHash || data.result?.hash || 'SETTLED_ON_CHAIN',
          unlockedPi: piValueNumeric.toFixed(3),
          escrowId: data.escrowId || cleanEscrowId,
          exitTariffPi: data.exitTariffPi,
        };
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          setError('Biometric verification cancelled by user.');
        } else {
          setError(err.message || 'Wholesale restock invocation failed.');
        }
        setStatusText('FAILED');
        throw err;
      } finally {
        setIsPromptingBiometric(false);
        setIsSubmitting(false);
      }
    },
    []
  );

  return {
    executeAutoRestock,
    isPromptingBiometric,
    isSubmitting,
    statusText,
    error,
  };
}