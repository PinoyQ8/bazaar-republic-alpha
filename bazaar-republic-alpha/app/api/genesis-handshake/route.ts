import { NextResponse } from 'next/server';

// Academy Payload
const ACADEMY_PAYLOAD = {
  version: "Protocol 24",
  status: "NEO-SYNC ACTIVE",
  academy_baseline: {
    vision: "The Bazaar Republic is a decentralized, resilient digital ecosystem built to empower Real Pioneers with absolute digital sovereignty. We forge living, programmable infrastructure where community-driven governance and decentralized utility thrive side by side."
  }
};

// Security Config
const MAX_REQUESTS_PER_MINUTE = 5;
const MAX_TIMESTAMP_AGE_MS = 60000; // 60 seconds max age for replay protection

// Basic In-Memory Rate Limiter (For Vercel KV/Redis in Mainnet, Memory for Alpha)
const rateLimitMap = new Map<string, { count: number; startTime: number }>();

function applyRateLimit(ip: string): boolean {
  const currentTime = Date.now();
  const windowData = rateLimitMap.get(ip);

  if (!windowData) {
    rateLimitMap.set(ip, { count: 1, startTime: currentTime });
    return true;
  }

  if (currentTime - windowData.startTime > 60000) {
    rateLimitMap.set(ip, { count: 1, startTime: currentTime });
    return true;
  }

  if (windowData.count >= MAX_REQUESTS_PER_MINUTE) {
    return false; // Rate limit exceeded
  }

  windowData.count++;
  return true;
}

export async function POST(request: Request) {
  try {
    // 1. Extract IP for Rate Limiting
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    
    if (!applyRateLimit(ip)) {
      return NextResponse.json(
        { error: "MESH Shield Active: Rate Limit Exceeded. Cool down node." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { nodeId, masterTS } = body;

    // 2. Strict Data Sanitization & Node Signature Check
    const nodeRegex = /^genesis-(0[0-9]{2}|100)$/;
    if (!nodeId || !nodeRegex.test(nodeId)) {
      return NextResponse.json(
        { error: "Handshake Refused: Invalid Node Signature Key." },
        { status: 401 }
      );
    }

    // 3. Replay Protection via Master Timestamp
    if (!masterTS || typeof masterTS !== 'number') {
      return NextResponse.json(
        { error: "Handshake Refused: Master TS Sync Missing or Invalid." },
        { status: 400 }
      );
    }

    const timeDifference = Math.abs(Date.now() - masterTS);
    if (timeDifference > MAX_TIMESTAMP_AGE_MS) {
      return NextResponse.json(
        { error: "Handshake Refused: Timestamp Expired. Replay Attack Prevented." },
        { status: 401 }
      );
    }

    // 4. Successful Execution
    return NextResponse.json({
      success: true,
      nodeId,
      timestamp: Date.now(),
      message: `Handshake verified. Welcome to the Academy, Node ${nodeId}.`,
      payload: ACADEMY_PAYLOAD
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      { error: "Handshake Fault: Internal Logic Integrity Breached." },
      { status: 500 }
    );
  }
}