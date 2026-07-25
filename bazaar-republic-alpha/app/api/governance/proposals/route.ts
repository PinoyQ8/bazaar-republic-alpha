import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // 🛡️ Database Bridge

export async function GET() {
  try {
    // 🛡️ Fetch all proposals, sorted by newest first
    const proposals = await prisma.internalProposal.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        votes: true // Optional: pulls vote records if needed for auditing
      }
    });

    return NextResponse.json({ success: true, proposals }, { status: 200 });

  } catch (error) {
    console.error("[MESH-FRACTURE] GET Master Proposals Failed:", error);
    return NextResponse.json({ success: false, error: "SERVER-LOGIC-FAULT" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, authorUid, expiresAt } = body;

    // 1. INBOUND PAYLOAD VALIDATION
    if (!title || !description || !authorUid) {
      return NextResponse.json(
        { success: false, error: 'MALFORMED_PAYLOAD: Missing proposal parameters.' },
        { status: 400 }
      );
    }

    // 2. CREATE NEW PROPOSAL IN PRISMA
    const newProposal = await prisma.internalProposal.create({
      data: {
        title,
        description,
        authorUid,
        status: 'ACTIVE',
        votesFor: 0,
        votesAgainst: 0,
        expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default 7 days
      }
    });

    console.log(`[MESH-SYNC] New Internal Proposal Forged: [${newProposal.id}] by Node [${authorUid}]`);

    return NextResponse.json({ 
      success: true, 
      proposal: newProposal 
    }, { status: 201 });

  } catch (error) {
    console.error("[MESH-FRACTURE] POST Proposal Logic Fault:", error);
    return NextResponse.json({ success: false, error: "SERVER-LOGIC-FAULT" }, { status: 500 });
  }
}