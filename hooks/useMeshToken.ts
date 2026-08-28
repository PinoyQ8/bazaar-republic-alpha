// Location: hooks/useMeshToken.ts
'use client';

import { useState, useCallback } from 'react';

export const PI_TO_MBZR_RATIO = BigInt(1000);
export const TOKEN_DECIMALS = 7;
export const SUBUNIT_MULTIPLIER = BigInt(10_000_000);
export const TOTAL_FIXED_SUPPLY = BigInt(1_000_000_000) * SUBUNIT_MULTIPLIER;

export function useMeshToken() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch mBZR balance in subunits
  const getBalance = useCallback(async (userAddress: string): Promise<bigint> => {
    setIsLoading(true);
    setError(null);
    try {
      if (!userAddress) return BigInt(0);
      return BigInt(5000) * SUBUNIT_MULTIPLIER;
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch balance');
      return BigInt(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. Fetch total fixed token supply
  const getTotalSupply = useCallback(async (): Promise<bigint> => {
    return TOTAL_FIXED_SUPPLY;
  }, []);

  // 3. Convert Pi amount to BigInt mBZR subunits (7 decimals)
  const piToMbzrSubunits = useCallback((piAmount: number | string): bigint => {
    try {
      const num = typeof piAmount === 'string' ? parseFloat(piAmount) : piAmount;
      if (isNaN(num) || num < 0) return BigInt(0);
      return BigInt(Math.floor(num * 1000 * 10_000_000));
    } catch {
      return BigInt(0);
    }
  }, []);

  // 4. Convert mBZR subunits to numeric Pi value
  const mbzrSubunitsToPi = useCallback((subunits: bigint): number => {
    try {
      const piSubunits = subunits / PI_TO_MBZR_RATIO;
      return Number(piSubunits) / 10_000_000;
    } catch {
      return 0;
    }
  }, []);

  // 5. Convert Pi amount to formatted mBZR string
  const piToMbzrDisplay = useCallback((piAmount: number | string): string => {
    try {
      const num = typeof piAmount === 'string' ? parseFloat(piAmount) : piAmount;
      if (isNaN(num) || num < 0) return '0.00 mBZR';
      const mbzr = num * 1000;
      return `${mbzr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} mBZR`;
    } catch {
      return '0.00 mBZR';
    }
  }, []);

  // 6. Format subunits to mBZR string
  const formatMbzr = useCallback((subunits: bigint): string => {
    try {
      const whole = subunits / SUBUNIT_MULTIPLIER;
      const frac = subunits % SUBUNIT_MULTIPLIER;
      const fracStr = frac.toString().padStart(7, '0').slice(0, 2);
      return `${whole.toLocaleString()}.${fracStr} mBZR`;
    } catch {
      return '0.00 mBZR';
    }
  }, []);

  // 7. Format subunits to Pi equivalent string
  const formatPiEquivalent = useCallback((subunits: bigint): string => {
    try {
      const piSubunits = subunits / PI_TO_MBZR_RATIO;
      const whole = piSubunits / SUBUNIT_MULTIPLIER;
      const frac = piSubunits % SUBUNIT_MULTIPLIER;
      const fracStr = frac.toString().padStart(7, '0').slice(0, 4);
      return `${whole.toLocaleString()}.${fracStr} Pi`;
    } catch {
      return '0.0000 Pi';
    }
  }, []);

  return {
    piToMbzrRatio: PI_TO_MBZR_RATIO,
    tokenDecimals: TOKEN_DECIMALS,
    getBalance,
    getTotalSupply,
    piToMbzrSubunits,
    mbzrSubunitsToPi,
    piToMbzrDisplay,
    formatMbzr,
    formatPiEquivalent,
    isLoading,
    error,
  };
}