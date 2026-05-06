import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // 1. DATA EXTRACTION: Capture the Token, UID, and Username
    const { uid, username, token } = await req.json();

    if (!uid || !token) {
      return NextResponse.json({ mesh_status: "REJECTED", message: "Security Token or UID Missing" }, { status: 400 });
    }

    // --- SECURITY GATEKEEPER: PCT VERIFICATION ---
    // This ensures no one can "guess" a UID to find a Citizen's status
    const piVerifyReq = await fetch('https://api.minepi.com/v2/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const piData = await piVerifyReq.json();

    if (!piVerifyReq.ok || piData.uid !== uid) {
      return NextResponse.json({ mesh_status: "REJECTED", message: "Cryptographic Mismatch" }, { status: 403 });
    }
    // --- END SECURITY GATEKEEPER ---

    // Step 1: Scan the Vault for the Citizen
    const citizenCheck = await sql`
      SELECT defense_status FROM Citizen_Registry WHERE citizen_uid = ${uid}
    `;

    if (citizenCheck.rowCount === 0) {
      // Step 2A: New Pioneer Detected. Generate Master Recovery Key.
      // Math: Random 6-digit string between 100000 and 999999
      const generatedPin = Math.floor(100000 + Math.random() * 900000).toString();

      await sql`
        INSERT INTO Citizen_Registry (citizen_uid, username, defense_status, recovery_pin)
        VALUES (${uid}, ${username || 'PIONEER'}, 'OPERATIONAL', ${generatedPin})
      `;
      
      // RETURN THE PIN ONLY ONCE (MINTING EVENT)
      return NextResponse.json({ 
        mesh_status: "SUCCESS", 
        defense_status: "OPERATIONAL",
        is_new_citizen: true,
        recovery_pin: generatedPin // SHIPPED TO VIEWPORT
      }, { status: 200 });

    } else {
      // Step 2B: Returning Citizen Detected.
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