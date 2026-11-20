import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DEFAULT_RUST_NODE_URL = 'http://192.168.8.110:8080/api/handshake';

export async function POST(req: Request) {
  const rustNodeUrl = (process.env.RUST_NODE_URL || DEFAULT_RUST_NODE_URL).trim();

  try {
    const incomingBody = await req.json().catch(() => ({}));
    const payload = {
      initiator: 'bazaar-republic-alpha',
      timestamp: new Date().toISOString(),
      ...(typeof incomingBody === 'object' && incomingBody !== null ? incomingBody : {}),
    };

    console.log('[MESH-SCAN] Initiating cross-network bridge to Rust node...');
    console.log(`[MESH-SCAN] Target Vector Locked: ${rustNodeUrl}`);

    const response = await fetch(rustNodeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MESH-PROTOCOL': 'NEO-SYNC-ACTIVE',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });

    const rawText = await response.text();
    let parsedData: unknown = rawText;

    if (rawText) {
      try {
        parsedData = JSON.parse(rawText);
      } catch {
        parsedData = rawText;
      }
    } else {
      parsedData = null;
    }

    if (!response.ok) {
      throw new Error(
        `Rust node rejected the payload (${response.status}): ${rawText || response.statusText}`
      );
    }

    return NextResponse.json(
      {
        status: 'success',
        mesh_state: 'QUANTUM_SHIELD_ACTIVE',
        payload: parsedData,
      },
      { status: 200 }
    );
  } catch (error: any) {
    const message = error?.message || String(error);
    console.error('[MESH-SCAN] HARDWARE BRIDGE FAILED:', message);

    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to sync with Rust Node Bridge.',
        details: message,
      },
      { status: 502 }
    );
  }
}