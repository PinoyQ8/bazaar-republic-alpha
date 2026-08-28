import { db } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { citizen_uid } = body;

    // ADJUDICATOR DEBUG: Verify identity before locking
    if (!citizen_uid) {
      return NextResponse.json({ message: "FAULT: Missing Citizen UID" }, { status: 400 });
    }

    const client = await db.connect();
    
    // MATHEMATICAL SEAL: Update the specific Pioneer's vault status
    await client.sql`
      UPDATE citizen_registry 
      SET vault_status = 'STASIS', last_sync = NOW()
      WHERE citizen_uid = ${citizen_uid};
    `;

    return NextResponse.json({ message: "IRON SHIELD ACTIVE" }, { status: 200 });

  } catch (error: any) {
    console.error("STASIS_CRASH:", error.message);
    return NextResponse.json({ message: `VAULT ERROR: ${error.message}` }, { status: 500 });
  }
}
