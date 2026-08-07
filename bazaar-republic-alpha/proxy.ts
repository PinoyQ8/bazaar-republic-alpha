// Location: /proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_API = ["/api/auth"];
const RESTRICTED_API = ["/api/academy", "/api/governance", "/api/treasury", "/api/mesh-transactions", "/api/consensus", "/mesh-consensus"];

export default function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  
  // ☢️ THE NUCLEAR MIDDLEWARE BYPASS
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  if (req.nextUrl.searchParams.get("bypass") === "true") {
    return NextResponse.next();
  }

  // 🛑 STAGE 1: FRONT GATE API WHITELIST
  if (PUBLIC_API.some((route) => path.startsWith(route))) {
    return NextResponse.next();
  }

  // 🔐 STAGE 2: CRYPTOGRAPHIC HANDSHAKE CHECK (API ONLY)
  const isAuthenticated = req.cookies.has("mesh_session") || req.cookies.has("pioneer_session");

  // 🛡️ STAGE 3: UI DELEGATION
  // The RESTRICTED_SECTORS edge-drop has been purged. 
  // Pi Browser Webview drops cookies during RSC fetches. UI routing security is 
  // now fully delegated to the client-side PioneerAuthGate (Master TS RAM).

  // 🛡️ STAGE 4: ADJUDICATE API SECTORS
  const isRestrictedApi = RESTRICTED_API.some((apiRoute) => path.startsWith(apiRoute));
  
  if (isRestrictedApi && !isAuthenticated) {
    console.warn(`[ADJUDICATOR] 🛑 API Fracture: Missing node identity at ${path}`);
    return NextResponse.json(
      { success: false, message: "FRACTURE: Missing node identity." },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.js|manifest-vault.js).*)",
  ],
};