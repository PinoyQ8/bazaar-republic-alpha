// PROJECT BAZAAR DAO - PROTOCOL 26.1
// API ROUTE: CUSTOM REMOTE ACCESS TUNNEL RELAY

import { NextResponse } from 'next/server';

// Global payload buffer for local agent polling
let pendingRequest: any = null;
let pendingResponse: any = null;

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('x-bazaar-node-key');
    const body = await request.json();

    // 1. Handle incoming request from local agent on X570 node
    if (body.type === 'AGENT_REGISTER') {
      return NextResponse.json({
        status: 'CONNECTED',
        hasPendingWork: !!pendingRequest,
        work: pendingRequest,
      });
    }

    if (body.type === 'AGENT_FULFILL') {
      pendingResponse = body.payload;
      pendingRequest = null;
      return NextResponse.json({ status: 'ACCEPTED' });
    }

    // 2. Handle incoming RPC request from remote Pioneer client (S23 Ultra)
    pendingRequest = {
      id: `req_${Date.now()}`,
      targetHost: body.targetHost || 'solohost',
      endpoint: body.endpoint,
      method: body.method || 'POST',
      payload: body.payload,
      timestamp: Date.now(),
    };

    // Wait up to 3000ms for X570 local agent to fulfill
    const timeout = Date.now() + 3000;
    while (Date.now() < timeout) {
      if (pendingResponse) {
        const res = pendingResponse;
        pendingResponse = null;
        return NextResponse.json(res);
      }
      await new Promise((r) => setTimeout(r, 100));
    }

    // Fallback response if local agent is unreachable
    return NextResponse.json(
      { 
        error: 'TUNNEL TIMEOUT: Local X570 workstation agent did not respond.',
        targetHost: body.targetHost,
        solohostPort: 31401
      },
      { status: 504 }
    );

  } catch (error) {
    return NextResponse.json(
      { error: 'TUNNEL FAULT: Relay processing error.', details: String(error) },
      { status: 500 }
    );
  }
}