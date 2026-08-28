// Location: app/hooks/useMeshCurrency.ts
"use client";

import { useState, useEffect } from 'react';
import { getMasterMeshConfig } from '@/app/utils/meshConfig';

export function useMeshCurrency() {
  // Default to Test-Pi as a secure fallback
  const [currency, setCurrency] = useState({ 
    text: 'Test-Pi', 
    symbol: 'Test-π' 
  });

  useEffect(() => {
    const config = getMasterMeshConfig();
    
    if (config.network === 'MAINNET') {
      setCurrency({ text: 'Pi', symbol: 'π' });
    } else {
      setCurrency({ text: 'Test-Pi', symbol: 'Test-π' });
    }
  }, []);

  return currency;
}