import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres'; // MUST use the forward slash

export async function POST(request: Request) {
  // 1. Create the response object
  const response = NextResponse.json({ message: "Process Initiated" });

  // 2. Inject CORS Headers to satisfy the Pi Browser Sandbox
  response.headers.set('Access-Control-Allow-Origin', '*'); 
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  try {
    const { uid, username, walletAddress } = await request.json();

    if (!uid) {
      return NextResponse.json({ message: "Invalid UID" }, { status: 400 });
    }

    // ADJUDICATOR LOGIC: Upsert the citizen
    await sql`
      INSERT INTO citizen_registry (pi_uid, username, pi_wallet_address, last_login)
      VALUES (${uid}, ${username}, ${walletAddress}, NOW())
      ON CONFLICT (pi_uid) 
      DO UPDATE SET 
        pi_wallet_address = EXCLUDED.pi_wallet_address,
        last_login = NOW();
    `;

    return NextResponse.json({ message: "SUCCESS: Citizen Registered" }, { 
      status: 200,
      headers: response.headers // Attach the CORS headers
    });

  } catch (error: any) {
    console.error("VAULT ERROR:", error);
    return NextResponse.json({ message: error.message }, { 
      status: 500,
      headers: response.headers 
    });
  }
}

// 3. Handle the 'OPTIONS' pre-flight request (Crucial for Pi Browser)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}