import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. 🛡️ SNIFF THE VAULT: Check for the active session cookie
  const session = request.cookies.get('mesh_session_token')?.value;

  // 2. 🛡️ ENFORCE THE BOUNDARY
  // Since the matcher only triggers on protected routes, we only check for the token.
  if (!session) {
    // No Vault Key? Redirect the rogue node back to the Genesis Sector (Hero)
    console.warn(`[MESH-SCAN] Perimeter breach blocked. Rerouting to gateway.`);
    return NextResponse.redirect(new URL('/', request.url));
  }

  // ✅ [SUCCESS] Vault Key verified. Grant passage.
  return NextResponse.next();
}

// 🛡️ MATCHING PROTOCOL: Hyper-optimized to save X570 resources
// Only invokes the Adjudicator on these strict E-Network sectors
export const config = {
  matcher: [
    '/academy/:path*', 
    '/dao/:path*', 
    '/dashboard/:path*'
  ],
};