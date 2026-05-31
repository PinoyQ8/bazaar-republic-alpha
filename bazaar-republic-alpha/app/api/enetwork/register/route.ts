import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // 🛡️ THE MESH OVERRIDE: Legacy E-Network Registration Bypassed
  // Pending migration to Neon Postgres table: 'pioneer_nodes'
  console.log("[MESH-SYNC] Legacy E-Network registration neutralized.");
  
  return NextResponse.json({ 
    status: "bypassed", 
    message: "Registration engine awaiting Drizzle migration" 
  });
}