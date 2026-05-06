import { db } from '@vercel/postgres'; // Ensure you're using the Vercel Postgres client
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { citizen_uid, username, pi_wallet_address } = body;

    // ADJUDICATOR DEBUG: Verify data presence
    if (!citizen_uid) {
      return NextResponse.json({ message: "FAULT: Missing Citizen UID" }, { status: 400 });
    }

    const client = await db.connect();
    
    // Execute the Upsert (Update or Insert if not exists)
    await client.sql`
      INSERT INTO citizen_registry (citizen_uid, username, pi_wallet_address, onboarded_at)
      VALUES (${citizen_uid}, ${username}, ${pi_wallet_address}, NOW())
      ON CONFLICT (citizen_uid) DO UPDATE 
      SET last_sync = NOW(), username = ${username}, pi_wallet_address = ${pi_wallet_address};
    `;

    return NextResponse.json({ message: "VAULT ACCESSED" }, { status: 200 });

  } catch (error: any) {
    console.error("VAULT_CRASH:", error.message);
    // ADJUDICATOR REPAIR: Send the raw error back to the terminal for diagnosis
    return NextResponse.json({ message: `VAULT ERROR: ${error.message}` }, { status: 500 });
  }
}