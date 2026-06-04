import { NextResponse } from 'next/server';
// 🛡️ MESH ALIGNED: Must use the library gateway to trigger the Build-Time Mute
import { prisma } from "@/lib/mesh-prisma"; 

// 🛡️ NEO PROTOCOL: Hard-lock to dynamic execution
// Prevents static pre-rendering build-worker crashes.
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, walletAddress, role } = body;

    // 🛡️ MESH VALIDATION: Ensure node integrity
    if (!username || !walletAddress) {
      return NextResponse.json({ error: "Missing identity parameters." }, { status: 400 });
    }

    // 🛡️ BAZAAR REGISTRY: Forge the node record
    const newNode = await prisma.pioneerNode.create({
      data: {
        username,
        walletAddress,
        role: role || "CITIZEN",
        status: "VERIFIED",
      },
    });

    console.log(`🚀 [MESH-SYNC] Node registered for Pioneer: ${username}`);

    return NextResponse.json({ 
      status: "SUCCESS", 
      node: newNode 
    }, { status: 201 });

  } catch (error: any) {
    // 🛡️ CONSTRAINT GATE: Handle unique collisions
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Node already exists in the E-Network." }, { status: 409 });
    }

    console.error("❌ MESH CRITICAL ERROR:", error.message);
    return NextResponse.json({ error: "Registration engine failed to forge record." }, { status: 500 });
  }
}