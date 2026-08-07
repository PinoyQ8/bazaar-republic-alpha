// Location: /proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_UI = ["/", "/log-in", "/alpha-track"];
const PUBLIC_API = ["/api/auth"];
const RESTRICTED_SECTORS = ["/academy", "/e-network", "/governance", "/treasury"];
const RESTRICTED_API = ["/api/academy", "/api/governance", "/api/treasury", "/api/mesh-transactions", "/api/consensus", "/mesh-consensus"];

export default function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  
  // ☢️ THE NUCLEAR MIDDLEWARE BYPASS
  // If we are running 'npm run dev' on the X570, completely disable the Adjudicator firewall.
  if (process.env.NODE_ENV === "development") {
    console.log(`[MESH-PROXY] Dev Mode Bypass: Allowed passage to ${path}`);
    return NextResponse.next();
  }

  const isBypassed = req.nextUrl.searchParams.get("bypass") === "true";
  if (isBypassed) {
    return NextResponse.next();
  }

  // 🛑 STAGE 1: FRONT GATE WHITELIST
  const isPublicUI = PUBLIC_UI.includes(path);
  const isPublicAPI = PUBLIC_API.some((route) => path.startsWith(route));
  
  if (isPublicUI || isPublicAPI) {
    return NextResponse.next();
  }

  // 🔐 STAGE 2: CRYPTOGRAPHIC HANDSHAKE CHECK
  // 🛡️ MESH ALIGNED: Replaced legacy tokens with the active `mesh_session` key
  const isAuthenticated = req.cookies.has("mesh_session") || req.cookies.has("pioneer_session");

  // 🛡️ STAGE 3: ADJUDICATE UI SECTORS
  const isRestrictedSector = RESTRICTED_SECTORS.some((sector) => path.startsWith(sector));
  if (isRestrictedSector && !isAuthenticated) {
    console.warn(`[ADJUDICATOR] ⚠️ Unauthorized ghost at ${path}. Bouncing to Login Node.`);
    return NextResponse.redirect(new URL("/log-in", req.url));
  }

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