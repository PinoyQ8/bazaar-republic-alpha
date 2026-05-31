import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // 🛡️ THE MESH OVERRIDE: Legacy MongoDB logging disabled for Neon Migration
  console.log("[MESH-SYNC] Legacy NoSQL logging bypassed.");
  
  return NextResponse.json({ 
    status: "bypassed", 
    message: "Awaiting Drizzle ORM Log Table Migration" 
  });
}
