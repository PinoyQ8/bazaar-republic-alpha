import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(request: Request) {
  try {
    const { uid, username, walletAddress } = await request.json();

    if (!uid) {
      return NextResponse.json({ message: "Invalid UID" }, { status: 400 });
    }

    // ADJUDICATOR LOGIC: Upsert the citizen into the registry
    // This adds them if new, or updates their wallet if they already exist.
    await sql`
      INSERT INTO citizen_registry (pi_uid, username, pi_wallet_address, last_login)
      VALUES (${uid}, ${username}, ${walletAddress}, NOW())
      ON CONFLICT (pi_uid) 
      DO UPDATE SET 
        pi_wallet_address = EXCLUDED.pi_wallet_address,
        last_login = NOW();
    `;

    return NextResponse.json({ message: "SUCCESS: Citizen Registered" }, { status: 200 });
  } catch (error: any) {
    console.error("VAULT ERROR:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}