// Location: app/hooks/usePassportGate.ts
import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

export type PassportTier = 'UNREGISTERED' | 'CADET' | 'PROVIDER' | 'CUSTODIAN' | 'ELDER' | 'FOUNDER';

interface PassportState {
  isAuthorized: boolean;
  tier: PassportTier;
  issuedAt: number | null;
}

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
      // Route the query through your Soroban Relayer Service
      const response = await fetch(`/api/mesh/passport-verify?wallet=${walletAddress}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to query Soroban vault state');
      }

      const data = await response.json();
      
      setPassport({
        isAuthorized: data.isIssued && !data.isRevoked,
        tier: data.tierLevel || 'UNREGISTERED',
        issuedAt: data.timestamp || null,
      });

    } catch (error: any) {
      console.error('[PASSPORT-GATE] On-Chain Verification Fault:', error);
      setGateError(error.message);
      setPassport({ isAuthorized: false, tier: 'UNREGISTERED', issuedAt: null });
    } finally {
      setIsQuerying(false);
    }
  }, []);

  return {
    passport,
    isQuerying,
    gateError,
    verifyOnChainPassport,
    activeWallet: pioneer.uid,
  };
}