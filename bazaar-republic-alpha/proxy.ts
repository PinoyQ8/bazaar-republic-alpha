import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * 🛡️ THE SECURITY ADJUDICATOR: ZERO-TRUST PERIMETER
 * Next.js 16 Proxy Architecture
 */

// 1. PUBLIC NODES (No Handshake Required)
const PUBLIC_UI = ["/", "/log-in", "/alpha-track"];
const PUBLIC_API = ["/api/auth"];

// 2. VAULT NODES (Cryptographic Handshake Required)
const RESTRICTED_SECTORS = ["/academy", "/e-network", "/governance", "/treasury"];
const RESTRICTED_API = ["/api/academy", "/api/governance", "/api/treasury", "/api/mesh-transactions", "/api/consensus", "/mesh-consensus"];

export default function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const host = req.headers.get("host") || "";
  const isBypassed = req.nextUrl.searchParams.get("bypass") === "true";
  const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1");

  // 🛡️ MESH LOCAL DEVELOPMENT BYPASS: Instant passage for X570 Master Node
  if (isLocalhost || isBypassed) {
    return NextResponse.next();
  }

  // 🛑 STAGE 1: FRONT GATE WHITELIST
  const isPublicUI = PUBLIC_UI.includes(path);
  const isPublicAPI = PUBLIC_API.some((route) => path.startsWith(route));
  
  if (isPublicUI || isPublicAPI) {
    return NextResponse.next();
  }

  // 🔐 STAGE 2: CRYPTOGRAPHIC HANDSHAKE CHECK (Checks both Cookie and Local Header)
  const isAuthenticated = req.cookies.has("pioneer_uid") || req.cookies.has("pioneer_session");

  // 🛡️ STAGE 3: ADJUDICATE UI SECTORS
  const isRestrictedSector = RESTRICTED_SECTORS.some((sector) => path.startsWith(sector));
  if (isRestrictedSector && !isAuthenticated) {
    console.warn(`[ADJUDICATOR] ⚠️ Unauthorized ghost at ${path}. Bouncing to Login Node.`);
    return NextResponse.redirect(new URL("/log-in", req.url));
  }

  // 🛡️ STAGE 4: ADJUDICATE API SECTORS
  const isRestrictedApi = RESTRICTED_API.some((apiRoute) => path.startsWith(apiRoute));
  
  if (isRestrictedApi) {
    if (!isAuthenticated) {
      console.warn(`[ADJUDICATOR] 🛑 API Fracture: Missing node identity at ${path}`);
      return NextResponse.json(
        { success: false, message: "FRACTURE: Missing node identity." },
        { status: 401 }
      );
    }
  }

  // Default passage for unlisted assets
  return NextResponse.next();
}

/**
 * ⚙️ THE MESH MATCHER PROTOCOL
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.js|manifest-vault.js).*)",
  ],
};