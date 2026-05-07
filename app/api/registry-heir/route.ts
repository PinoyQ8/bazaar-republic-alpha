import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // 1. Intercept the Payload from the React RAM
    const body = await request.json();
    const { citizen_uid, heirs } = body;

    // 2. Adjudicator Validation
    if (!citizen_uid || !heirs || heirs.length === 0) {
      return NextResponse.json(
        { message: "CRITICAL FAULT: Missing UID or Heir Matrix." }, 
        { status: 400 }
      );
    }

    // 3. Purge Protocol: Clear any existing heirs for this UID 
    // (This ensures if a Pioneer "re-seals" their registry, it overwrites rather than duplicates)
    await sql`DELETE FROM heir_registry WHERE citizen_uid = ${citizen_uid}`;

    // 4. The Loop Forge: Insert each heir into the Postgres Vault
    for (const heir of heirs) {
      await sql`
        INSERT INTO heir_registry (citizen_uid, heir_label, heir_wallet_address, allocation_percentage)
        VALUES (${citizen_uid}, ${heir.label}, ${heir.address}, ${heir.percent})
      `;
    }

    // 5. Success Handshake
    return NextResponse.json(
      { message: "VAULT CONFIRMED: Heir Registry sealed." }, 
      { status: 200 }
    );

  } catch (error) {
    console.error("MESH-SCAN VAULT ERROR:", error);
    return NextResponse.json(
      { message: "VAULT FRACTURE: Database transaction failed." }, 
      { status: 500 }
    );
  }
}