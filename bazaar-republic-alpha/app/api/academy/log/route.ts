import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToLedger } from '../../../../lib/mongodb';
import { AcademyLog } from '../../../../lib/models/AcademyLog';

export async function POST(request: Request) {
  try {
    // 1. 🛡️ UPLINK INITIALIZATION
    await connectToLedger();

    // 2. 🛡️ PARSE PAYLOAD
    const body = await request.json();
    const { moduleId } = body; 
    
    // 3. 🛡️ ZERO-TRUST VAULT VERIFICATION
    const cookieStore = await cookies();
    const session = cookieStore.get('mesh_session_token');

    if (!session) {
      console.warn("[ADJUDICATOR] Intercepted unauthorized Academy log attempt.");
      return NextResponse.json({ success: false, error: 'NODE_UNVERIFIED' }, { status: 401 });
    }

    const uid = session.value.split('-AUTH-')[0];

    // 4. 🛡️ THE PERIMETER CHECK (Mongoose Shield)
    const existingLog = await AcademyLog.findOne({
      pioneerUid: uid,
      moduleLocked: moduleId
    });

    if (existingLog) {
      console.log(`[MESH] Pioneer ${uid} already holds clearance for Module ${moduleId}.`);
      return NextResponse.json({ success: true, message: "MODULE_ALREADY_LOCKED" });
    }

    // 5. 🛡️ CORE LEDGER WRITE
    const newLog = await AcademyLog.create({
      pioneerUid: uid,
      moduleLocked: moduleId,
    });

    console.log(`[VAULT] Module ${moduleId} locked for Pioneer ${uid}.`);
    return NextResponse.json({ success: true, log: newLog });

  } catch (error) {
    console.error('[MESH-SCAN] Academy Log Fracture:', error);
    return NextResponse.json({ success: false, error: 'INTERNAL_FRACTURE' }, { status: 500 });
  }
}