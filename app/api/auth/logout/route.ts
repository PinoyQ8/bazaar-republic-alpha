import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    // 🛡️ CRITICAL FIX: Await the cookie Promise before destroying the token
    const cookieStore = await cookies();
    cookieStore.set({
      name: "MESH_AUTH_TOKEN",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0, 
    });

    console.log("[MESH-BRIDGE] ⚠️ Node disconnected. Token destroyed.");

    return NextResponse.json({ 
      success: true, 
      message: "RAM FLUSHED. PERIMETER SECURED." 
    });
    
  } catch (error) {
    console.error("[MESH-BRIDGE] 🚨 Logout route fracture:", error);
    return NextResponse.json(
      { success: false, message: "FATAL: Internal forge error." },
      { status: 500 }
    );
  }
}
