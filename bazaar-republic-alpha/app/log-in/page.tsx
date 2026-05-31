'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';

export default function PioneerLogin() {
  const router = useRouter();
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isSdkLoaded, setIsSdkLoaded] = useState<boolean>(false);

  // Initialize Pi SDK once the script loads
  const initializePi = () => {
    if (typeof window !== 'undefined' && window.Pi) {
      // NOTE: Set sandbox to false when pushing to Production/Mainnet
      window.Pi.init({ version: "2.0", sandbox: true }); 
      setIsSdkLoaded(true);
      console.log('[MESH-SYNC] Pi SDK Initialized');
    }
  };

  const executePiSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage('');
    setIsAuthenticating(true);

    try {
      if (!isSdkLoaded || !window.Pi) {
        throw new Error("Pi SDK offline. Ensure you are accessing via the Pi Browser.");
      }

      setStatusMessage('Requesting E-Network Scopes...');
      
      const scopes = ['username', 'payments', 'wallet_address'];
      const onIncompletePaymentFound = (payment: any) => {
        console.log("[MESH-SCAN] Incomplete payment found:", payment);
      };

      // 1. Trigger Native Pi Browser Authentication
      const authResult = await window.Pi.authenticate(scopes, onIncompletePaymentFound);
      
      const pioneerUsername = authResult.user.username;
      const pioneerWallet = authResult.user.wallet_address;

      setStatusMessage(`Wallet Captured: ${pioneerWallet.substring(0, 8)}...`);

      // 2. Transmit to Backend Guardrail (Max 10 Wallets)
      const response = await fetch('/api/mesh-scan/register-node', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: pioneerUsername, walletAddress: pioneerWallet })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to lock node into the MESH.');
      }

      // 3. Forge Master TS and Bridge to Academy
      const masterTS = `BZR_${Date.now()}_${crypto.randomUUID()}`;
      localStorage.setItem('MASTER_TS', masterTS);
      setStatusMessage('Node Locked. Rerouting to Academy...');
      
      setTimeout(() => {
        router.push('/academy');
      }, 800);

    } catch (error: any) {
      setStatusMessage(`SYNC ERROR: ${error.message}`);
      setIsAuthenticating(false);
    }
  };

  return (
    <main style={{ maxWidth: '384px', margin: '0 auto', padding: '24px', fontFamily: 'monospace', color: '#e0e0e0' }}>
      
      {/* NATIVE SDK INJECTION */}
      <Script 
        src="https://sdk.minepi.com/pi-sdk.js" 
        strategy="afterInteractive"
        onLoad={initializePi}
      />

      <div style={{ borderBottom: '1px solid #333', paddingBottom: '16px', marginBottom: '24px' }}>
        <h2 style={{ color: '#00d28a', margin: '0 0 8px 0', letterSpacing: '1px' }}>THE LOGIC FORGE</h2>
        <p style={{ margin: 0, fontSize: '14px', color: '#888' }}>
          Status: <span style={{ color: isSdkLoaded ? '#00d28a' : '#ff4444' }}>
            {isSdkLoaded ? 'SDK Active' : 'L1 Node Disconnected'}
          </span>
        </p>
      </div>

      <div>
        <h3 style={{ margin: '0 0 12px 0', letterSpacing: '1px' }}>PIONEER AUTHENTICATION</h3>
        <p style={{ fontSize: '14px', color: '#aaa', marginBottom: '24px', lineHeight: '1.5' }}>
          Execute the sync sequence below. The MESH will automatically capture your public wallet address to lock your position in the Security Circle.
        </p>

        <form onSubmit={executePiSync}>
          
          {statusMessage && (
            <p style={{ 
              color: statusMessage.includes('ERROR') ? '#ff4444' : '#00d28a', 
              fontSize: '12px', 
              marginBottom: '16px', 
              borderLeft: `2px solid ${statusMessage.includes('ERROR') ? '#ff4444' : '#00d28a'}`, 
              paddingLeft: '8px',
              wordBreak: 'break-all'
            }}>
              {statusMessage}
            </p>
          )}

          {/* SECURE ACTION BUTTON */}
          <button
            type="submit"
            style={{ 
              width: '100%', 
              padding: '14px', 
              backgroundColor: isAuthenticating || !isSdkLoaded ? '#222' : '#00d28a', 
              color: isAuthenticating || !isSdkLoaded ? '#666' : '#000', 
              border: 'none', 
              borderRadius: '4px', 
              fontWeight: 'bold', 
              cursor: isAuthenticating || !isSdkLoaded ? 'not-allowed' : 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              boxSizing: 'border-box'
            }}
            disabled={isAuthenticating || !isSdkLoaded}
          >
            {isAuthenticating ? 'Forging Master TS...' : 'Initialize Sync'}
          </button>
        </form>
      </div>
    </main>
  );
}