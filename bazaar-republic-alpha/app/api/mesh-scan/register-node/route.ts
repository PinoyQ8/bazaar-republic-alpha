import { NextResponse } from 'next/server';
// 🛡️ MESH ALIGNED: Verified filesystem traversal
import { prisma } from "../../../../lib/mesh-prisma";
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, walletAddress } = body;

    // 1. Payload Validation
    if (!username || !walletAddress) {
      return NextResponse.json({ error: 'MESH REJECTED: Incomplete payload.' }, { status: 400 });
    }

    if (!walletAddress.startsWith('G') || walletAddress.length !== 56) {
      return NextResponse.json({ error: 'MESH REJECTED: Invalid cryptographic signature.' }, { status: 400 });
    }

    // 2. Check for existing Node (Prisma)
    const existingNode = await prisma.pioneerNode.findFirst({
      where: { walletAddress }
    });

    if (existingNode) {
      console.log(`[MESH-SCAN] Authorized Pioneer detected: ${username}`);
      return NextResponse.json({ message: 'Node verified.', status: 'returning_node' });
    }

    // 3. Enforce 10-Node Security Circle Limit (Prisma)
    const activeNodesCount = await prisma.pioneerNode.count();

    if (activeNodesCount >= 10) {
      console.warn(`[MESH-SCAN] Intrusion attempt blocked. Security Circle locked.`);
      return NextResponse.json({ error: 'SECURITY CIRCLE LOCKED: Capacity (10) reached.' }, { status: 403 });
    }

    // 4. Register new Pioneer (Prisma)
    // 🛡️ MESH ALIGNED: Mapping to the generated Prisma Input Type
// 🛡️ MESH ALIGNED: Payload now satisfies all required schema constraints
const newNode = await prisma.pioneerNode.create({
  data: {
    username,
    walletAddress,
    status: "ACTIVE",
    createdAt: new Date(),
    role: "PIONEER", // 🛡️ MESH REQUIREMENT: Added missing required field
  }
});

    console.log(`[MESH-SYNC] New Pioneer locked. Total nodes: ${activeNodesCount + 1}/10`);

    return NextResponse.json({ 
      message: 'Security Circle Node captured successfully.', 
      status: 'new_node',
      node: newNode 
    });

  } catch (error) {
    console.error('[MESH-CRITICAL] API Failure:', error);
    return NextResponse.json({ error: 'Internal Server Error. MESH routing failed.' }, { status: 500 });
  }
}