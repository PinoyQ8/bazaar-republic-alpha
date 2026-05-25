import { db } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { citizen_uid, vector } = await request.json();

    if (!citizen_uid || !vector) {
      return NextResponse.json({ message: "FAULT: Missing Payload Credentials" }, { status: 400 });
    }

    const client = await db.connect();
    
    // LOGIC GATE: Determine the new status based on the selected vector
    // Vector Alpha: Pioneer returns to Operational status
    // Vector Beta: Heir initiates Transfer status (Deadman Switch)
    const targetStatus = vector === 'PIONEER_RECLAIM' ? 'OPERATIONAL' : 'HEIR_TRANSFER_PENDING';

    await client.sql`
      UPDATE citizen_registry 
      SET vault_status = ${targetStatus}, 
          last_sync = NOW()
      WHERE citizen_uid = ${citizen_uid};
    `;

    return NextResponse.json({ 
      message: "VAULT UPDATED", 
      new_status: targetStatus 
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ message: `VAULT ERROR: ${error.message}` }, { status: 500 });
  }
}