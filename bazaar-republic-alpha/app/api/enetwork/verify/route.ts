// 🛡️ MESH E-NETWORK: ADJUDICATOR VERIFICATION GATEWAY
import { NextResponse } from 'next/server';
import { connectToLedger } from '@/lib/mongodb';
import { ServiceProvider } from '@/lib/models/ServiceProvider';

export async function PATCH(request: Request) {
  try {
    // 🛡️ 1. TERMINAL CLEARANCE CHECK
    // Only nodes broadcasting Founder or Elder clearance can execute this route.
    const role = request.headers.get('x-mesh-pioneer-role');
    
    if (role !== 'FOUNDER' && role !== 'ELDER') {
      return NextResponse.json({ success: false, error: "INSUFFICIENT_CLEARANCE_LEVEL" }, { status: 403 });
    }

    // 🛡️ 2. PAYLOAD EXTRACTION
    const body = await request.json();
    const { providerId, newStatus } = body;

    if (!providerId || !newStatus) {
      return NextResponse.json({ success: false, error: "INCOMPLETE_TELEMETRY" }, { status: 400 });
    }

    // Lock the allowed parameters to prevent rogue state injection
    const allowedStatuses = ['ACTIVE', 'REJECTED', 'FROZEN'];
    if (!allowedStatuses.includes(newStatus)) {
      return NextResponse.json({ success: false, error: "INVALID_STATE_PARAMETER" }, { status: 400 });
    }

    await connectToLedger();

    // 🛡️ 3. LEDGER STATE TRANSITION
    // 🛡️ LINTER FIX: Replaced { new: true } with { returnDocument: 'after' }
    const updatedProvider = await ServiceProvider.findByIdAndUpdate(
      providerId,
      { status: newStatus, lastAuditAt: Date.now() },
      { returnDocument: 'after' }
    );

    if (!updatedProvider) {
      return NextResponse.json({ success: false, error: "PROVIDER_NODE_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      providerId: updatedProvider._id,
      newStatus: updatedProvider.status,
      message: `NODE_UPGRADED_TO_${newStatus}`
    });

  } catch (error) {
    console.error("[ADJUDICATOR_VERIFY_PANIC]:", error);
    return NextResponse.json({ success: false, error: "INTERNAL_MESH_FRACTURE" }, { status: 500 });
  }
}