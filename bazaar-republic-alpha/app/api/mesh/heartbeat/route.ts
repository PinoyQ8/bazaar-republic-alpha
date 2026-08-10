// PROJECT BAZAAR DAO - PROTOCOL 26.1
// API ROUTE: NODE HEARTBEAT & TELEMETRY PULSE

import { NextResponse } from 'next/server';

interface HeartbeatPayload {
  pioneerId: string;
  clientTimestamp: number;
  nodeVersion?: string;
}

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const body: HeartbeatPayload = await request.json();
    const { pioneerId, clientTimestamp, nodeVersion = '26.1' } = body;

    if (!pioneerId) {
      return NextResponse.json(
        { error: 'MESH REJECT: Pioneer ID missing from heartbeat payload.' },
        { status: 400 }
      );
    }

    // Measure internal latency to local RPC node
    let rpcSynced = false;
    let latestLedger = 0;

    try {
      const rpcCheck = await fetch('http://localhost:31401', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getHealth',
        }),
      });

      if (rpcCheck.ok) {
        rpcSynced = true;
        // Mock or parse ledger state from response
        latestLedger = Math.floor(Date.now() / 5000); 
      }
    } catch {
      // Fallback state if local RPC container is temporarily unreachable
      rpcSynced = false;
    }

    const serverTimestamp = Date.now();
    const latencyMs = serverTimestamp - startTime;

    // Return active pulse response
    return NextResponse.json({
      success: true,
      pioneerId,
      status: rpcSynced ? 'SYNCED' : 'DEGRADED',
      latencyMs,
      latestLedger,
      protocolVersion: nodeVersion,
      clientDeltaMs: serverTimestamp - clientTimestamp,
      timestamp: serverTimestamp,
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'PULSE FAULT: Heartbeat processing error.', 
        details: String(error) 
      },
      { status: 500 }
    );
  }
}