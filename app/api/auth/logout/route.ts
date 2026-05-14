// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Vault Cleared" });

  // 🛡️ THE KILL SWITCH: Set the cookie to expire in the past
  response.cookies.set({
    name: 'mesh_session_token',
    value: '',
    expires: new Date(0), // Sets expiration to 1970
    path: '/',
  });

  return response;
}