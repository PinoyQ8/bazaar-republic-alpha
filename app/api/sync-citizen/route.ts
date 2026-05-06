import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { uid, username } = await req.json();

    if (!uid) {
      return NextResponse.json({ mesh_status: "REJECTED", message: "UID Missing" }, { status: 400 });
    }

    // Step 1: Scan the Vault for the Citizen
    const citizenCheck = await sql`
      SELECT defense_status FROM Citizen_Registry WHERE citizen_uid = ${uid}
    `;

    if (citizenCheck.rowCount === 0) {
      // Step 2A: New Pioneer Detected. Mint their profile.
      await sql`
        INSERT INTO Citizen_Registry (citizen_uid, pi_wallet_address, defense_status)
        VALUES (${uid}, ${username || 'PENDING_WALLET'}, 'OPERATIONAL')
      `;
      
      return NextResponse.json({ 
        mesh_status: "SUCCESS", 
        defense_status: "OPERATIONAL",
        is_new_citizen: true
      }, { status: 200 });

    } else {
      // Step 2B: Returning Citizen Detected. Return their status.
      return NextResponse.json({ 
        mesh_status: "SUCCESS", 
        defense_status: citizenCheck.rows[0].defense_status,
        is_new_citizen: false
      }, { status: 200 });
    }

  } catch (error) {
    console.error("Vault Sync Error:", error);
    return NextResponse.json({ mesh_status: "ERROR", message: "Database connection failed" }, { status: 500 });
  }
}