'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

export type PassportTier =
  | 'UNREGISTERED'
  | 'CADET'
  | 'PROVIDER'
  | 'CUSTODIAN'
  | 'ELDER'
  | 'FOUNDER';

export interface PassportState {
  isAuthorized: boolean;
  tier: PassportTier;
  issuedAt: number | null;
}

const VALID_TIERS: PassportTier[] = [
  'UNREGISTERED',
  'CADET',
  'PROVIDER',
  'CUSTODIAN',
  'ELDER',
  'FOUNDER',
];

export function usePassportGate() {
  const { pioneer } = useAuth();
  const [passport, setPassport] = useState<PassportState>({
    isAuthorized: false,
    tier: 'UNREGISTERED',
    issuedAt: null,
  });
  const [isQuerying, setIsQuerying] = useState<boolean>(false);
  const [gateError, setGateError] = useState<string | null>(null);

  const verifyOnChainPassport = useCallback(async (walletAddress: string) => {
    if (!walletAddress) return;

    setIsQuerying(true);
    setGateError(null);

    try {
      const response = await fetch(
        `/api/mesh/passport-verify?wallet=${encodeURIComponent(walletAddress)}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to query Soroban vault state (${response.status})`);
      }

      const data = await response.json();
      const rawTier = typeof data?.tier === 'string' ? data.tier.toUpperCase() : '';
      const resolvedTier: PassportTier = VALID_TIERS.includes(rawTier as PassportTier)
        ? (rawTier as PassportTier)
        : 'UNREGISTERED';

      const nextState: PassportState = {
        isAuthorized: Boolean(data?.isAuthorized ?? resolvedTier !== 'UNREGISTERED'),
        tier: resolvedTier,
        issuedAt: typeof data?.issuedAt === 'number' ? data.issuedAt : null,
      };

      setPassport(nextState);
      return nextState;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unexpected passport verification error';
      setGateError(message);
      setPassport({
        isAuthorized: false,
        tier: 'UNREGISTERED',
        issuedAt: null,
      });
      return null;
    } finally {
      setIsQuerying(false);
    }
  }, []);

  return {
    pioneer,
    passport,
    isQuerying,
    gateError,
    verifyOnChainPassport,
  };
}

export default usePassportGate;