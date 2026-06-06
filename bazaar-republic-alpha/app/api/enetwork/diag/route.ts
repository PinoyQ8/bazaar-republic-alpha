import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ 
    status: "MESH_ALIVE",
    message: "Route is reachable. Database logic is bypassed." 
  });
}