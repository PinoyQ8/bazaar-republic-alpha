import { NextResponse } from 'next/server';
import { db } from '@/app/db'; // Adjust path to your Drizzle DB instance
import { securityCircleNodes } from '../../../db/schema';
import { eq, count } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    // 1. Extract and Validate Payload
    const body = await request.json();
    const { username, walletAddress } = body;

    if (!username || !walletAddress) {
      return NextResponse.json(
        { error: 'MESH REJECTED: Incomplete Pioneer payload.' },
        { status: 400 }
      );
    }

    // Stellar/Pi wallets must start with 'G' and be 56 characters
    if (!walletAddress.startsWith('G') || walletAddress.length !== 56) {
      return NextResponse.json(
        { error: 'MESH REJECTED: Invalid cryptographic signature.' },
        { status: 400 }
      );
    }

    // 2. Check if the Node is already locked in the MESH
    const existingNode = await db
      .select()
      .from(securityCircleNodes)
      .where(eq(securityCircleNodes.walletAddress, walletAddress))
      .limit(1);

    if (existingNode.length > 0) {
      // Node recognized. Allow sync to proceed without incrementing count.
      console.log(`[MESH-SCAN] Authorized Pioneer detected: ${username}`);
      return NextResponse.json({ 
        message: 'Node verified.', 
        status: 'returning_node' 
      });
    }

    // 3. Count Active Nodes (Guardrail)
    const nodeCountResult = await db
      .select({ value: count() })
      .from(securityCircleNodes);
      
    const activeNodes = nodeCountResult[0].value;

    // 4. Enforce the 10-Node Limit
    if (activeNodes >= 10) {
      console.warn(`[MESH-SCAN] Intrusion attempt blocked. Security Circle is locked at 10.`);
      return NextResponse.json(
        { error: 'SECURITY CIRCLE LOCKED: Maximum node capacity (10) reached.' },
        { status: 403 }
      );
    }

    // 5. Lock the new Pioneer into the E-Network
    await db.insert(securityCircleNodes).values({
      username: username,
      walletAddress: walletAddress,
    });

    console.log(`[MESH-SYNC] New Pioneer locked. Total nodes: ${activeNodes + 1}/10`);

    return NextResponse.json({ 
      message: 'Security Circle Node captured successfully.', 
      status: 'new_node' 
    });

  } catch (error: any) {
    console.error('[MESH-CRITICAL] API Failure:', error);
    return NextResponse.json(
      { error: 'Internal Server Error. MESH routing failed.' },
      { status: 500 }
    );
  }
}