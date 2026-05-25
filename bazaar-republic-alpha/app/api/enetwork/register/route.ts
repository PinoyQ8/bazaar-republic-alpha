// 🛡️ MESH E-NETWORK: PROVIDER GATEWAY
import { NextResponse } from 'next/server';
import { connectToLedger } from '@/lib/mongodb';
import { ServiceProvider } from '@/lib/models/ServiceProvider';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const pioneerUid = request.headers.get('x-mesh-pioneer-uid');

    if (!pioneerUid) {
      return NextResponse.json({ success: false, error: "UNAUTHORIZED_NODE" }, { status: 401 });
    }

    const body = await request.json();
    const { businessName, serviceCategory, manualVersionAgreed } = body;

    if (!businessName || !serviceCategory || !manualVersionAgreed) {
      return NextResponse.json({ success: false, error: "INCOMPLETE_TELEMETRY" }, { status: 400 });
    }

    await connectToLedger();

    // 🛡️ ADJUDICATOR CHECK: Prevent double-registration
    const existingProvider = await ServiceProvider.findOne({ pioneerUid });
    if (existingProvider) {
      return NextResponse.json({ 
        success: false, 
        error: "PROVIDER_NODE_ALREADY_ACTIVE",
        status: existingProvider.status 
      }, { status: 409 });
    }

    // 🛡️ COMPLIANCE BINDING: Generate proof of agreement
    const timestamp = Date.now().toString();
    const payload = `${pioneerUid}:${manualVersionAgreed}:${timestamp}`;
    const complianceHash = crypto.createHash('sha256').update(payload).digest('hex');

    // 🛡️ FORGE REGISTRY ENTRY
    const newProvider = await ServiceProvider.create({
      pioneerUid,
      businessName,
      serviceCategory,
      manualVersionAgreed,
      complianceHash,
      status: 'PENDING_VERIFICATION' // Default state until DAO approves
    });

    return NextResponse.json({ 
      success: true, 
      providerId: newProvider._id,
      complianceHash,
      message: "SERVICE_PROVIDER_LOCKED"
    });

  } catch (error) {
    console.error("[PROVIDER_GATEWAY_PANIC]:", error);
    return NextResponse.json({ success: false, error: "INTERNAL_MESH_FRACTURE" }, { status: 500 });
  }
}