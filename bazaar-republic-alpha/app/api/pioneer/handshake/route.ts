// Location: /app/api/pioneer/handshake/route.ts (or corresponding path)
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// 🛡️ MESH ANCHOR: Prevent multiple Prisma instances during dev reloads
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pioneerId } = body; // Add passkey validation here if required by your frontend

    if (!pioneerId) {
      return NextResponse.json({ error: "Pioneer ID required for handshake." }, { status: 400 });
    }

    // 🛡️ 1. MESH LEDGER VERIFICATION (Prisma/MongoDB)
    let node = await prisma.pioneerNode.findUnique({
      where: { uid: pioneerId },
    });

    // If node doesn't exist, lazily initialize it as a CITIZEN
    if (!node) {
      node = await prisma.pioneerNode.create({
        data: {
          uid: pioneerId,
          status: "ACTIVE",
          tier: "CITIZEN",
        },
      });
    }

    // 🛡️ 2. THE SYNC BRIDGE: Injecting the Auth Cookie
    // This is the critical missing piece. This cookie allows middleware to read your session.
    const response = NextResponse.json({ 
        status: "SUCCESS", 
        message: "Node Verified. Bridge Open.",
        node 
    }, { status: 200 });

    response.cookies.set({
      name: 'mesh_session', // Your middleware must look for this cookie name
      value: pioneerId,
      httpOnly: true, // Secure against client-side XSS
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7-Day Session TTL
    });

    return response;

  } catch (error: any) {
    console.error("❌ MESH CRITICAL ERROR:", error.message);
    return NextResponse.json({ error: "Handshake initialization failed." }, { status: 500 });
  }
}