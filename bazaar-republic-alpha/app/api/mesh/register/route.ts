export const runtime = 'nodejs'; // 🛡️ LOCK TO NODE.JS RUNTIME

import { NextResponse } from 'next/server';
import { prisma } from '@/prisma/client'; // Ensure this matches your directory structure

export async function POST(req: Request) {
    try {
        const body = await req.json();
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
        // Handle unique constraint violations (e.g., duplicate wallet/username)
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Node already exists in the E-Network." }, { status: 409 });
        }

        console.error("❌ MESH CRITICAL ERROR:", error.message);
        return NextResponse.json({ error: "Registration engine failed to forge record." }, { status: 500 });
    }
}