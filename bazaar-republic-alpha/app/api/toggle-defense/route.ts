import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { uid, target_status } = await req.json();

    if (!uid || !target_status) {
      return NextResponse.json({ mesh_status: "REJECTED", message: "Invalid Payload" }, { status: 400 });
    }

    // ADJUDICATOR: Update the Citizen's status in the Vault
    await sql`
      UPDATE Citizen_Registry 
      SET defense_status = ${target_status} 
      WHERE citizen_uid = ${uid}
    `;

    return NextResponse.json({ 
      mesh_status: "SUCCESS", 
      new_status: target_status 
    }, { status: 200 });

  } catch (error) {
    console.error("Vault Update Error:", error);
    return NextResponse.json({ mesh_status: "ERROR", message: "Failed to shift defense state" }, { status: 500 });
  }
}