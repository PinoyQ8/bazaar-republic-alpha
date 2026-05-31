import React from 'react';
import { db } from '@/app/db'; // Adjust path if you used a different database export file
import { securityCircleNodes } from '@/app/db/schema';
import { desc } from 'drizzle-orm';

// Opt out of Next.js caching to ensure real-time terminal telemetry
export const dynamic = 'force-dynamic';

export default async function MeshScanDashboard() {
  // Pull the live nodes from the Neon Hard Drive
  const nodes = await db
    .select()
    .from(securityCircleNodes)
    .orderBy(desc(securityCircleNodes.capturedAt));

  const totalCaptured = nodes.length;
  const isLocked = totalCaptured >= 10;

  // Generate 10 total slots for visual tracking
  const emptySlots = Math.max(0, 10 - totalCaptured);

  return (
    <main style={{ maxWidth: '800px', margin: '40px auto', padding: '24px', fontFamily: 'monospace', color: '#e0e0e0' }}>
      
      {/* HEADER SECTION */}
      <div style={{ borderBottom: '1px solid #333', paddingBottom: '16px', marginBottom: '32px' }}>
        <h1 style={{ color: '#00d28a', margin: '0 0 8px 0', letterSpacing: '2px', textTransform: 'uppercase' }}>
          MESH-SCAN: Security Circle
        </h1>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#888' }}>
            System Status: {isLocked ? <span style={{ color: '#ff4444' }}>LOCKED (MAX CAPACITY)</span> : <span style={{ color: '#00d28a' }}>AWAITING NODES</span>}
          </p>
          <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: isLocked ? '#ff4444' : '#e0e0e0' }}>
            Nodes Captured: {totalCaptured} / 10
          </p>
        </div>
      </div>

      {/* NODE LEDGER */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {nodes.map((node, index) => (
          <div key={node.id} style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            padding: '16px', 
            backgroundColor: '#111', 
            border: '1px solid #00d28a',
            borderRadius: '4px'
          }}>
            <div>
              <span style={{ color: '#555', marginRight: '12px' }}>[0{index + 1}]</span>
              <span style={{ fontWeight: 'bold', color: '#fff', fontSize: '16px' }}>{node.username}</span>
            </div>
            <div style={{ color: '#00d28a', fontSize: '14px', letterSpacing: '1px' }}>
              {node.walletAddress.substring(0, 8)}...{node.walletAddress.substring(50)}
            </div>
          </div>
        ))}

        {/* EMPTY SLOTS RENDERER */}
        {Array.from({ length: emptySlots }).map((_, idx) => (
          <div key={`empty-${idx}`} style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            padding: '16px', 
            backgroundColor: '#0a0a0a', 
            border: '1px dashed #333',
            borderRadius: '4px',
            color: '#444'
          }}>
            <div>
              <span style={{ marginRight: '12px' }}>[0{totalCaptured + idx + 1}]</span>
              <span>UNALLOCATED_NODE</span>
            </div>
            <div>WAITING_FOR_SYNC...</div>
          </div>
        ))}
      </div>

      {/* FOOTER METRICS */}
      <div style={{ marginTop: '40px', paddingTop: '16px', borderTop: '1px solid #333', fontSize: '12px', color: '#666', textAlign: 'center' }}>
        <p>BAZAAR REPUBLIC E-NETWORK // ALPHA-TRACK ROUTING</p>
        <p>Uptime Shield: 92% | Hard Drive: Neon Serverless</p>
      </div>

    </main>
  );
}