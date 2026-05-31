'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';

export default function PioneerLogin() { // 1. Component START
  const router = useRouter();
  const [isSdkLoaded, setIsSdkLoaded] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [verifiedUsername, setVerifiedUsername] = useState<string>('');

  // 🛡️ All hooks are now safely nested INSIDE PioneerLogin
  useEffect(() => {
    const existingToken = localStorage.getItem('MASTER_TS');
    if (existingToken) {
      setStatusMessage('Persistent Node Detected...');
      setIsProcessing(true);
      router.push('/mesh-scan'); 
    }
  }, [router]);

  // ... [Rest of your useEffects and Handshake logic]

  return ( // 2. Return START
    <main>
      {/* 🛡️ Buffer Overlay using isProcessing state */}
      {isProcessing && (
        <div style={{ /* ... CSS properties ... */ }}>
          [MESH-BRIDGE] Initializing Cryptographic Handshake...
        </div>
      )}
      {/* ... [UI Content] */}
    </main>
  ); // 2. Return END
} // 1. Component END (Ensure this is the final line!)