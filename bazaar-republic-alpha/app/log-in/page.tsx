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
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // -------------------------------------------------------------
  // 🛡️ THE MEMORY SCANNER (Prevents forced re-logins on refresh)
  // -------------------------------------------------------------
  useEffect(() => {
    const existingToken = localStorage.getItem('MASTER_TS');
    if (existingToken) {
      setStatusMessage('Persistent Node Detected. Bypassing Authentication...');
      setIsProcessing(true);
      router.push('/mesh-scan'); 
    }
  }, [router]);

  // -------------------------------------------------------------
  // 🛡️ THE SAFETY LOOP: Aggressively poll for the Pi SDK
  // -------------------------------------------------------------
  useEffect(() => {
    const checkPi = setInterval(() => {
      if (typeof window !== 'undefined' && window.Pi) {
        try {
          window.Pi.init({ version: "2.0", sandbox: true }); 
          setIsSdkLoaded(true);
          console.log('[MESH-SYNC] Pi SDK Active');
          clearInterval(checkPi); 
        } catch (err) {
          console.error("Pi SDK Init Error:", err);
        }
      }
    }, 500);

    return () => clearInterval(checkPi);
  }, []);

  // -------------------------------------------------------------
  // STAGE 1: Cryptographic Identity Verification
  // -------------------------------------------------------------
  const authenticateIdentity = async () => {
    setStatusMessage('');
    setIsProcessing(true);

    try {
      if (!isSdkLoaded || !window.Pi) throw new Error("Pi SDK offline. Relaunch Pi Browser.");

      setStatusMessage('Requesting Identity Verification...');
      const scopes = ['username', 'payments']; 
      
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

  // -------------------------------------------------------------
  // STAGE 2: 0.1 Test-Pi Cryptographic Handshake
  // -------------------------------------------------------------
  const executeHandshake = () => {
    setStatusMessage('Initiating 0.1 Test-Pi Handshake...');
    setIsProcessing(true);

    const paymentData = {
      amount: 0.1,
      memo: "Alpha Node Registration Handshake",
      metadata: { type: "node_lock" }
    };

    // The 'as any' override bypasses the outdated v1 TypeScript definitions
    const callbacks = {
      onReadyForServerApproval: async (paymentId: string) => {
        setStatusMessage('Requesting Adjudicator Approval...');
        await fetch('/api/mesh-scan/handshake', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'approve', paymentId })
        });
      },
      onReadyForServerCompletion: async (paymentId: string, txid: string) => {
        setStatusMessage('Locking Cryptographic Signature...');
        const res = await fetch('/api/mesh-scan/handshake', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'complete', paymentId, txid, username: verifiedUsername })
        });

        if (res.ok) {
          const masterTS = `BZR_${Date.now()}_${crypto.randomUUID()}`;
          localStorage.setItem('MASTER_TS', masterTS);
          setStatusMessage('Node Locked. Rerouting...');
          setTimeout(() => router.push('/mesh-scan'), 800);
        } else {
          setStatusMessage('ERROR: Neon Sync Failed.');
          setIsProcessing(false);
        }
      },
      onCancel: (paymentId: string) => {
        setStatusMessage('Handshake Aborted by Pioneer.');
        setIsProcessing(false);
      },
      onError: (error: any, payment: any) => {
        setStatusMessage(`TX ERROR: ${error.message}`);
        setIsProcessing(false);
      }
    } as any; // <--- THE MESH OVERRIDE INJECTED HERE

    window.Pi.createPayment(paymentData, callbacks);

  return (
    <main style={{ maxWidth: '384px', margin: '0 auto', padding: '24px', fontFamily: 'monospace', color: '#e0e0e0' }}>
      
      <Script src="https://sdk.minepi.com/pi-sdk.js" strategy="afterInteractive" />

      <div style={{ borderBottom: '1px solid #333', paddingBottom: '16px', marginBottom: '24px' }}>
        <h2 style={{ color: '#00d28a', margin: '0 0 8px 0', letterSpacing: '1px' }}>THE LOGIC FORGE</h2>
        <p style={{ margin: 0, fontSize: '14px', color: '#888' }}>
          Status: <span style={{ color: isSdkLoaded ? '#00d28a' : '#ff4444', fontWeight: 'bold' }}>
            {isSdkLoaded ? 'SDK Active' : 'L1 Node Disconnected'}
          </span>
        </p>
        {isSdkLoaded && (
          <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: '#ffb86c' }}>
            [TESTNET / SANDBOX ROUTING ENGAGED]
          </p>
        )}
      </div>

      <div>
        <h3 style={{ margin: '0 0 12px 0', letterSpacing: '1px' }}>PIONEER REGISTRATION</h3>
        
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

        {/* UI RENDER LOGIC */}
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
            {isProcessing ? 'Verifying...' : 'Step 1: Authenticate Identity'}
          </button>
        ) : (
          <div>
            <p style={{ fontSize: '14px', color: '#aaa', marginBottom: '16px' }}>
              Identity verified. Please execute a 0.1 Test-Pi transaction to securely log your wallet into the E-Network.
            </p>
            <button
              onClick={executeHandshake}
              style={{ 
                width: '100%', padding: '14px', backgroundColor: isProcessing ? '#222' : '#00d28a', 
                color: isProcessing ? '#666' : '#000', border: 'none', borderRadius: '4px', 
                fontWeight: 'bold', cursor: isProcessing ? 'not-allowed' : 'pointer',
                textTransform: 'uppercase', letterSpacing: '1px'
              }}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing Handshake...' : 'Step 2: Transmit 0.1 Test-Pi'}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
}