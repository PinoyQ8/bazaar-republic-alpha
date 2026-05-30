// TARGET FILE PATH: [project-root]/app/academy/page.tsx
'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // Correct App Router engine

export default function AcademyDashboard() {
  // 1. INSTANTIATE THE ROUTER ENGINE
  const router = useRouter();
  
  // 2. AUTHORIZATION STATE LOCK
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  // 3. MASTER TS VERIFICATION PIPELINE
  useEffect(() => {
    // Check the local workstation RAM for the Master Token
    const masterToken = localStorage.getItem('MASTER_TS');

    if (!masterToken) {
      console.error("[MESH-FRACTURE] No Master Token Found. Access Denied.");
      // Trigger the L1 fallback route
      router.push('/log-in'); 
    } else {
      console.log("[MESH-SYNC] Master Token Verified. Granting Access.");
      setIsAuthorized(true);
    }
  }, [router]);

  // 4. PRE-FLIGHT RENDER BLOCK (Shields data during redirect)
  if (!isAuthorized) {
    return (
      <main style={{ maxWidth: '384px', margin: '0 auto', padding: '16px', textAlign: 'center' }}>
        <p>Verifying Master TS...</p>
      </main>
    );
  }

  // 5. SECURE VIEWPORT RENDER (Locked for S23 Ultra)
  return (
    <main style={{ maxWidth: '384px', margin: '0 auto', padding: '16px' }}>
      <div>
        <h2>MESH ACADEMY</h2>
        <p>Over-Mint Shield: SECURED</p>
        <p>Clearance: PIONEER VANGUARD</p>
      </div>
      
      <hr />

      <div style={{ marginTop: '24px' }}>
        <h3>THE LOGIC FORGE</h3>
        <p>Welcome to the Academy. The E-Network data streams are active.</p>
        
        {/* Future Academy curriculum and governance modules will render here */}
        
        <div style={{ padding: '12px', border: '1px solid #ccc', marginTop: '16px' }}>
          <h4>Active Module: DAO Architecture</h4>
          <p>Status: Synchronized</p>
          <button style={{ width: '100%', marginTop: '8px' }}>Enter Matrix</button>
        </div>

        {/* ALPHA TRACK BRIDGE */}
        <div style={{ padding: '12px', border: '1px solid #00d28a', marginTop: '24px', backgroundColor: '#05140e' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#00d28a' }}>The Logic Forge: Alpha Track</h4>
          <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#aaa' }}>Execute Genesis Mint and Redemption Payloads.</p>
          <Link href="/alpha-track" style={{ textDecoration: 'none' }}>
            <button style={{ 
              width: '100%', 
              padding: '12px', 
              backgroundColor: '#00d28a', 
              color: '#000', 
              border: 'none', 
              fontWeight: 'bold', 
              cursor: 'pointer' 
            }}>
              ACCESS ALPHA TRACK
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}