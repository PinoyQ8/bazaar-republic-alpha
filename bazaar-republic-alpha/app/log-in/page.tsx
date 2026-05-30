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
    <main style={{ maxWidth: '384px', margin: '0 auto', padding: '24px', fontFamily: 'monospace', color: '#e0e0e0' }}>
      
      <div style={{ borderBottom: '1px solid #333', paddingBottom: '16px', marginBottom: '24px' }}>
        <h2 style={{ color: '#00d28a', margin: '0 0 8px 0', letterSpacing: '1px' }}>THE LOGIC FORGE</h2>
        <p style={{ margin: 0, fontSize: '14px', color: '#888' }}>
          Status: <span style={{ color: '#ff4444' }}>L1 Node Disconnected</span>
        </p>
      </div>

      <div>
        <h3 style={{ margin: '0 0 12px 0', letterSpacing: '1px' }}>PIONEER AUTHENTICATION</h3>
        <p style={{ fontSize: '14px', color: '#aaa', marginBottom: '24px', lineHeight: '1.5' }}>
          Please provide your authorized Node Key to synchronize the E-Network.
        </p>

        <form onSubmit={executeSync}>
          {/* SECURE INPUT FIELD */}
          <input
            type="password"
            value={nodeKey}
            onChange={(e) => setNodeKey(e.target.value)}
            placeholder="Enter Node Key..."
            style={{ 
              width: '100%', 
              padding: '14px', 
              marginBottom: '16px', 
              backgroundColor: '#0a0a0f', // Deep dark background
              border: '1px solid #333', // Visible border
              color: '#00d28a', // MESH Green text
              borderRadius: '4px',
              fontFamily: 'monospace',
              outline: 'none',
              boxSizing: 'border-box'
            }}
            disabled={isAuthenticating}
          />
          
          {authError && (
            <p style={{ color: '#ff4444', fontSize: '12px', marginBottom: '16px', borderLeft: '2px solid #ff4444', paddingLeft: '8px' }}>
              {authError}
            </p>
          )}

          {/* SECURE ACTION BUTTON */}
          <button
            type="submit"
            style={{ 
              width: '100%', 
              padding: '14px', 
              backgroundColor: isAuthenticating ? '#222' : '#00d28a', 
              color: isAuthenticating ? '#666' : '#000', 
              border: 'none', 
              borderRadius: '4px', 
              fontWeight: 'bold', 
              cursor: isAuthenticating ? 'not-allowed' : 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              boxSizing: 'border-box'
            }}
            disabled={isAuthenticating}
          >
            {isAuthenticating ? 'Forging Master TS...' : 'Initialize Sync'}
          </button>
        </form>
      </div>
    </main>
  );
}