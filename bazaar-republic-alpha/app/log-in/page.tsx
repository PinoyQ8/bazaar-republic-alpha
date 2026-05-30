// TARGET FILE PATH: [project-root]/app/log-in/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PioneerLogin() {
  const router = useRouter();
  const [nodeKey, setNodeKey] = useState<string>('');
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');

  const executeSync = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (nodeKey.trim().length < 8) {
      setAuthError('INVALID KEY: Node Key must be at least 8 characters.');
      return;
    }

    setIsAuthenticating(true);

    setTimeout(() => {
      const masterTS = `BZR_${Date.now()}_${crypto.randomUUID()}`;
      localStorage.setItem('MASTER_TS', masterTS);
      console.log('[MESH-SYNC] Master TS Generated & Stored. Rerouting to Academy.');
      router.push('/academy');
    }, 800);
  };

  return (
    <main style={{ maxWidth: '384px', margin: '0 auto', padding: '16px' }}>
      <div>
        <h2>THE LOGIC FORGE</h2>
        <p>Status: L1 Node Disconnected</p>
      </div>

      <hr />

      <div style={{ marginTop: '24px' }}>
        <h3>PIONEER AUTHENTICATION</h3>
        <p>Please provide your authorized Node Key to synchronize the E-Network.</p>

        <form onSubmit={executeSync} style={{ marginTop: '16px' }}>
          <input
            type="password"
            value={nodeKey}
            onChange={(e) => setNodeKey(e.target.value)}
            placeholder="Enter Node Key..."
            style={{ width: '100%', padding: '8px', marginBottom: '12px', color: '#000' }}
            disabled={isAuthenticating}
          />
          
          {authError && <p style={{ color: '#ff4444', fontSize: '14px', marginBottom: '12px' }}>{authError}</p>}

          <button
            type="submit"
            style={{ width: '100%', padding: '10px' }}
            disabled={isAuthenticating}
          >
            {isAuthenticating ? 'Forging Master TS...' : 'Initialize Sync'}
          </button>
        </form>
      </div>
    </main>
  );
}