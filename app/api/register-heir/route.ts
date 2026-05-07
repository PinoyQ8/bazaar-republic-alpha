import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // 1. EXTRACT THE AUTH SHIELD (Access Token)
    const authHeader = request.headers.get('Authorization');
    const accessToken = authHeader?.split(' ')[1]; // Extract token from "Bearer [TOKEN]"

    if (!accessToken) {
      return NextResponse.json({ message: "ADJUDICATOR ERROR: Unauthenticated Access." }, { status: 401 });
    }

    // 2. VERIFY TOKEN WITH PI NETWORK BACKEND
    // We ping Pi Network to ask: "Is this token valid, and who does it belong to?"
    const piVerifyResponse = await fetch('https://api.minepi.com/v2/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!piVerifyResponse.ok) {
      return NextResponse.json({ message: "TRIBUNAL REJECTED: Invalid Pi Access Token." }, { status: 403 });
    }

    const piUser = await piVerifyResponse.json();
    const verifiedUid = piUser.uid; // The UID officially confirmed by Pi Network

    // 3. INTERCEPT PAYLOAD
    const body = await request.json();
    const { citizen_uid, heirs } = body;

    // 4. THE MASTER VERIFICATION
    // Ensure the UID provided in the body matches the UID verified by the token.
    // This prevents "User A" from using their token to change "User B's" heirs.
    if (citizen_uid !== verifiedUid) {
      return NextResponse.json({ message: "SECURITY FRACTURE: UID Mismatch Detected." }, { status: 403 });
    }

    // 5. DATABASE FORGE (If verified, proceed to write)
    await sql`DELETE FROM heir_registry WHERE citizen_uid = ${citizen_uid}`;

    for (const heir of heirs) {
      await sql`
        INSERT INTO heir_registry (citizen_uid, heir_label, heir_wallet_address, allocation_percentage)
        VALUES (${citizen_uid}, ${heir.label}, ${heir.address}, ${heir.percent})
      `;
    }

    return NextResponse.json({ message: "VAULT SEALED: Verified by Pi Network." }, { status: 200 });

  } catch (error) {
    console.error("AUTH_SHIELD_ERROR:", error);
    return NextResponse.json({ message: "VAULT FRACTURE: Internal Adjudication Failure." }, { status: 500 });
  }
}