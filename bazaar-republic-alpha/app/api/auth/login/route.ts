import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, tier } = body;

    if (!username) {
      return NextResponse.json(
        { success: false, message: "FRACTURE: Missing node identity." },
        { status: 400 }
      );
    }

    const sessionHash = `MESH-V23-${username.toUpperCase()}-${Date.now()}`;

    // 🛡️ CRITICAL FIX: Await the cookie Promise before setting the token
    const cookieStore = await cookies();
    cookieStore.set({
      name: "MESH_AUTH_TOKEN", 
      value: sessionHash,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, 
    });

    console.log(`[MESH-BRIDGE] 🟢 Secure token minted for node: ${username}`);

    return NextResponse.json({ 
      success: true, 
      message: "ADJUDICATOR BYPASS GRANTED." 
    });
    
  } catch (error) {
    console.error("[MESH-BRIDGE] 🚨 Login route fracture:", error);
    return NextResponse.json(
      { success: false, message: "FATAL: Internal forge error." },
      { status: 500 }
    );
  }
}