// 🛡️ MESH TELEMETRY: HARDWARE DOCKER BRIDGE (UNIFIED DEPLOYMENT)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from "@/lib/mesh-prisma"; // Adjust path to your Prisma client initialization

export const dynamic = 'force-dynamic'; // Ensures Next.js bypasses static compilation or edge caching

const PIONEER_ID = "PinoyQ8-Node-01"; // Hard-coded identity for the X570 core node

/**
 * 🧭 GET: READ TELEMETRY FROM THE LEDGER
 * Fetches the latest live telemetry from the database (Safe for both Local and Vercel edge)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Query the ledger for the primary node state
    const nodeData = await prisma.pioneerNode.findUnique({
      where: { uid: PIONEER_ID }
    });

    if (!nodeData) {
      return NextResponse.json({ 
        status: "STASIS", 
        message: "No node data recorded in ledger. Awaiting initial daemon heartbeat." 
      }, { status: 404 });
    }

    // 2. Format telemetry output for the dashboard viewports
    return NextResponse.json({
      status: "LIVE",
      telemetry: {
        state: nodeData.syncState || "Unknown",
        protocol: `v${nodeData.protocol || "??"}`,
        ledger: nodeData.ledgerHeight || 0,
        lastSeen: nodeData.lastHeartbeat,
        status: nodeData.status,
        peers: {
          total: nodeData.activePeers || 0
        }
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("[TELEMETRY GET FRACTURE]:", error.message);
    return NextResponse.json({ 
      status: "ERROR", 
      message: "Failed to read telemetry ledger from cloud edge." 
    }, { status: 500 });
  }
}

/**
 * 🛰️ POST: INGEST DAEMON HEARTBEATS
 * Receives telemetry from the local X570 push worker and commits it to the database
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Cryptographic Guard Gate
    const hardwareKey = request.headers.get('x-mesh-hardware-key');
    const expectedKey = process.env.PI_API_KEY || 'ALPHA-TEST-KEY';

    if (hardwareKey !== expectedKey) {
      console.warn("[SECURITY BREACH] Unauthorized write attempt on telemetry ingestion port.");
      return NextResponse.json({ 
        status: "LOCKED", 
        message: "Hardware execution write access denied." 
      }, { status: 403 });
    }

    // 2. Extract Data Packets
    const body = await request.json();
    const { ledger, state, peers, protocolVersion } = body;

    // 3. Upsert Data directly into the Prisma Database
    const updatedNode = await prisma.pioneerNode.upsert({
      where: { uid: PIONEER_ID },
      update: {
        ledgerHeight: Number(ledger),
        syncState: state,
        activePeers: Number(peers),
        protocol: protocolVersion?.toString() || "24",
        lastHeartbeat: new Date(),
        status: state === "Synced" || state === "Joining SCP" ? "ONLINE" : "SYNCING"
      },
      create: {
        uid: PIONEER_ID,
        ledgerHeight: Number(ledger),
        syncState: state,
        activePeers: Number(peers),
        protocol: protocolVersion?.toString() || "24",
        lastHeartbeat: new Date(),
        status: "ONLINE"
      }
    });

    return NextResponse.json({ success: true, updated: updatedNode.uid }, { status: 200 });

  } catch (error: any) {
    console.error("[TELEMETRY POST FRACTURE]:", error.message);
    return NextResponse.json({ 
      status: "FRACTURE", 
      message: "Internal ledger insertion write error." 
    }, { status: 500 });
  }
}