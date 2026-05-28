import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { connectToDatabase } from "@/lib/db";
import { PioneerNode } from "@/models/PioneerNode";
import { logEvent } from "@/lib/logger"; // ◄ TRACEABILITY UTILITY INJECTED

export async function POST(request: NextRequest) {
  // Extract identity tokens
  const pioneerUid = request.headers.get('x-mesh-pioneer-uid') || "GHOST_NODE";
  const pioneerRole = request.headers.get('x-mesh-pioneer-role') || "UNKNOWN";

  try {
    // 🛡️ SECURITY GATE: Reject unverified identity
    if (!pioneerUid || pioneerUid === "GHOST_NODE") {
      await logEvent(pioneerUid, "AUTH_FAILURE", "WARN", { reason: "Null or Ghost UID" });
      return NextResponse.json({ success: false, error: "ACCESS_DENIED: Null UID." }, { status: 403 });
    }

    const body = await request.json();
    const { moduleId } = body;

    // 1. PAYLOAD VALIDATION
    if (!moduleId) {
      await logEvent(pioneerUid, "INIT_FAILURE", "WARN", { reason: "Missing module identifier" });
      return NextResponse.json({ success: false, error: "Missing module identifier payload." }, { status: 400 });
    }

    // 2. SECURE SECTOR SYNC: Verify Pioneer exists in Ledger
    await connectToDatabase();
    const pioneerExists = await PioneerNode.findOne({ username: pioneerUid }).lean();

    if (!pioneerExists) {
      await logEvent(pioneerUid, "IDENTITY_FRACTURE", "ERROR", { reason: "Node not found in Ledger" });
      return NextResponse.json({ success: false, error: "IDENTITY_FRACTURE: Node not found in Ledger." }, { status: 404 });
    }

    // 3. CORE LOGIC: Initialize Module state
    console.log(`[MESH-API] Node [${pioneerUid}] (${pioneerRole}) authorized. Initializing Module: ${moduleId}`);
    await logEvent(pioneerUid, "MODULE_INITIALIZED", "INFO", { moduleId });

    return NextResponse.json({ 
      success: true, 
      message: `Protocol Module ${moduleId} initialized successfully. Buffer synchronized.`,
      node: pioneerUid 
    });

  } catch (error: any) {
    // 4. ERROR TRACEABILITY
    console.error("[MESH-API ERROR] Core module initialization failed:", error);
    await logEvent(pioneerUid, "SYSTEM_CRASH", "ERROR", { error: error.message });
    
    return NextResponse.json({ success: false, error: "Internal Core Ledger Failure." }, { status: 500 });
  }
}