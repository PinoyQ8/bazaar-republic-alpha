import { NextResponse } from 'next/server';
import { db } from '@vercel/postgres';

export async function POST(request: Request) {
  const client = await db.connect();

  try {
    const { citizen_uid } = await request.json();

    // 🛡️ 1. FETCH CITIZEN STATE
    const citizenData = await client.sql`
      SELECT id, vault_status, uptime_shield FROM citizens 
      WHERE citizen_uid = ${citizen_uid}
    `;

    if (citizenData.rowCount === 0) {
      return NextResponse.json({ message: "NEW_CITIZEN" }, { status: 200 });
    }

    const citizen = citizenData.rows[0];

    // 🛡️ 2. FETCH AUDIT HISTORY (The Matrix Feed)
    const logsData = await client.sql`
      SELECT event_type, event_status, created_at 
      FROM audit_logs 
      WHERE citizen_id = ${citizen.id} 
      ORDER BY created_at DESC LIMIT 5
    `;

    // 🛡️ 3. UPDATE LAST SYNC (Heartbeat)
    await client.sql`
      UPDATE citizens SET last_sync = CURRENT_TIMESTAMP WHERE id = ${citizen.id}
    `;

    return NextResponse.json({
      status: "SUCCESS",
      vault_status: citizen.vault_status,
      uptime_shield: citizen.uptime_shield,
      logs: logsData.rows
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ message: "SYNC_FAILED" }, { status: 500 });
  } finally {
    client.release();
  }
}