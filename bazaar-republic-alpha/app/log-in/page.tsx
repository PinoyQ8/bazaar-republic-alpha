'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';

export default function PioneerLogin() {
  const router = useRouter();
  const [isSdkLoaded, setIsSdkLoaded] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  
  // Two-Stage State Management
  const [verifiedUsername, setVerifiedUsername] = useState<string>('');
  const [walletInput, setWalletInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Initialize Pi SDK once the script loads
  const initializePi = () => {
    if (typeof window !== 'undefined' && window.Pi) {
      window.Pi.init({ version: "2.0", sandbox: true }); 
      setIsSdkLoaded(true);
      console.log('[MESH-SYNC] Pi SDK Initialized');
    }
  };

  // STAGE 1: Cryptographic Identity Verification
  const authenticateIdentity = async () => {
    setStatusMessage('');
    setIsProcessing(true);

    try {
      if (!isSdkLoaded || !window.Pi) throw new Error("Pi SDK offline. Use Pi Browser.");

      setStatusMessage('Requesting Identity Verification...');
      const scopes = ['username', 'payments']; // STRICTLY ONLY VALID SCOPES
      
      const onIncompletePaymentFound = (payment: any) => {
        console.log("[MESH-SCAN] Incomplete payment found:", payment);
      };

      const authResult = await window.Pi.authenticate(scopes, onIncompletePaymentFound);
      setVerifiedUsername(authResult.user.username);
      setStatusMessage(`Identity Confirmed: @${authResult.user.username}`);
    } catch (error: any) {
      setStatusMessage(`AUTH ERROR: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // STAGE 2: Hard-Code the Security Circle Node
  const executeNodeLock = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage('');
    
    if (!walletInput.startsWith('G') || walletInput.length !== 56) {
      setStatusMessage('ERROR: Invalid Public Key. Must start with G and be 56 characters.');
      return;
    }

    setIsProcessing(true);

    try {
      setStatusMessage('Transmitting to Neon Hard Drive...');

      const response = await fetch('/api/mesh-scan/register-node', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: verifiedUsername, walletAddress: walletInput })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to lock node into the MESH.');
      }

      const masterTS = `BZR_${Date.now()}_${crypto.randomUUID()}`;
      localStorage.setItem('MASTER_TS', masterTS);
      setStatusMessage('Node Locked. Rerouting to Academy...');
      
      setTimeout(() => {
        router.push('/mesh-scan'); // Redirects directly to the dashboard to see the result
      }, 800);

    } catch (error: any) {
      setStatusMessage(`SYNC ERROR: ${error.message}`);
      setIsProcessing(false);
    }
  };

  return (
    <main style={{ maxWidth: '384px', margin: '0 auto', padding: '24px', fontFamily: 'monospace', color: '#e0e0e0' }}>
      
      <Script src="https://sdk.minepi.com/pi-sdk.js" strategy="afterInteractive" onLoad={initializePi} />

      <div style={{ borderBottom: '1px solid #333', paddingBottom: '16px', marginBottom: '24px' }}>
        <h2 style={{ color: '#00d28a', margin: '0 0 8px 0', letterSpacing: '1px' }}>THE LOGIC FORGE</h2>
        <p style={{ margin: 0, fontSize: '14px', color: '#888' }}>
          Status: <span style={{ color: isSdkLoaded ? '#00d28a' : '#ff4444' }}>
            {isSdkLoaded ? 'SDK Active' : 'L1 Node Disconnected'}
          </span>
        </p>
      </div>

      <div>
        <h3 style={{ margin: '0 0 12px 0', letterSpacing: '1px' }}>PIONEER REGISTRATION</h3>
        
        {/* DYNAMIC UI MESSAGING */}
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

        {/* STAGE 1: AUTHENTICATE */}
        {!verifiedUsername ? (
          <button
            onClick={authenticateIdentity}
            style={{ 
              width: '100%', padding: '14px', backgroundColor: isProcessing || !isSdkLoaded ? '#222' : '#00d28a', 
              color: isProcessing || !isSdkLoaded ? '#666' : '#000', border: 'none', borderRadius: '4px', 
              fontWeight: 'bold', cursor: isProcessing || !isSdkLoaded ? 'not-allowed' : 'pointer',
              textTransform: 'uppercase', letterSpacing: '1px'
            }}
            disabled={isProcessing || !isSdkLoaded}
          >
            {isProcessing ? 'Verifying Identity...' : 'Step 1: Authenticate Identity'}
          </button>
        ) : (
          /* STAGE 2: LOCK NODE */
          <form onSubmit={executeNodeLock}>
            <p style={{ fontSize: '14px', color: '#aaa', marginBottom: '16px' }}>
              Identity verified. Please paste your Testnet Public Key to lock your slot in the Security Circle.
            </p>
            <input
              type="text"
              value={walletInput}
              onChange={(e) => setWalletInput(e.target.value.trim())}
              placeholder="G..."
              style={{ 
                width: '100%', padding: '14px', marginBottom: '16px', backgroundColor: '#0a0a0f', 
                border: '1px solid #333', color: '#00d28a', borderRadius: '4px', fontFamily: 'monospace',
                outline: 'none', boxSizing: 'border-box'
              }}
              disabled={isProcessing}
            />
            <button
              type="submit"
              style={{ 
                width: '100%', padding: '14px', backgroundColor: isProcessing ? '#222' : '#00d28a', 
                color: isProcessing ? '#666' : '#000', border: 'none', borderRadius: '4px', 
                fontWeight: 'bold', cursor: isProcessing ? 'not-allowed' : 'pointer',
                textTransform: 'uppercase', letterSpacing: '1px'
              }}
              disabled={isProcessing}
            >
              {isProcessing ? 'Forging Master TS...' : 'Step 2: Lock Node'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}