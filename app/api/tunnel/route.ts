// PROJECT BAZAAR DAO - PROTOCOL 26.1
// API ROUTE: CUSTOM REMOTE ACCESS TUNNEL RELAY

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Single-slot payload buffer for local agent polling
let pendingRequest: Record<string, unknown> | null = null;
let pendingResponse: unknown = null;

const MESH_TUNNEL_SECRET =
  process.env.MESH_TUNNEL_SECRET ||
  process.env.PI_API_KEY ||
  'MESH_VAULT_KEY_ALPHA';

export async function POST(request: Request) {
  // 1. SECURITY ADJUDICATION: Verify Node Key Header
  const nodeKey = request.headers.get('x-bazaar-node-key')?.trim() || '';
  if (!nodeKey || nodeKey !== MESH_TUNNEL_SECRET) {
    return NextResponse.json(
      { error: 'MESH ACCESS DENIED: Invalid or missing x-bazaar-node-key.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'TUNNEL FAULT: Invalid or malformed JSON payload.' },
        { status: 400 }
      );
    }

    // 2. Local agent registration & work fulfillment
    if (body.type === 'AGENT_REGISTER') {
      return NextResponse.json({
        status: 'CONNECTED',
        hasPendingWork: Boolean(pendingRequest),
        work: pendingRequest,
      });
    }

    if (body.type === 'AGENT_FULFILL') {
      pendingResponse = body.payload ?? null;
      pendingRequest = null;
      return NextResponse.json({ status: 'ACCEPTED' });
    }

    // 3. Queue incoming RPC/relay request for local agent pickup
    pendingRequest = {
      id: `req_${Date.now()}`,
      targetHost: typeof body.targetHost === 'string' ? body.targetHost : 'solohost',
      endpoint: body.endpoint,
      path: body.path,
      method: typeof body.method === 'string' ? body.method : 'POST',
      payload: body.payload,
      timestamp: Date.now(),
    };

    // Wait up to 3000ms for local agent to fulfill
    const deadline = Date.now() + 3000;
    while (Date.now() < deadline) {
      if (pendingResponse !== null) {
        const res = pendingResponse;
        pendingResponse = null;
        return NextResponse.json(res as Record<string, unknown>);
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Clear stale pending request if timed out
    pendingRequest = null;

    return NextResponse.json(
      {
        error: 'TUNNEL TIMEOUT: Local workstation agent did not respond.',
        targetHost: body.targetHost ?? 'solohost',
        solohostPort: 31401,
      },
      { status: 504 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'TUNNEL FAULT: Relay processing error.',
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}