import { NextResponse } from "next/server";
import { db } from "../../../../lib/db"; // 🛡️ Database Bridge

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const accessToken = body.accessToken;

    // 🛡️ NEO PROTOCOL OVERRIDE: Local Dev Bypass
    if (process.env.NODE_ENV === "development") {
      console.log("[MESH-BRIDGE] Engaging Local Dev Bypass for PinoyQ8...");
      
      // Pull the actual minted database record we just created
      let devNode = await db.pioneerNode.findUnique({
        where: { uid: "pi_node_founder_99" }
      });

      // Safety fallback
      if (!devNode) {
        devNode = {
          id: "temp",
          uid: "pi_node_founder_99",
          username: "PinoyQ8_Dev",
          mbzrBalance: 0,
          tier: "BAZAAR_FOUNDER",
        } as any;
      }

      return NextResponse.json(devNode, { status: 200 });
    }

    // --- STANDARD PRODUCTION PATH BELOW ---
    if (!accessToken) {
      return NextResponse.json({ error: "Missing Access Token" }, { status: 400 });
    }

    const piApiUrl = "https://api.minepi.com/v2/me";
    const response = await fetch(piApiUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Pi API Error: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error("[AUTH-FAULT] Pi Verify Route Fault:", error);
    return NextResponse.json({ error: "SERVER-LOGIC-FAULT" }, { status: 500 });
  }
}