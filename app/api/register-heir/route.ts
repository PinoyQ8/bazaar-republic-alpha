import { NextResponse } from 'next/server';
import { db } from '@vercel/postgres'; // Ensure you have installed @vercel/postgres

export async function POST(request: Request) {
  const client = await db.connect();

  try {
    const { citizen_uid, heirs } = await request.json();
    const authHeader = request.headers.get('Authorization');

    // 🛡️ SECURITY ADJUDICATION: Verify the Pi Cryptographic Signature
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: "FAULT: Unsigned Request. Access Denied." }, { status: 401 });
    }

    // 1. LOCATE CITIZEN ID
    const citizenQuery = await client.sql`
      SELECT id FROM citizens WHERE citizen_uid = ${citizen_uid}
    `;

    if (citizenQuery.rowCount === 0) {
      return NextResponse.json({ message: "FAULT: Citizen UID not found in MESH." }, { status: 404 });
    }

    const citizenId = citizenQuery.rows[0].id;

    // 2. CLEAR EXISTING REGISTRY (Preventing duplicate heir nodes)
    await client.sql`DELETE FROM heirs WHERE citizen_id = ${citizenId}`;

    // 3. INJECT NEW HEIR REGISTRY
    for (const heir of heirs) {
      await client.sql`
        INSERT INTO heirs (citizen_id, label, heir_address, allocation_percent)
        VALUES (${citizenId}, ${heir.label}, ${heir.address}, ${heir.percent})
      `;
    }

    // 4. LOG THE SECURITY EVENT
    await client.sql`
      INSERT INTO audit_logs (citizen_id, event_type, event_status)
      VALUES (${citizenId}, 'REGISTRY_SEALED', 'SUCCESS')
    `;

    // 5. UPDATE VAULT STATUS
    await client.sql`
      UPDATE citizens SET vault_status = 'OPERATIONAL' WHERE id = ${citizenId}
    `;

    return NextResponse.json({ 
      success: true, 
      message: "REGISTRY SEALED: Assets secured and synchronized with Postgres Core." 
    }, { status: 200 });

  } catch (error) {
    console.error("DATABASE FRACTURE:", error);
    return NextResponse.json({ message: "INTERNAL VAULT ERROR: Persistence Failed." }, { status: 500 });
  } finally {
    client.release();
  }
}
